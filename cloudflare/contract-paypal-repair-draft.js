// DRAFT ONLY: operator-controlled repair of a verified PayPal Create link.
// No provider create/capture; no claim-paid transition; never exposed as HTTP.
// Operator must independently verify provider provenance before invoking.
import { inspectUncertainPayPalCreateDraft } from "./contract-paypal-reconciliation-draft.js";
const validId=s=>typeof s==="string"&&/^[A-Za-z0-9-]{8,64}$/.test(s);
export async function repairUncertainPayPalCreateDraft({
 db,checkoutSessionId,candidatePayPalOrderId,fetchPayPalOrder,operatorApproved=false
}) {
 if(operatorApproved!==true)throw new Error("Explicit operator approval required");
 if(!db?.batch||!db?.prepare||!validId(candidatePayPalOrderId))throw new TypeError("Invalid repair context");
 const inspected=await inspectUncertainPayPalCreateDraft({
  db,checkoutSessionId,candidatePayPalOrderId,fetchPayPalOrder
 });
 if(inspected.status!=="review_required"||inspected.linked||
    !["CREATED","PAYER_ACTION_REQUIRED","APPROVED"].includes(inspected.providerStatus))
  throw new Error("Repair not eligible; manual incident review required");
 const attempt=await db.prepare(
  "SELECT claim_id,request_id,snapshot_sha256,status,paypal_order_id FROM contract_paypal_create_attempts WHERE checkout_session_id = ?"
 ).bind(checkoutSessionId).first();
 if(!attempt||attempt.status!=="reserved"||attempt.paypal_order_id!==null||
    attempt.claim_id!==inspected.claimId||attempt.request_id!=="bxc-"+checkoutSessionId)
  throw new Error("Attempt changed; manual review required");
 // Atomic D1 batch. Conditional INSERT prevents linking a different accepted
 // session or changing an existing order. Unique constraints reject conflicts.
 const result=await db.batch([
  db.prepare(
   "INSERT INTO paypal_orders (claim_id,paypal_order_id,amount,currency,status) SELECT ?,?,'20.00','USD','CREATED' WHERE EXISTS (SELECT 1 FROM contract_checkout_sessions WHERE session_id = ? AND claim_id = ? AND status = 'accepted' AND snapshot_sha256 = ?) AND EXISTS (SELECT 1 FROM contract_paypal_create_attempts WHERE checkout_session_id = ? AND claim_id = ? AND snapshot_sha256 = ? AND status = 'reserved' AND paypal_order_id IS NULL)"
  ).bind(attempt.claim_id,candidatePayPalOrderId,checkoutSessionId,attempt.claim_id,attempt.snapshot_sha256,
    checkoutSessionId,attempt.claim_id,attempt.snapshot_sha256),
  db.prepare(
   "INSERT INTO contract_paypal_order_links (checkout_session_id,claim_id,paypal_order_id,snapshot_sha256) SELECT ?,?,?,? WHERE EXISTS (SELECT 1 FROM paypal_orders WHERE paypal_order_id = ? AND claim_id = ? AND amount = '20.00' AND currency = 'USD') AND EXISTS (SELECT 1 FROM contract_checkout_sessions WHERE session_id = ? AND claim_id = ? AND status = 'accepted' AND snapshot_sha256 = ?)"
  ).bind(checkoutSessionId,attempt.claim_id,candidatePayPalOrderId,attempt.snapshot_sha256,
    candidatePayPalOrderId,attempt.claim_id,checkoutSessionId,attempt.claim_id,attempt.snapshot_sha256),
  db.prepare(
   "UPDATE contract_paypal_create_attempts SET status = 'linked',paypal_order_id = ?,updated_at = CURRENT_TIMESTAMP WHERE checkout_session_id = ? AND claim_id = ? AND request_id = ? AND snapshot_sha256 = ? AND status = 'reserved' AND paypal_order_id IS NULL AND EXISTS (SELECT 1 FROM contract_paypal_order_links WHERE checkout_session_id = ? AND claim_id = ? AND paypal_order_id = ? AND snapshot_sha256 = ?)"
  ).bind(candidatePayPalOrderId,checkoutSessionId,attempt.claim_id,attempt.request_id,attempt.snapshot_sha256,
    checkoutSessionId,attempt.claim_id,candidatePayPalOrderId,attempt.snapshot_sha256)
 ]);
 if(result.length!==3||result.some(r=>r.success!==true||r.meta?.changes!==1))
  throw new Error("Atomic PayPal repair not confirmed; manual review required");
 return Object.freeze({status:"linked",checkoutSessionId,paypalOrderId:candidatePayPalOrderId,
  claimId:attempt.claim_id,providerStatus:inspected.providerStatus});
}
