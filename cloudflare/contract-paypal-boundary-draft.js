// DRAFT ONLY. PayPal create/capture boundary, not imported by worker.js.
// Call these guards inside both existing handlers after claim capability auth.
// They do not call PayPal or mutate a payment.
import { requireAcceptedCheckoutForPayPalDraft } from "./contract-paypal-acceptance-gate-draft.js";
const paypalId = s => typeof s === "string" && /^[A-Za-z0-9-]{8,64}$/.test(s);
export async function preflightPayPalCreateDraft(input) {
  const acceptance = await requireAcceptedCheckoutForPayPalDraft(input);
  const existing = await input.db.prepare(
    "SELECT paypal_order_id, checkout_session_id, snapshot_sha256 FROM contract_paypal_order_links WHERE claim_id = ? ORDER BY created_at DESC LIMIT 1"
  ).bind(input.claimId).first();
  // Never reuse an order belonging to another acceptance; no second order
  // until any previous linked order has been reconciled.
  if (existing && (existing.checkout_session_id !== acceptance.checkoutSessionId ||
      existing.snapshot_sha256 !== acceptance.snapshotSha256)) {
    throw new Error("Previous PayPal order requires reconciliation");
  }
  return Object.freeze({ ...acceptance, existingPayPalOrderId: existing?.paypal_order_id || null });
}
export async function persistCreatedPayPalOrderDraft({db,preflight,paypalOrderId}) {
  if (!db?.batch || !preflight || !paypalId(paypalOrderId) ||
      !/^[a-f0-9]{64}$/.test(preflight.snapshotSha256 || "")) {
    throw new TypeError("Invalid PayPal order persistence context");
  }
  if (preflight.existingPayPalOrderId) {
    if (preflight.existingPayPalOrderId !== paypalOrderId) throw new Error("PayPal order ID conflict");
    return { paypalOrderId, status:"linked" };
  }
  // D1 batch is atomic. A PayPal order created before this DB commit may be
  // orphaned if D1 fails: return an error and require provider reconciliation.
  const results = await db.batch([
    db.prepare("INSERT INTO paypal_orders (claim_id, paypal_order_id, amount, currency, status) VALUES (?, ?, '20.00', 'USD', 'CREATED')")
      .bind(preflight.claimId,paypalOrderId),
    db.prepare("INSERT INTO contract_paypal_order_links (checkout_session_id, claim_id, paypal_order_id, snapshot_sha256) SELECT ?, ?, ?, ? WHERE EXISTS (SELECT 1 FROM contract_checkout_sessions WHERE session_id = ? AND claim_id = ? AND status = 'accepted' AND snapshot_sha256 = ?)")
      .bind(preflight.checkoutSessionId,preflight.claimId,paypalOrderId,preflight.snapshotSha256,
        preflight.checkoutSessionId,preflight.claimId,preflight.snapshotSha256)
  ]);
  if (results.length !== 2 || results.some(r => r.success !== true) ||
      results[0].meta?.changes !== 1 || results[1].meta?.changes !== 1) {
    throw new Error("PayPal order linkage not committed; reconciliation required");
  }
  return { paypalOrderId, status:"linked" };
}
export async function preflightPayPalCaptureDraft({...input}) {
  const acceptance = await requireAcceptedCheckoutForPayPalDraft(input);
  if (!paypalId(input.paypalOrderId)) throw new TypeError("Invalid PayPal order ID");
  const row = await input.db.prepare(
    "SELECT p.claim_id, p.paypal_order_id, p.amount, p.currency, l.checkout_session_id, l.snapshot_sha256 FROM paypal_orders p JOIN contract_paypal_order_links l ON l.paypal_order_id = p.paypal_order_id AND l.claim_id = p.claim_id WHERE p.paypal_order_id = ? AND p.claim_id = ?"
  ).bind(input.paypalOrderId,input.claimId).first();
  if (!row || row.claim_id !== acceptance.claimId ||
      row.paypal_order_id !== input.paypalOrderId ||
      row.checkout_session_id !== acceptance.checkoutSessionId ||
      row.snapshot_sha256 !== acceptance.snapshotSha256 ||
      row.amount !== "20.00" || row.currency !== "USD") {
    throw new Error("PayPal capture denied: accepted checkout linkage mismatch");
  }
  return Object.freeze({ ...acceptance, paypalOrderId: input.paypalOrderId });
}
// Production wiring: reject legacy unlinked orders, check this gate before
// PayPal capture and after provider verification; do not mark claims paid from
// contract acceptance alone. Payment status still comes only from PayPal.
