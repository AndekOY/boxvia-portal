import test from "node:test";
import assert from "node:assert/strict";
import { webcrypto, createHmac } from "node:crypto";
import { verifyStripeSignature, inspectStripeCheckoutSession } from "../cloudflare/stripe-verification.mjs";
globalThis.crypto ??= webcrypto;
const now=1795000000;
const secret="whsec_test_example_secret_not_live";
const order={id:"6a7bb765-5fb8-4a65-95be-8458e1bc7654",amountMinor:5000,currency:"USD"};
const session={
  object:"checkout.session",livemode:false,id:"cs_test_123456789",mode:"payment",payment_status:"paid",
  client_reference_id:order.id,metadata:{order_id:order.id},amount_total:5000,currency:"usd",
  payment_intent:"pi_123456789"
};
const event={id:"evt_123456789",livemode:false,type:"checkout.session.completed",data:{object:session}};
const signed=(body,t=now)=>"t="+t+",v1="+createHmac("sha256",secret).update(t+"."+body).digest("hex");
test("valid signed raw Stripe event is authenticated",async()=>{
  const raw=JSON.stringify(event);
  const verified=await verifyStripeSignature(raw,signed(raw),secret,now);
  assert.equal(verified?.id,event.id);
  assert.deepEqual(inspectStripeCheckoutSession(verified,order),{
    provider:"stripe",status:"completed",providerOrderId:session.id,
    providerPaymentId:session.payment_intent,amountMinor:5000,currency:"USD",
    orderId:order.id,eventId:event.id
  });
});
test("reject tampered body, stale timestamp, fake signature and invalid secret",async()=>{
  const raw=JSON.stringify(event);
  assert.equal(await verifyStripeSignature(raw+" ",signed(raw),secret,now),null);
  assert.equal(await verifyStripeSignature(raw,signed(raw,now-301),secret,now),null);
  assert.equal(await verifyStripeSignature(raw,"t="+now+",v1="+"0".repeat(64),secret,now),null);
  assert.equal(await verifyStripeSignature(raw,signed(raw),"not-a-secret",now),null);
});
test("reject incorrect paid state, order identity, amount and live sessions",()=>{
  assert.equal(inspectStripeCheckoutSession({...event,data:{object:{...session,amount_total:2000}}},order),null);
  assert.equal(inspectStripeCheckoutSession({...event,data:{object:{...session,metadata:{order_id:"wrong"}}}},order),null);
  assert.equal(inspectStripeCheckoutSession({...event,data:{object:{...session,payment_status:"unpaid"}}},order),null);
  assert.equal(inspectStripeCheckoutSession({...event,data:{object:{...session,id:"cs_live_123456789"}}},order),null);
  assert.equal(inspectStripeCheckoutSession({...event,type:"payment_intent.created"},order),null);
  assert.equal(inspectStripeCheckoutSession({...event,livemode:true},order),null);
  assert.equal(inspectStripeCheckoutSession({...event,data:{object:{...session,livemode:true}}},order),null);
});
