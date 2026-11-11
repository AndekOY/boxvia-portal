// Read-only, metadata-only polling for the owner's Gmail Apps Script.
// Disabled unless explicitly enabled; never return customer emails or claim contents.
const response = (body, status = 200) => Response.json(body, {
  status,
  headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" }
});

async function sameSecret(a, b) {
  if (!a || !b) return false;
  const enc = new TextEncoder();
  const [x, y] = await Promise.all([a, b].map(async s =>
    new Uint8Array(await crypto.subtle.digest("SHA-256", enc.encode(s)))));
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}

export async function handleOwnerNotificationPoll(request, env) {
  if (env.OWNER_NOTIFICATIONS_ENABLED !== "true" || !env.DB || !env.OWNER_NOTIFICATION_TOKEN) {
    return response({ error: "Unavailable" }, 503);
  }
  const auth = request.headers.get("Authorization") || "";
  if (!auth.startsWith("Bearer ") || !(await sameSecret(auth.slice(7), env.OWNER_NOTIFICATION_TOKEN))) {
    return response({ error: "Unauthorized" }, 401);
  }
  const url = new URL(request.url);
  const parseCursor = name => {
    const v = url.searchParams.get(name) || "0";
    return /^(0|[1-9]\d{0,12})$/.test(v) ? Number(v) : null;
  };
  const claimAfter = parseCursor("claims_after");
  const serviceAfter = parseCursor("services_after");
  if (claimAfter === null || serviceAfter === null) return response({ error: "Invalid cursor" }, 400);
  try {
    const [claims, services] = await Promise.all([
      env.DB.prepare("SELECT id FROM claims WHERE id > ? ORDER BY id ASC LIMIT 100").bind(claimAfter).all(),
      env.DB.prepare("SELECT id, service_code FROM service_requests WHERE id > ? ORDER BY id ASC LIMIT 100").bind(serviceAfter).all()
    ]);
    return response({
      claims: claims.results.map(r => ({ id: r.id })),
      services: services.results.map(r => ({ id: r.id, code: r.service_code }))
    });
  } catch {
    return response({ error: "Database unavailable" }, 503);
  }
}
