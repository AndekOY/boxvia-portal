// Draft-only manual reconciliation: no API calls, no retries, no production route.
// Evidence must be independently checked by an operator before this function is called.
const ORDER = /^[A-Za-z0-9_-]{6,100}$/;
const MESSAGE = /^[A-Za-z0-9_-]{5,150}$/;
export async function reconcileProviderAcceptedStaging({ db, orderId, resendMessageId, evidence }) {
  if (!db?.prepare || !ORDER.test(orderId || "") || !MESSAGE.test(resendMessageId || "")) {
    throw new TypeError("Invalid reconciliation request");
  }
  if (!evidence || evidence.verified !== true ||
      evidence.source !== "resend_authenticated" ||
      evidence.orderId !== orderId || evidence.resendMessageId !== resendMessageId ||
      typeof evidence.checkedAt !== "string" ||
      !/^\d{4}-\d{2}-\d{2}T/.test(evidence.checkedAt) ||
      typeof evidence.reference !== "string" || evidence.reference.length < 8) {
    throw new Error("Independent authenticated provider evidence required");
  }
  const row = await db.prepare(
    "SELECT order_id, email_status, resend_message_id FROM contract_confirmations WHERE order_id = ?"
  ).bind(orderId).first();
  if (!row) throw new Error("Unknown order");
  if (row.email_status === "provider_accepted" && row.resend_message_id === resendMessageId) {
    return { status: "already_reconciled", orderId };
  }
  if (row.email_status !== "sending" || row.resend_message_id) {
    throw new Error("Reconciliation state conflict");
  }
  const result = await db.prepare(
    "UPDATE contract_confirmations SET email_status = 'provider_accepted', resend_message_id = ?, email_accepted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE order_id = ? AND email_status = 'sending' AND resend_message_id IS NULL"
  ).bind(resendMessageId, orderId).run();
  if (result.meta?.changes !== 1) throw new Error("Concurrent reconciliation conflict");
  return { status: "provider_accepted", orderId, resendMessageId };
}
// If provider evidence cannot establish acceptance or non-acceptance, leave
// status 'sending'. No reset-to-pending or automatic resend is exposed.
