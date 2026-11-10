// DRAFT ONLY. Recover a provider-created PayPal order after a failed local D1 link.
// Caller must first obtain authenticated PayPal order evidence and inspect it with
// inspectUncertainPayPalCreateDraft. This function never creates/captures a payment.
import { inspectUncertainPayPalCreateDraft } from "./contract-paypal-reconciliation-draft.js";
const id=s=>typeof s==="string"&&/^[A-Za-z0-9-]{8,64}$/.test(s);
export async function reconcileOrphanPayPalOrderDraft({
 db,checkoutSessionId,candidatePayPalOrderId,fetchPayPalOrder
}) {
 if(!db?.batch||!db?.prepare||!id(candidatePayPalOrderId))
  throw new TypeError("Invalid PayPal recovery context");
 const inspection=await inspectUncertainPayPalCreateDraft({
  db,checkoutSessionId,candidatePayPalOrderId,fetchPayPalOrder
 });
 if(inspection.providerStatus==="COMPLETED"||inspection.providerStatus==="VOIDED")
  throw new Error("Terminal provider order requires payment/void reconciliation, not create-link recovery");
 const attempt=await db.prepare(
  "SELECT request_id,status,paypal_order_id,snapshot_sha256 FROM contract_paypal_create_attempts WHERE checkout_session_id = ? AND claim_id = ?"
 ).bind(checkoutSessionId,inspection.claimId).first();
 if(!attempt||attempt.status!=="reserved"||attempt.paypal_order_id!==null||
    attempt.request_id!=="bxc-"+checkoutSessionId)
  throw new Error("Recovery requires one unresolved reserved attempt");
 // A claim with another PayPal order must not receive a second order.
 const conflicting=await db.prepare(
  "SELECT paypal_order_id FROM paypal_orders WHERE claim_id = ? AND paypal_order_id <> ? LIMIT 1"
 ).bind(inspection.claimId,candidatePayPalOrderId).first();
 if(conflicting)throw new Error("Other PayPal order requires reconciliation");
 const existing=await db.prepare(
  "SELECT claim_id,amount,currency FROM paypal_orders WHERE paypal_order_id = ?"
 ).bind(candidatePayPalOrderId).first();
 if(inspection.linked && !existing)throw new Error("Existing link without PayPal record requires manual review");
 if(existing && !inspection.linked)throw new Error("PayPal record without contract link requires manual review");
 if(existing&&(existing.claim_id!==inspection.claimId||existing.amount!=="20.00"||existing.currency!=="USD"))
  throw new Error("Existing PayPal record mismatch");
 // D1 batch is atomic. The INSERT guards must each change exactly one row;
 // any failure aborts the batch and requires a new read-only inspection.
 const statements=[];
 if(!existing)statements.push(db.prepare(
  "INSERT INTO paypal_orders (claim_id,paypal_order_id,amount,currency,status) VALUES (?,?,'20.00','USD',?)"
 ).bind(inspection.claimId,candidatePayPalOrderId,inspection.providerStatus));
 if(!inspection.linked)statements.push(db.prepare(
  "INSERT INTO contract_paypal_order_links (checkout_session_id,claim_id,paypal_order_id,snapshot_sha256) SELECT ?,?,?,? WHERE EXISTS (SELECT 1 FROM contract_checkout_sessions WHERE session_id = ? AND claim_id = ? AND status = 'accepted' AND snapshot_sha256 = ?)"
 ).bind(checkoutSessionId,inspection.claimId,candidatePayPalOrderId,attempt.snapshot_sha256,
  checkoutSessionId,inspection.claimId,attempt.snapshot_sha256));
 statements.push(db.prepare(
  "UPDATE contract_paypal_create_attempts SET status = 'linked',paypal_order_id = ?,updated_at = CURRENT_TIMESTAMP WHERE checkout_session_id = ? AND claim_id = ? AND request_id = ? AND status = 'reserved' AND paypal_order_id IS NULL AND EXISTS (SELECT 1 FROM contract_paypal_order_links WHERE checkout_session_id = ? AND claim_id = ? AND paypal_order_id = ? AND snapshot_sha256 = ?)"
 ).bind(candidatePayPalOrderId,checkoutSessionId,inspection.claimId,attempt.request_id,
  checkoutSessionId,inspection.claimId,candidatePayPalOrderId,attempt.snapshot_sha256));
 const results=await db.batch(statements);
 if(results.length!==statements.length||results.some(r=>r.success!==true||r.meta?.changes!==1))
  throw new Error("Atomic PayPal recovery not confirmed; manual review required");
 return Object.freeze({status:"linked",claimId:inspection.claimId,
  checkoutSessionId,paypalOrderId:candidatePayPalOrderId,providerStatus:inspection.providerStatus});
}
