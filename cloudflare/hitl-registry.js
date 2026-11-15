// Owner-only HITL registry. Disabled unless HITL_REGISTRY_ENABLED=true.
// Recording H5 PASS is an internal release decision; this module never emails clients.
const json = (data, status = 200) => Response.json(data, { status,
  headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
const gates = ["H1","H2","H3","H4","H5"];
const hash = async s => new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s)));
async function authorized(request, env) {
  const secret = env.HITL_OWNER_TOKEN;
  if (typeof secret !== "string" || secret.length < 32) return false;
  const auth = request.headers.get("Authorization") || "";
  const supplied = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  const a = await hash(secret), b = await hash(supplied);
  let diff = 0;
  for (let i=0;i<a.length;i++) diff |= a[i]^b[i];
  return supplied.length > 0 && diff === 0;
}
const validSource = v => v === "claim" || v === "service";
const validId = v => Number.isSafeInteger(v) && v > 0;
const validText = (v,max) => typeof v === "string" && v.trim().length > 0 && v.length <= max;
async function latestEvents(env,id) {
  const rows = await env.DB.prepare("SELECT id,gate,decision,evidence_ref,note,actor,created_at FROM hitl_events WHERE case_id = ? ORDER BY id ASC").bind(id).all();
  const latest = {};
  for (const event of rows.results || []) latest[event.gate] = event;
  return { history: rows.results || [], latest };
}
export async function handleHitlRegistry(request,env,url) {
  if (env.HITL_REGISTRY_ENABLED !== "true") return json({error:"Not enabled"},503);
  if (!env.DB || typeof env.HITL_OWNER_TOKEN !== "string" || env.HITL_OWNER_TOKEN.length < 32) return json({error:"Not configured"},503);
  if (!await authorized(request,env)) return json({error:"Unauthorized"},401);
  if (!["GET","POST"].includes(request.method)) return json({error:"Method not allowed"},405);
  if (request.method === "POST" && request.headers.get("Origin") !== url.origin) return json({error:"Forbidden"},403);
  let body = {};
  if (request.method === "POST") {
    if (!(request.headers.get("Content-Type")||"").toLowerCase().startsWith("application/json")) return json({error:"Expected JSON"},415);
    const raw = await request.text();
    if (raw.length > 4000) return json({error:"Too large"},413);
    try { body=JSON.parse(raw); } catch { return json({error:"Invalid JSON"},400); }
    if (!body || typeof body !== "object" || Array.isArray(body)) return json({error:"Invalid JSON"},400);
  }
  const sourceType = request.method === "GET" ? url.searchParams.get("source_type") : body.source_type;
  const sourceId = request.method === "GET" ? Number(url.searchParams.get("source_id")) : body.source_id;
  if (!validSource(sourceType) || !validId(sourceId)) return json({error:"Invalid source"},400);
  try {
    const sourceTable = sourceType === "claim" ? "claims" : "service_requests";
    const exists = await env.DB.prepare("SELECT id FROM "+sourceTable+" WHERE id = ?").bind(sourceId).first();
    if (!exists) return json({error:"Request not found"},404);
    if (request.method === "POST") {
      await env.DB.prepare("INSERT OR IGNORE INTO hitl_cases (source_type,source_id) VALUES (?,?)").bind(sourceType,sourceId).run();
    }
    const record = await env.DB.prepare("SELECT id,source_type,source_id,assessor,status,created_at,updated_at FROM hitl_cases WHERE source_type = ? AND source_id = ?").bind(sourceType,sourceId).first();
    if (!record) return json({error:"No HITL record"},404);
    if (request.method === "POST") {
      if (!gates.includes(body.gate) || !["PASS","HOLD","STOP"].includes(body.decision) ||
          !validText(body.evidence_ref,500) ||
          (body.note !== undefined && body.note !== null && (typeof body.note !== "string" || body.note.length > 1000))) {
        return json({error:"Invalid gate event"},400);
      }
      if (record.status === "STOP" || record.status === "PASS") return json({error:"Case closed; no further events"},409);
      // Fail-closed bridge for identity assurance. Until a verified, case-bound
      // WebAuthn approval flow is implemented, never treat bearer possession as
      // sufficient evidence of human H3/H4/H5 approval.
      if (env.HITL_HUMAN_ATTESTATION_REQUIRED === "true" &&
          body.decision === "PASS" && ["H3","H4","H5"].includes(body.gate)) {
        return json({error:"Verified human attestation required; release on HOLD"},423);
      }

      const before = await latestEvents(env,record.id);
      const gateIndex = gates.indexOf(body.gate);
      if (body.decision === "PASS" && gateIndex > 0 &&
          gates.slice(0,gateIndex).some(g => before.latest[g]?.decision !== "PASS")) {
        return json({error:"Earlier gates have not passed"},409);
      }
      if (body.gate === "H5" && body.decision === "PASS" &&
          gates.slice(0,4).some(g => before.latest[g]?.decision !== "PASS")) {
        return json({error:"H1-H4 must pass before release"},409);
      }
      // SQLite BEFORE/AFTER triggers enforce gate ordering, immutability and case status atomically.
      // The actor is assigned server-side from the controlled case, never accepted from the request.
      const inserted = await env.DB.prepare(
        "INSERT INTO hitl_events (case_id,gate,decision,evidence_ref,note,actor) VALUES (?,?,?,?,?,?)"
      ).bind(record.id,body.gate,body.decision,body.evidence_ref.trim(),body.note || null,record.assessor).run();
      if (!inserted.success || !Number.isInteger(inserted.meta?.changes) || inserted.meta.changes < 1) throw new Error("Event not confirmed");
    }
    const current = await env.DB.prepare("SELECT id,source_type,source_id,assessor,status,created_at,updated_at FROM hitl_cases WHERE id = ?").bind(record.id).first();
    const events = await latestEvents(env,record.id);
    return json({case:current,gates:events.latest,history:events.history});
  } catch (error) {
    console.error("HITL registry unavailable",error?.name);
    return json({error:"Registry unavailable or migration missing"},503);
  }
}
