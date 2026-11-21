// Isolated unified-orders PayPal Sandbox adapter.
// NOT mounted on an HTTP route. No credentials, network calls, or D1 writes.
// The caller must authenticate the order capability and call
// authorizeCommercialPayment(db, order, "paypal") before using this adapter.
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const providerId=/^[A-Za-z0-9-]{8,64}$/;
const money=(minor)=>{if(!Number.isSafeInteger(minor)||minor<=0)return null;return (minor/100).toFixed(2);};
export function buildUnifiedPayPalOrder(authorization,attemptId,returnOrigin){
 if(!authorization?.authorized||authorization.provider!=="paypal"||authorization.recovery||
    !uuid.test(authorization.orderId||"")||!uuid.test(attemptId||"")||
    authorization.currency!=="USD")throw Error("PayPal authorization required");
 const value=money(authorization.amountMinor);
 if(!value)throw Error("Invalid server-side PayPal amount");
 const origin=new URL(returnOrigin);
 if(origin.protocol!=="https:"||origin.origin!==returnOrigin)throw Error("Unsafe return origin");
 return Object.freeze({
  intent:"CAPTURE",
  purchase_units:[{reference_id:attemptId,custom_id:authorization.orderId,
    amount:{currency_code:"USD",value}}],
  payment_source:{paypal:{experience_context:{
    return_url:origin.origin+"/api/orders/return?provider=paypal",
    cancel_url:origin.origin+"/api/orders/return?provider=paypal&cancelled=1",
    user_action:"PAY_NOW"
  }}}
 });
}
export function inspectUnifiedPayPalCapture(providerOrder,expected){
 if(!expected||!uuid.test(expected.orderId||"")||
    !uuid.test(expected.attemptId||"")||!providerId.test(expected.providerOrderId||"")||
    !Number.isSafeInteger(expected.amountMinor)||expected.amountMinor<=0||
    expected.currency!=="USD")return null;
 if(!providerOrder||providerOrder.id!==expected.providerOrderId||
    providerOrder.status!=="COMPLETED"||!Array.isArray(providerOrder.purchase_units)||
    providerOrder.purchase_units.length!==1)return null;
 const unit=providerOrder.purchase_units[0],captures=unit?.payments?.captures;
 if(unit.custom_id!==expected.orderId||unit.reference_id!==expected.attemptId||
    unit.amount?.currency_code!=="USD"||unit.amount?.value!==money(expected.amountMinor)||
    !Array.isArray(captures)||captures.length!==1)return null;
 const capture=captures[0];
 if(!providerId.test(capture?.id||"")||capture.status!=="COMPLETED"||
    capture.amount?.currency_code!=="USD"||
    capture.amount?.value!==money(expected.amountMinor))return null;
 return Object.freeze({provider:"paypal",orderId:expected.orderId,
  attemptId:expected.attemptId,providerOrderId:expected.providerOrderId,
  captureId:capture.id,amountMinor:expected.amountMinor,currency:"USD"});
}
