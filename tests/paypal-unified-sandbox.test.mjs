import test from "node:test";
import assert from "node:assert/strict";
import {buildUnifiedPayPalOrder,inspectUnifiedPayPalCapture} from "../cloudflare/paypal-unified-sandbox.mjs";
const orderId="fe2c77c4-1abd-4ab9-ae1e-c57f0b583a34",attemptId="89c35f1e-8a3d-47aa-a2c8-0ac837ed24e1";
const authorization={authorized:true,provider:"paypal",orderId,amountMinor:5000,currency:"USD",recovery:false};
const expected={orderId,attemptId,providerOrderId:"PAYPALTEST123",amountMinor:5000,currency:"USD"};
function capture(){return {id:expected.providerOrderId,status:"COMPLETED",purchase_units:[{
 reference_id:attemptId,custom_id:orderId,amount:{currency_code:"USD",value:"50.00"},
 payments:{captures:[{id:"CAPTURE12345",status:"COMPLETED",amount:{currency_code:"USD",value:"50.00"}}]}
}]};}
test("unified PayPal create payload uses only authorized order and final USD amount",()=>{
 const p=buildUnifiedPayPalOrder(authorization,attemptId,"https://boxvia-orders-sandbox.andeks.workers.dev");
 assert.equal(p.intent,"CAPTURE");
 assert.deepEqual(p.purchase_units,[{reference_id:attemptId,custom_id:orderId,amount:{currency_code:"USD",value:"50.00"}}]);
 assert.match(p.payment_source.paypal.experience_context.return_url,/provider=paypal/);
});
test("unified PayPal payload rejects missing authorization, forged price, unsafe redirect and recovery",()=>{
 for(const a of [{...authorization,authorized:false},{...authorization,amountMinor:-1},{...authorization,recovery:true},{...authorization,currency:"EUR"}])
  assert.throws(()=>buildUnifiedPayPalOrder(a,attemptId,"https://boxvia-orders-sandbox.andeks.workers.dev"));
 assert.throws(()=>buildUnifiedPayPalOrder(authorization,attemptId,"http://example.com"));
 assert.throws(()=>buildUnifiedPayPalOrder(authorization,attemptId,"https://example.com/path"));
});
test("verified capture binds PayPal order, attempt, service order, amount and currency",()=>{
 assert.deepEqual(inspectUnifiedPayPalCapture(capture(),expected),{
  provider:"paypal",orderId,attemptId,providerOrderId:expected.providerOrderId,captureId:"CAPTURE12345",amountMinor:5000,currency:"USD"
 });
});
test("PayPal capture rejects mismatches, pending state, duplicate captures and forged currency",()=>{
 const mutations=[
  x=>x.id="OTHERORDER123",x=>x.status="APPROVED",
  x=>x.purchase_units[0].custom_id="other",
  x=>x.purchase_units[0].reference_id="other",
  x=>x.purchase_units[0].amount.value="20.00",
  x=>x.purchase_units[0].payments.captures[0].amount.value="20.00",
  x=>x.purchase_units[0].payments.captures[0].status="PENDING",
  x=>x.purchase_units[0].payments.captures[0].amount.currency_code="EUR",
  x=>x.purchase_units[0].payments.captures.push({...x.purchase_units[0].payments.captures[0]})
 ];
 for(const mutate of mutations){const x=capture();mutate(x);assert.equal(inspectUnifiedPayPalCapture(x,expected),null);}
});
