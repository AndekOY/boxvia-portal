import test from "node:test";
import assert from "node:assert/strict";
import {createUnifiedPayPalSandboxOrder,captureUnifiedPayPalSandboxOrder,reconcileUnifiedPayPalSandboxOrder,retrieveExistingUnifiedPayPalSandboxCheckout} from "../cloudflare/paypal-unified-api.mjs";
const orderId="fe2c77c4-1abd-4ab9-ae1e-c57f0b583a34",attemptId="89c35f1e-8a3d-47aa-a2c8-0ac837ed24e1";
const authorization={authorized:true,provider:"paypal",orderId,amountMinor:5000,currency:"USD",recovery:false};
const expected={orderId,attemptId,providerOrderId:"PAYPALTEST123",amountMinor:5000,currency:"USD"};
const env={PAYPAL_MODE:"sandbox",PAYPAL_UNIFIED_TEST_ENABLED:"true",PAYPAL_SANDBOX_CLIENT_ID:"sandbox-client-123",PAYPAL_SANDBOX_CLIENT_SECRET:"sandbox-secret-123"};
const token={access_token:"sandbox-access-token-123",token_type:"Bearer"};
function provider(status="COMPLETED"){return {id:expected.providerOrderId,status,purchase_units:[{
 reference_id:attemptId,custom_id:orderId,amount:{currency_code:"USD",value:"50.00"},
 payments:{captures:[{id:"CAPTURE12345",status:"COMPLETED",amount:{currency_code:"USD",value:"50.00"}}]}
}]};}
const json=(body,status=200)=>({ok:status>=200&&status<300,status,json:async()=>body});
test("sandbox create sends OAuth and server-authorized amount with idempotency",async()=>{
 const calls=[];
 const request=async(url,opts)=>{calls.push({url,opts});return url.endsWith("/token")?json(token):json({
  id:expected.providerOrderId,status:"CREATED",intent:"CAPTURE",
  purchase_units:[{reference_id:attemptId,custom_id:orderId,amount:{currency_code:"USD",value:"50.00"}}],
  links:[{rel:"payer-action",href:"https://www.sandbox.paypal.com/checkoutnow?token=PAYPALTEST123"}]
 });};
 const result=await createUnifiedPayPalSandboxOrder(env,authorization,attemptId,"https://boxvia-orders-sandbox.andeks.workers.dev",request);
 assert.equal(result.providerOrderId,expected.providerOrderId);
 assert.equal(calls.length,2);
 assert.equal(calls[0].url,"https://api-m.sandbox.paypal.com/v1/oauth2/token");
 assert.equal(calls[1].opts.headers["PayPal-Request-Id"],"boxvia-"+attemptId);
 assert.equal(JSON.parse(calls[1].opts.body).purchase_units[0].amount.value,"50.00");
});
test("sandbox credentials and test flag required before network access",async()=>{
 let calls=0;const request=async()=>{calls++;throw Error("Network forbidden");};
 await assert.rejects(()=>createUnifiedPayPalSandboxOrder({...env,PAYPAL_UNIFIED_TEST_ENABLED:"false"},authorization,attemptId,"https://boxvia-orders-sandbox.andeks.workers.dev",request),/disabled/);
 assert.equal(calls,0);
});
test("provider response amount mismatch and hostile approval URL rejected",async()=>{
 for(const variant of ["amount","url"]){
  const request=async(url)=>url.endsWith("/token")?json(token):json({
   id:expected.providerOrderId,status:"CREATED",intent:"CAPTURE",
   purchase_units:[{reference_id:attemptId,custom_id:orderId,amount:{currency_code:"USD",value:variant==="amount"?"20.00":"50.00"}}],
   links:[{rel:"approve",href:variant==="url"?"https://evil.example/checkoutnow":"https://www.sandbox.paypal.com/checkoutnow?token=PAYPALTEST123"}]
  });
  await assert.rejects(()=>createUnifiedPayPalSandboxOrder(env,authorization,attemptId,"https://boxvia-orders-sandbox.andeks.workers.dev",request),/mismatch|Untrusted/);
 }
});
test("capture requires complete provider response and stable idempotency",async()=>{
 const calls=[];const request=async(url,opts)=>{calls.push({url,opts});return url.endsWith("/token")?json(token):json(provider());};
 const result=await captureUnifiedPayPalSandboxOrder(env,expected,request);
 assert.equal(result.verified.captureId,"CAPTURE12345");
 assert.equal(calls[1].opts.headers["PayPal-Request-Id"],"boxvia-capture-"+attemptId);
 assert.match(calls[1].url,/PAYPALTEST123\/capture$/);
});
test("reconciliation is read-only and never infers paid from approval",async()=>{
 const calls=[];const request=async(url,opts)=>{calls.push({url,opts});return url.endsWith("/token")?json(token):json(provider("APPROVED"));};
 const result=await reconcileUnifiedPayPalSandboxOrder(env,expected,request);
 assert.equal(result.verified,null);
 assert.equal(calls[1].opts.method,"GET");
 assert.equal(calls[1].opts.body,undefined);
});

