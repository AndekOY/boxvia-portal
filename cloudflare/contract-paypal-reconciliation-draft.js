// DRAFT ONLY: evidence-based inspection of uncertain PayPal create attempts.
// Never creates/captures a payment, reopens a reservation or marks a claim paid.
// Operator must supply a candidate PayPal order ID from an authenticated source.
const paypalId=s=>typeof s==="string"&&/^[A-Za-z0-9-]{8,64}$/.test(s);
const sessionId=s=>typeof s==="string"&&/^[A-Za-z0-9_-]{6,100}$/.test(s);
export async function inspectUncertainPayPalCreateDraft({
 db,checkoutSessionId,candidatePayPalOrderId,fetchPayPalOrder
}) {
 if(!db?.prepare||!sessionId(checkoutSessionId)||!paypalId(candidatePayPalOrderId)||
    typeof fetchPayPalOrder!=="function")throw new TypeError("Invalid reconciliation context");
 const attempt=await db.prepare(
  "SELECT claim_id,request_id,snapshot_sha256,status,paypal_order_id FROM contract_paypal_create_attempts WHERE checkout_session_id = ?"
 ).bind(checkoutSessionId).first();
 if(!attempt||!["reserved","linked","review_required"].includes(attempt.status)||
    !/^[a-f0-9]{64}$/.test(attempt.snapshot_sha256||""))
  throw new Error("No verifiable PayPal attempt");
 const session=await db.prepare(
  "SELECT claim_id,status,snapshot_sha256 FROM contract_checkout_sessions WHERE session_id = ?"
 ).bind(checkoutSessionId).first();
 if(!session||session.claim_id!==attempt.claim_id||session.status!=="accepted"||
    session.snapshot_sha256!==attempt.snapshot_sha256)
  throw new Error("Acceptance linkage mismatch");
 const order=await fetchPayPalOrder(candidatePayPalOrderId);
 if(!order||order.id!==candidatePayPalOrderId||
    !["CREATED","PAYER_ACTION_REQUIRED","APPROVED","COMPLETED","VOIDED"].includes(order.status)||
    !Array.isArray(order.purchase_units)||order.purchase_units.length!==1)
  throw new Error("PayPal order evidence invalid");
 const unit=order.purchase_units[0];
 if(unit.custom_id!==String(attempt.claim_id)||unit.amount?.currency_code!=="USD"||
    unit.amount?.value!=="20.00")throw new Error("PayPal amount or claim mismatch");
 if(attempt.paypal_order_id&&attempt.paypal_order_id!==candidatePayPalOrderId)
  throw new Error("PayPal order conflict");
 const link=await db.prepare(
  "SELECT checkout_session_id,claim_id,snapshot_sha256 FROM contract_paypal_order_links WHERE paypal_order_id = ?"
 ).bind(candidatePayPalOrderId).first();
 if(link&&(link.checkout_session_id!==checkoutSessionId||
   link.claim_id!==attempt.claim_id||link.snapshot_sha256!==attempt.snapshot_sha256))
  throw new Error("PayPal link conflict");
 // Evidence only. No mutation, even when the provider confirms an order.
 return Object.freeze({status:"review_required",checkoutSessionId,
  claimId:attempt.claim_id,paypalOrderId:candidatePayPalOrderId,
  providerStatus:order.status,linked:!!link,
  action:link?"Review existing linkage and close incident manually":
    "Verify provider provenance and reconcile missing D1 linkage manually"});
}
