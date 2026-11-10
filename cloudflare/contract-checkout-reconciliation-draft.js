// Draft-only reconciliation for interrupted contract acceptance.
// No PayPal action, no session reopening, no archive mutation.
// Operator must separately establish why the session was left consuming.
import { readAcceptedCheckoutDraft } from "./contract-checkout-acceptance-draft.js";
const validId = s => typeof s === "string" && /^[A-Za-z0-9_-]{6,100}$/.test(s);
const validHash = s => typeof s === "string" && /^[a-f0-9]{64}$/.test(s);

export async function inspectInterruptedCheckoutDraft({db, checkoutSessionId}) {
  if (!db?.prepare || !validId(checkoutSessionId)) throw new TypeError("Invalid checkout reconciliation context");
  const session = await db.prepare(
    "SELECT claim_id, customer_email, status, snapshot_sha256 FROM contract_checkout_sessions WHERE session_id = ?"
  ).bind(checkoutSessionId).first();
  if (!session || session.status !== "consuming" || session.snapshot_sha256 !== null) {
    throw new Error("No interrupted checkout session eligible for inspection");
  }
  let archive;
  try {
    archive = await readAcceptedCheckoutDraft(db, checkoutSessionId);
  } catch (error) {
    // Missing and corrupt evidence are both HOLD, never reasons to reopen a session.
    return Object.freeze({status:"review_required", checkoutSessionId, action:"Inspect missing or invalid acceptance archive; do not retry acceptance"});
  }
  if (!validHash(archive.snapshotSha256) ||
      archive.snapshot.orderId !== checkoutSessionId ||
      archive.snapshot.customerEmail !== session.customer_email ||
      archive.evidence.checkoutSessionId !== checkoutSessionId ||
      archive.evidence.orderId !== checkoutSessionId ||
      archive.evidence.customerEmail !== session.customer_email ||
      archive.evidence.acceptedAt !== archive.snapshot.acceptedAt ||
      archive.evidence.source !== "server_checkout") {
    throw new Error("Checkout archive and session mismatch");
  }
  return Object.freeze({status:"archived_pending_finalization",checkoutSessionId,
    claimId:session.claim_id,snapshotSha256:archive.snapshotSha256});
}

export async function finalizeInterruptedCheckoutDraft({db, checkoutSessionId, expectedSnapshotSha256}) {
  if (!db?.prepare || !validId(checkoutSessionId) || !validHash(expectedSnapshotSha256))
    throw new TypeError("Invalid checkout finalization context");
  const inspected = await inspectInterruptedCheckoutDraft({db,checkoutSessionId});
  if (inspected.status !== "archived_pending_finalization" ||
      inspected.snapshotSha256 !== expectedSnapshotSha256)
    throw new Error("Verified acceptance archive required");
  // Guarded, idempotency-safe state transition: never reopen or recreate acceptance.
  const result = await db.prepare(
    "UPDATE contract_checkout_sessions SET status = 'accepted', snapshot_sha256 = ?, updated_at = CURRENT_TIMESTAMP WHERE session_id = ? AND claim_id = ? AND customer_email = (SELECT json_extract(snapshot_json, '$.customerEmail') FROM contract_acceptance_archive WHERE order_id = ?) AND status = 'consuming' AND snapshot_sha256 IS NULL AND EXISTS (SELECT 1 FROM contract_acceptance_archive WHERE order_id = ? AND snapshot_sha256 = ?)"
  ).bind(expectedSnapshotSha256,checkoutSessionId,inspected.claimId,
    checkoutSessionId,checkoutSessionId,expectedSnapshotSha256).run();
  if (result.meta?.changes !== 1) throw new Error("Interrupted checkout finalization requires manual review");
  return Object.freeze({status:"accepted",checkoutSessionId,snapshotSha256:expectedSnapshotSha256});
}
