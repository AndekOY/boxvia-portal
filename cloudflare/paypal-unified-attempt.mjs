// Isolated PayPal attempt reservation. Requires authenticated capability and
// authorizeCommercialPayment(db,order,"paypal") BEFORE invoking.
// Fail closed on existing/ambiguous attempts: never create a second PayPal order.
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
export async function reserveUnifiedPayPalAttempt(db,authorization){
 if(!db||!authorization?.authorized||authorization.provider!=="paypal"||
    authorization.recovery||!uuid.test(authorization.orderId||"")||
    !Number.isSafeInteger(authorization.amountMinor)||authorization.amountMinor<=0||
    authorization.currency!=="USD")throw Error("PayPal attempt not authorized");
 const existing=await db.prepare(
  "SELECT id,status,provider_order_id FROM payment_attempts WHERE order_id = ? AND provider = 'paypal' ORDER BY created_at DESC LIMIT 1"
 ).bind(authorization.orderId).first();
 if(existing)return Object.freeze({created:false,attemptId:existing.id,status:existing.status,providerOrderId:existing.provider_order_id});
 const attemptId=crypto.randomUUID();
 const result=await db.prepare(
  "INSERT OR IGNORE INTO payment_attempts (id,order_id,provider,status,amount_minor,currency) SELECT ?,id,'paypal','created',amount_minor,currency FROM service_orders WHERE id = ? AND status = 'pending' AND amount_minor = ? AND currency = 'USD' AND NOT EXISTS (SELECT 1 FROM payment_attempts WHERE order_id = ? AND provider = 'paypal')"
 ).bind(attemptId,authorization.orderId,authorization.amountMinor,authorization.orderId).run();
 if(!result?.success||result.meta?.changes!==1)throw Error("PayPal attempt conflict: manual reconciliation");
 return Object.freeze({created:true,attemptId,status:"created",providerOrderId:null});
}
export async function persistUnifiedPayPalProviderOrder(db,authorization,attemptId,providerOrderId){
 if(!db||!authorization?.authorized||authorization.provider!=="paypal"||
    !uuid.test(authorization.orderId||"")||!uuid.test(attemptId||"")||
    !/^[A-Za-z0-9-]{8,64}$/.test(providerOrderId||"")||
    !Number.isSafeInteger(authorization.amountMinor)||authorization.amountMinor<=0||
    authorization.currency!=="USD")throw Error("Invalid PayPal provider binding");
 const results=await db.batch([
  db.prepare(
   "UPDATE payment_attempts SET provider_order_id = ?,status = 'pending' WHERE id = ? AND order_id = ? AND provider = 'paypal' AND status = 'created' AND provider_order_id IS NULL AND amount_minor = ? AND currency = 'USD'"
  ).bind(providerOrderId,attemptId,authorization.orderId,authorization.amountMinor),
  db.prepare(
   "UPDATE service_orders SET status = 'checkout',updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status = 'pending' AND amount_minor = ? AND currency = 'USD' AND EXISTS (SELECT 1 FROM payment_attempts WHERE id = ? AND order_id = ? AND provider = 'paypal' AND provider_order_id = ? AND status = 'pending')"
  ).bind(authorization.orderId,authorization.amountMinor,attemptId,authorization.orderId,providerOrderId)
 ]);
 if(!Array.isArray(results)||results.length!==2||results.some(x=>x?.success!==true)||
    results[0].meta?.changes!==1||results[1].meta?.changes!==1)
  throw Error("PayPal provider binding not confirmed; manual reconciliation");
 return Object.freeze({attemptId,providerOrderId,orderId:authorization.orderId,status:"checkout"});
}
