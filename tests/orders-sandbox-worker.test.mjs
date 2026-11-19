import test from "node:test";
import assert from "node:assert/strict";
import { webcrypto, createHmac } from "node:crypto";
import worker from "../cloudflare/orders-sandbox-worker.mjs";
globalThis.crypto ??= webcrypto;

const base = "https://boxvia-orders-sandbox.andeks.workers.dev";
const flags = { UNIFIED_ORDERS_ENABLED: "false", PAYPAL_CHECKOUT_ENABLED: "false", STRIPE_CHECKOUT_ENABLED: "false" };
const post = (path, body, headers = {}) => new Request(base + path, {
  method: "POST",
  headers: { Origin: base, "Content-Type": "application/json", ...headers },
  body: JSON.stringify(body)
});
const db = {
  prepare(sql) {
    return {
      bind(...args) { this.args=args; return this; },
      async first() { return { ok: 1 }; },
      async all() { return { results: ["service_orders","service_quotes","payment_attempts","payment_events","fulfillment_outbox"].map(name => ({name})) }; }
    };
  }
};
test("health requires disabled payments and all five tables", async () => {
  const r=await worker.fetch(new Request(base + "/api/health"),{...flags,DB:db});
  assert.equal(r.status,200);
  assert.equal((await r.json()).status,"schema_ready");
  assert.equal(r.headers.get("Access-Control-Allow-Origin"),null);
  const unsafe=await worker.fetch(new Request(base + "/api/health"),{...flags,DB:db,STRIPE_CHECKOUT_ENABLED:"true"});
  assert.equal(unsafe.status,503);
});
test("order create denies missing admin token and unauthorized calls", async () => {
  const input={serviceRequestId:7,serviceCode:"one-question-review"};
  const noSecret=await worker.fetch(post("/api/orders/create",input),{...flags,DB:db});
  assert.equal(noSecret.status,503);
  const secret="b".repeat(48);
  const unauthorized=await worker.fetch(post("/api/orders/create",input),{...flags,DB:db,ORDERS_SANDBOX_ADMIN_TOKEN:secret});
  assert.equal(unauthorized.status,401);
  const badOrigin=await worker.fetch(post("/api/orders/create",input,{Origin:"https://evil.example",Authorization:"Bearer "+secret}),{...flags,DB:db,ORDERS_SANDBOX_ADMIN_TOKEN:secret});
  assert.equal(badOrigin.status,403);
});
test("order status never accepts a bare request id", async () => {
  const r=await worker.fetch(post("/api/orders/status",{serviceRequestId:7}),{...flags,DB:db});
  assert.equal(r.status,404);
  const missingDb=await worker.fetch(post("/api/orders/status",{}),flags);
  assert.equal(missingDb.status,503);
});
test("all other routes are closed", async () => {
  const r=await worker.fetch(new Request(base + "/api/stripe/webhook",{method:"POST"}),{...flags,DB:db});
  assert.equal(r.status,503);
});

test("Stripe webhook is disabled without explicit test-mode gate and secret", async () => {
  const body=JSON.stringify({id:"evt_123456789",livemode:false,type:"checkout.session.completed",data:{object:{}}});
  const request=new Request(base+"/api/stripe/webhook",{method:"POST",headers:{"Content-Type":"application/json"},body});
  const result=await worker.fetch(request,{...flags,DB:db});
  assert.equal(result.status,503);
});
test("Stripe webhook rejects invalid signature and live-mode events before D1 writes", async () => {
  const secret="whsec_test_not_real_secret";
  const env={...flags,DB:db,STRIPE_WEBHOOK_TEST_ENABLED:"true",STRIPE_MODE:"test",STRIPE_TEST_WEBHOOK_SECRET:secret};
  const send=async (payload, valid=true)=>{
    const body=JSON.stringify(payload);
    const t=Math.floor(Date.now()/1000);
    const sig=createHmac("sha256",secret).update(t+"."+body).digest("hex");
    return worker.fetch(new Request(base+"/api/stripe/webhook",{
      method:"POST",headers:{"Content-Type":"application/json","Stripe-Signature":"t="+t+",v1="+(valid?sig:"0".repeat(64))},body
    }),env);
  };
  const payload={id:"evt_123456789",livemode:false,type:"checkout.session.completed",data:{object:{}}};
  assert.equal((await send(payload,false)).status,400);
  assert.equal((await send({...payload,livemode:true})).status,400);
  const ignored=await send({...payload,type:"customer.created"});
  assert.equal(ignored.status,200);
  assert.equal((await ignored.json()).outcome,"ignored");
});