test("PayPal checkout recovery only GETs existing provider order and returns validated sandbox URL",async()=>{
 const calls=[];
 const request=async(url,opts)=>{calls.push({url,opts});return url.endsWith("/token")?json(token):json({
  id:expected.providerOrderId,status:"CREATED",intent:"CAPTURE",
  purchase_units:[{reference_id:attemptId,custom_id:orderId,amount:{currency_code:"USD",value:"50.00"}}],
  links:[{rel:"payer-action",href:"https://www.sandbox.paypal.com/checkoutnow?token=PAYPALTEST123"}]
 });};
 const recovered=await retrieveExistingUnifiedPayPalSandboxCheckout(env,expected,request);
 assert.equal(recovered.status,"CREATED");
 assert.match(recovered.checkoutUrl,/sandbox.paypal.com\/checkoutnow/);
 assert.equal(calls.length,2);
 assert.equal(calls[1].opts.method,"GET");
 assert.equal(calls[1].opts.body,undefined);
 assert.equal(calls[1].opts.headers["PayPal-Request-Id"],undefined);
});
test("PayPal recovery rejects mismatched identity, amount, and hostile redirect",async()=>{
 const base={id:expected.providerOrderId,status:"CREATED",intent:"CAPTURE",
  purchase_units:[{reference_id:attemptId,custom_id:orderId,amount:{currency_code:"USD",value:"50.00"}}],
  links:[{rel:"approve",href:"https://www.sandbox.paypal.com/checkoutnow?token=PAYPALTEST123"}]};
 for(const variant of [
  {...base,purchase_units:[{...base.purchase_units[0],custom_id:"wrong"}]},
  {...base,purchase_units:[{...base.purchase_units[0],amount:{currency_code:"USD",value:"20.00"}}]},
  {...base,links:[{rel:"approve",href:"https://evil.example/checkoutnow?token=PAYPALTEST123"}]},
  {...base,links:[{rel:"approve",href:"https://www.sandbox.paypal.com/checkoutnow?token=OTHER123"}]}
 ]){
  const request=async(url)=>url.endsWith("/token")?json(token):json(variant);
  await assert.rejects(()=>retrieveExistingUnifiedPayPalSandboxCheckout(env,expected,request));
 }
});
test("PayPal approved or completed state never reopens checkout or infers payment",async()=>{
 for(const status of ["APPROVED","COMPLETED"]){
  const request=async(url)=>url.endsWith("/token")?json(token):json({
   id:expected.providerOrderId,status,intent:"CAPTURE",
   purchase_units:[{reference_id:attemptId,custom_id:orderId,amount:{currency_code:"USD",value:"50.00"}}]});
  const recovered=await retrieveExistingUnifiedPayPalSandboxCheckout(env,expected,request);
  assert.deepEqual(recovered,{status,checkoutUrl:null});
 }
});
