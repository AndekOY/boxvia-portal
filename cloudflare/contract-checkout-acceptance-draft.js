// Draft-only accepted-checkout archive. NOT imported by production worker.js.
// Payment verification and contract acceptance are separate events.
import { validateContractSnapshot, snapshotSha256 } from "./contract-confirmation.js";
const encode = value => new TextEncoder().encode(value);
const sha = async value => [...new Uint8Array(await crypto.subtle.digest("SHA-256", encode(value)))].map(x=>x.toString(16).padStart(2,"0")).join("");
const orderIdPattern = /^[A-Za-z0-9_-]{6,100}$/;
export async function archiveAcceptedCheckoutDraft({ db, rawSnapshot, evidence, allowUnicode = false }) {
  if (!db?.prepare) throw new TypeError("D1 binding required");
  const snapshot = validateContractSnapshot(rawSnapshot, { allowUnicode });
  if (!orderIdPattern.test(snapshot.orderId)) throw new TypeError("Invalid order ID");
  // Never infer acceptance from payment, a checkbox supplied by a server operator,
  // or a PayPal capture alone. Caller must supply independently verified evidence.
  if (evidence?.verified !== true || evidence?.source !== "server_checkout" ||
      !orderIdPattern.test(evidence.checkoutSessionId || "") ||
      !/^[a-f0-9]{64}$/.test(evidence.acceptanceEventSha256 || "") ||
      evidence.acceptedAt !== snapshot.acceptedAt ||
      evidence.orderId !== snapshot.orderId ||
      evidence.customerEmail !== snapshot.customerEmail) {
    throw new Error("Verified server-side checkout acceptance evidence required");
  }
  const canonical = JSON.stringify(snapshot);
  const hash = await snapshotSha256(snapshot);
  if (hash !== await sha(canonical)) throw new Error("Snapshot hash mismatch");
  const event = JSON.stringify({
    source: evidence.source, checkoutSessionId: evidence.checkoutSessionId,
    acceptanceEventSha256: evidence.acceptanceEventSha256,
    acceptedAt: evidence.acceptedAt, orderId: evidence.orderId,
    customerEmail: evidence.customerEmail
  });
  await db.prepare("INSERT OR IGNORE INTO contract_acceptance_archive (order_id, snapshot_json, snapshot_sha256, acceptance_evidence_json, acceptance_evidence_sha256) VALUES (?, ?, ?, ?, ?)")
    .bind(snapshot.orderId, canonical, hash, event, await sha(event)).run();
  const existing = await db.prepare("SELECT snapshot_json, snapshot_sha256, acceptance_evidence_json, acceptance_evidence_sha256 FROM contract_acceptance_archive WHERE order_id = ?")
    .bind(snapshot.orderId).first();
  if (!existing || existing.snapshot_json !== canonical || existing.snapshot_sha256 !== hash ||
      existing.acceptance_evidence_json !== event || existing.acceptance_evidence_sha256 !== await sha(event)) {
    throw new Error("Immutable checkout acceptance conflict");
  }
  return { orderId: snapshot.orderId, snapshotSha256: hash, status: "archived" };
}
export async function readAcceptedCheckoutDraft(db, orderId) {
  if (!db?.prepare || !orderIdPattern.test(orderId || "")) throw new TypeError("Invalid order ID");
  const row = await db.prepare("SELECT snapshot_json, snapshot_sha256, acceptance_evidence_json, acceptance_evidence_sha256 FROM contract_acceptance_archive WHERE order_id = ?").bind(orderId).first();
  if (!row || await sha(row.snapshot_json) !== row.snapshot_sha256 ||
      await sha(row.acceptance_evidence_json) !== row.acceptance_evidence_sha256) {
    throw new Error("Accepted checkout archive missing or corrupt");
  }
  return { snapshot: validateContractSnapshot(JSON.parse(row.snapshot_json), { allowUnicode: true }),
    evidence: JSON.parse(row.acceptance_evidence_json), snapshotSha256: row.snapshot_sha256 };
}
