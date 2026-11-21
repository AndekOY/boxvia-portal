// Sandbox-only PayPal settlement. Caller must authenticate the PayPal API response
// and match a server-created payment_attempt; this module never contacts PayPal.
// No HTTP route or production binding.
import {inspectUnifiedPayPalCapture} from "./paypal-unified-sandbox.mjs";
export async function settleVerifiedUnifiedPayPalCapture(db,providerOrder,expected){
 if(!db||!expected)return {outcome:"rejected"};
 const verified=inspectUnifiedPayPalCapture(providerOrder,expected);
 if(!verified)return {outcome:"rejected"};
 const order=await db.prepare(
  "SELECT id,amount_minor,currency,status FROM service_orders WHERE id = ?"
 ).bind(verified.orderId).first();
 if(!order||order.amount_minor!==verified.amountMinor||order.currency!==verified.currency)
  return {outcome:"order_mismatch"};
 const attempt=await db.prepare(
  "SELECT id,order_id,provider_order_id,provider_payment_id,amount_minor,currency,status FROM payment_attempts WHERE id = ? AND provider = 'paypal'"
 ).bind(verified.attemptId).first();
 if(!attempt||attempt.order_id!==verified.orderId||
    attempt.provider_order_id!==verified.providerOrderId||
    attempt.amount_minor!==verified.amountMinor||attempt.currency!==verified.currency||
    !["created","pending","verified"].includes(attempt.status))
  return {outcome:"unmatched_attempt"};
 if(order.status!=="checkout"){
  if(order.status==="paid"&&attempt.status==="verified"&&attempt.provider_payment_id===verified.captureId){
   const proof=JSON.stringify([verified.providerOrderId,verified.captureId,verified.orderId,verified.attemptId,verified.amountMinor,verified.currency]);
   const digest=Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(proof))),b=>b.toString(16).padStart(2,"0")).join("");
   const evidence=await db.prepare(
    "SELECT capture_id FROM paypal_capture_evidence WHERE capture_id = ? AND paypal_order_id = ? AND order_id = ? AND payment_attempt_id = ? AND amount_minor = ? AND currency = ? AND capture_digest = ?"
   ).bind(verified.captureId,verified.providerOrderId,order.id,attempt.id,order.amount_minor,order.currency,digest).first();
   const fulfillment=await db.prepare(
    "SELECT id FROM fulfillment_outbox WHERE order_id = ?"
   ).bind(order.id).first();
   if(evidence&&fulfillment)return {outcome:"already_processed",orderId:order.id};
  }
  return {outcome:"manual_review",orderId:order.id};
 }
 const proof=JSON.stringify([verified.providerOrderId,verified.captureId,verified.orderId,verified.attemptId,verified.amountMinor,verified.currency]);
 const proofHash=Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(proof))),b=>b.toString(16).padStart(2,"0")).join("");
 const statements=[
  db.prepare(
   "UPDATE service_orders SET status = 'paid',paid_at = CURRENT_TIMESTAMP,updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status = 'checkout' AND amount_minor = ? AND currency = 'USD' AND EXISTS (SELECT 1 FROM payment_attempts WHERE id = ? AND order_id = ? AND provider = 'paypal' AND provider_order_id = ? AND amount_minor = ? AND currency = 'USD' AND status IN ('created','pending') AND provider_payment_id IS NULL)"
  ).bind(order.id,order.amount_minor,attempt.id,order.id,verified.providerOrderId,order.amount_minor),
  db.prepare(
   "UPDATE payment_attempts SET status = 'verified',provider_payment_id = ?,verified_at = CURRENT_TIMESTAMP WHERE id = ? AND order_id = ? AND provider = 'paypal' AND provider_order_id = ? AND amount_minor = ? AND currency = 'USD' AND status IN ('created','pending') AND provider_payment_id IS NULL AND EXISTS (SELECT 1 FROM service_orders WHERE id = ? AND status = 'paid')"
  ).bind(verified.captureId,attempt.id,order.id,verified.providerOrderId,order.amount_minor,order.id),
  db.prepare(
   "INSERT INTO paypal_capture_evidence (capture_id,paypal_order_id,order_id,payment_attempt_id,amount_minor,currency,capture_digest) SELECT ?,?,?,?,?,?,? WHERE EXISTS (SELECT 1 FROM service_orders WHERE id = ? AND status = 'paid') AND EXISTS (SELECT 1 FROM payment_attempts WHERE id = ? AND order_id = ? AND provider = 'paypal' AND provider_order_id = ? AND provider_payment_id = ? AND status = 'verified')"
  ).bind(verified.captureId,verified.providerOrderId,order.id,attempt.id,order.amount_minor,order.currency,proofHash,order.id,attempt.id,order.id,verified.providerOrderId,verified.captureId),
  db.prepare(
   "INSERT OR IGNORE INTO fulfillment_outbox (id,order_id,status) SELECT ?,id,'pending' FROM service_orders WHERE id = ? AND status = 'paid' AND EXISTS (SELECT 1 FROM payment_attempts WHERE id = ? AND order_id = ? AND provider = 'paypal' AND provider_order_id = ? AND provider_payment_id = ? AND status = 'verified') AND EXISTS (SELECT 1 FROM paypal_capture_evidence WHERE capture_id = ? AND order_id = ? AND payment_attempt_id = ? AND capture_digest = ?)"
  ).bind(crypto.randomUUID(),order.id,attempt.id,order.id,verified.providerOrderId,verified.captureId,verified.captureId,order.id,attempt.id,proofHash)
 ];
 const results=await db.batch(statements);
 if(!Array.isArray(results)||results.length!==4||results.some(x=>x?.success!==true))
  throw new Error("PayPal settlement transaction not confirmed");
 if(results[0]?.meta?.changes!==1||results[1]?.meta?.changes!==1||results[2]?.meta?.changes!==1)
  throw new Error("PayPal capture settlement requires manual reconciliation");
 return {outcome:"paid",orderId:order.id,captureId:verified.captureId};
}
