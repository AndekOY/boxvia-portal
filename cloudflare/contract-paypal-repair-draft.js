// DRAFT ONLY: operator-approved repair, one atomic SQLite statement.
// Requires contract_paypal_repair_requests_draft.sql migration and its trigger.
// Never creates/captures a PayPal payment or marks a claim paid.
import { inspectUncertainPayPalCreateDraft } from "./contract-paypal-reconciliation-draft.js";
const validId=s=>typeof s==="string"&&/^[A-Za-z0-9-]{8,64}$/.test(s);
export async function repairUncertainPayPalCreateDraft({
 db,checkoutSessionId,candidatePayPalOrderId,fetchPayPalOrder,operatorApproved=false
}) {
 if(operatorApproved!==true)throw new Error("Explicit operator approval required");
 if(!db?.prepare||!validId(candidatePayPalOrderId))throw new TypeError("Invalid repair context");
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
 // A single INSERT fires the repair trigger. SQLite RAISE(ABORT) inside
 // the trigger rolls back all three mutations if ANY invariant fails.
 // If the migration is absent, this fails closed without changing payments.
 const result=await db.prepare(
  "INSERT INTO contract_paypal_repair_requests (checkout_session_id,claim_id,paypal_order_id,snapshot_sha256,request_id) VALUES (?,?,?,?,?)"
 ).bind(checkoutSessionId,attempt.claim_id,candidatePayPalOrderId,
   attempt.snapshot_sha256,attempt.request_id).run();
 if(result.success!==true||result.meta?.changes!==1)
  throw new Error("Atomic PayPal repair not confirmed; manual review required");
 const [link,updated]=await Promise.all([
  db.prepare("SELECT claim_id,snapshot_sha256 FROM contract_paypal_order_links WHERE checkout_session_id = ? AND paypal_order_id = ?")
   .bind(checkoutSessionId,candidatePayPalOrderId).first(),
  db.prepare("SELECT status,paypal_order_id FROM contract_paypal_create_attempts WHERE checkout_session_id = ?")
   .bind(checkoutSessionId).first()
 ]);
 if(link?.claim_id!==attempt.claim_id||link?.snapshot_sha256!==attempt.snapshot_sha256||
    updated?.status!=="linked"||updated.paypal_order_id!==candidatePayPalOrderId)
  throw new Error("Post-repair evidence mismatch; manual review required");
 return Object.freeze({status:"linked",checkoutSessionId,paypalOrderId:candidatePayPalOrderId,
  claimId:attempt.claim_id,providerStatus:inspected.providerStatus});
}
