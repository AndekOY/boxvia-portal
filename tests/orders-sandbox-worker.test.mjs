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
      async first() {
        // A generic DB stub must not claim that a migration-created index exists.
        if (sql.includes("idx_stripe_one_attempt_per_order")) return null;
        return { ok: 1 };
      },
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

test("Stripe Checkout stays closed without test-mode secret and feature gate", async () => {
  const input={orderId:"6a7bb765-5fb8-4a65-95be-8458e1bc7654",capability:"a".repeat(64)};
  const disabled=await worker.fetch(post("/api/stripe/checkout",input),{...flags,DB:db});
  assert.equal(disabled.status,503);
  const enabled={...flags,DB:db,STRIPE_MODE:"test",STRIPE_CHECKOUT_TEST_ENABLED:"true",STRIPE_TEST_SECRET_KEY:"sk_test_not_real"};
  const crossOrigin=await worker.fetch(post("/api/stripe/checkout",input,{Origin:"https://evil.example"}),enabled);
  assert.equal(crossOrigin.status,403);
  const pendingIndex=await worker.fetch(post("/api/stripe/checkout",input),enabled);
  assert.equal(pendingIndex.status,503);
  assert.equal((await pendingIndex.json()).error,"Checkout schema pending");
  const restricted={...enabled,STRIPE_TEST_SECRET_KEY:"rk_test_restricted_dummy"};
  const restrictedIndex=await worker.fetch(post("/api/stripe/checkout",input),restricted);
  assert.equal(restrictedIndex.status,503);
  assert.equal((await restrictedIndex.json()).error,"Checkout schema pending");
  const liveKey={...enabled,STRIPE_TEST_SECRET_KEY:"rk_live_rejected_dummy"};
  const rejected=await worker.fetch(post("/api/stripe/checkout",input),liveKey);
  assert.equal(rejected.status,503);
  assert.equal((await rejected.json()).error,"Unavailable");
});

test("Stripe test form CSP permits provider redirect without permitting arbitrary destinations", async () => {
  const env={...flags,DB:db,STRIPE_MODE:"test",STRIPE_CHECKOUT_TEST_ENABLED:"true",
    STRIPE_TEST_SECRET_KEY:"rk_test_restricted_dummy",STRIPE_E2E_ORDER_CAPABILITY:"dummy"};
  const response=await worker.fetch(new Request(base+"/stripe-test"),env);
  assert.equal(response.status,200);
  const csp=response.headers.get("Content-Security-Policy");
  assert.match(csp,/form-action 'self' https:\/\/checkout\.stripe\.com https:\/\/checkout\.stripe\.dev/);
  assert.match(csp,/default-src 'none'/);
  assert.match(csp,/base-uri 'none'/);
  assert.doesNotMatch(csp,/form-action[^;]*\*/);
  assert.ok((await response.text()).includes('href="/stripe-test/open"'));
});

test("Stripe browser return is safe, non-authoritative and does not leak session", async () => {
  const session="cs_test_123456789";
  const returned=await worker.fetch(new Request(base+"/api/orders/return?provider=stripe&session_id="+session),flags);
  assert.equal(returned.status,200);
  assert.match(returned.headers.get("Content-Type"),/text\/html/);
  assert.equal(returned.headers.get("Cache-Control"),"no-store");
  const html=await returned.text();
  assert.match(html,/pending independent verification/);
  assert.doesNotMatch(html,/payment confirmed|payment successful|paid/i);
  assert.doesNotMatch(html,/cs_test_123456789/);
  const cancelled=await worker.fetch(new Request(base+"/api/orders/return?provider=stripe&cancelled=1"),flags);
  assert.equal(cancelled.status,200);
  assert.match(await cancelled.text(),/Checkout cancelled/);
  const wrongProvider=await worker.fetch(new Request(base+"/api/orders/return?provider=paypal"),flags);
  assert.equal(wrongProvider.status,404);
});

test("Stripe return is read-only, independent of D1, and refuses unexpected methods", async () => {
  const noDb={...flags};
  const valid=await worker.fetch(new Request(base+"/api/orders/return?provider=stripe&session_id=cs_test_123456789"),noDb);
  assert.equal(valid.status,200);
  const injected="<script>alert(1)</script>";
  const malicious=await worker.fetch(new Request(base+"/api/orders/return?provider=stripe&session_id="+encodeURIComponent(injected)),noDb);
  assert.equal(malicious.status,200);
  assert.doesNotMatch(await malicious.text(),/<script>|alert\(1\)/);
  const oversized=await worker.fetch(new Request(base+"/api/orders/return?provider=stripe&session_id="+"x".repeat(257)),noDb);
  assert.equal(oversized.status,404);
  const postReturn=await worker.fetch(post("/api/orders/return",{provider:"stripe"}),noDb);
  assert.equal(postReturn.status,404);
});

test("signed Stripe event with colliding ID is rejected at HTTP boundary", async () => {
  const secret="whsec_test_not_real_secret";
  const orderId="6a7bb765-5fb8-4a65-95be-8458e1bc7654";
  const sessionId="cs_test_123456789";
  const event={
    id:"evt_123456789",livemode:false,type:"checkout.session.completed",
    data:{object:{
      object:"checkout.session",livemode:false,id:sessionId,mode:"payment",
      payment_status:"paid",client_reference_id:orderId,
      metadata:{order_id:orderId},amount_total:5000,currency:"usd",
      payment_intent:"pi_123456789"
    }}
  };
  const collisionDb={
    prepare(sql){
      return {
        bind(...args){this.args=args;return this;},
        async first(){
          if(sql.includes("FROM service_orders"))return {id:orderId,amount_minor:5000,currency:"USD",status:"checkout"};
          if(sql.includes("FROM payment_attempts"))return {
            id:"attempt-1",order_id:orderId,provider_order_id:sessionId,
            amount_minor:5000,currency:"USD",status:"pending"
          };
          if(sql.includes("FROM payment_events"))return {payload_digest:"0".repeat(64)};
          throw Error("Unexpected SQL");
        }
      };
    },
    async batch(){throw Error("Collision must not start a settlement transaction");}
  };
  const raw=JSON.stringify(event);
  const t=Math.floor(Date.now()/1000);
  const signature=createHmac("sha256",secret).update(t+"."+raw).digest("hex");
  const response=await worker.fetch(new Request(base+"/api/stripe/webhook",{
    method:"POST",headers:{
      "Content-Type":"application/json",
      "Stripe-Signature":"t="+t+",v1="+signature
    },body:raw
  }),{
    ...flags,DB:collisionDb,STRIPE_MODE:"test",
    STRIPE_WEBHOOK_TEST_ENABLED:"true",STRIPE_TEST_WEBHOOK_SECRET:secret
  });
  assert.equal(response.status,409);
  assert.deepEqual(await response.json(),{received:false,outcome:"requires_review"});
});

test("one-click Stripe Test page is read-only, secret-gated and rejects cross-origin POST",async()=>{
  const path=base+"/stripe-test";
  const closed=await worker.fetch(new Request(path),flags);
  assert.equal(closed.status,503);
  const enabled={...flags,DB:db,STRIPE_MODE:"test",STRIPE_CHECKOUT_TEST_ENABLED:"true",
    STRIPE_TEST_SECRET_KEY:"rk_test_restricted_dummy",STRIPE_E2E_ORDER_CAPABILITY:"a".repeat(64)};
  const page=await worker.fetch(new Request(path),enabled);
  assert.equal(page.status,200);
  assert.equal(page.headers.get("Cache-Control"),"no-store");
  const html=await page.text();
  assert.match(html,/USD 50\.00/);
  assert.ok(html.includes('href="/stripe-test/open"'));
  assert.doesNotMatch(html,/a{64}|fe2c77c4-1abd-4ab9-ae1e-c57f0b583a34/);
  const foreign=await worker.fetch(new Request(path,{method:"POST",headers:{
    Origin:"https://evil.example","Content-Type":"application/x-www-form-urlencoded"
  },body:""}),enabled);
  assert.equal(foreign.status,403);
  const wrongType=await worker.fetch(new Request(path,{method:"POST",headers:{
    Origin:base,"Content-Type":"application/json"
  },body:"{}"}),enabled);
  assert.equal(wrongType.status,403);
  const browserNoOrigin=await worker.fetch(new Request(path,{method:"POST",headers:{
    "Sec-Fetch-Site":"same-origin","Sec-Fetch-Mode":"navigate",
    "Content-Type":"application/x-www-form-urlencoded"
  },body:""}),enabled);
  assert.equal(browserNoOrigin.status,503);
  assert.equal((await browserNoOrigin.json()).error,"Checkout schema pending");
  const nullOrigin=await worker.fetch(new Request(path,{method:"POST",headers:{
    Origin:"null","Sec-Fetch-Site":"same-origin","Sec-Fetch-Mode":"navigate",
    "Content-Type":"application/x-www-form-urlencoded"
  },body:""}),enabled);
  assert.equal(nullOrigin.status,503);
  assert.equal((await nullOrigin.json()).error,"Checkout schema pending");
  const nullOriginCrossSite=await worker.fetch(new Request(path,{method:"POST",headers:{
    Origin:"null","Sec-Fetch-Site":"cross-site","Sec-Fetch-Mode":"navigate",
    "Content-Type":"application/x-www-form-urlencoded"
  },body:""}),enabled);
  assert.equal(nullOriginCrossSite.status,403);
  const foreignMetadata=await worker.fetch(new Request(path,{method:"POST",headers:{
    "Sec-Fetch-Site":"cross-site","Sec-Fetch-Mode":"navigate",
    "Content-Type":"application/x-www-form-urlencoded"
  },body:""}),enabled);
  assert.equal(foreignMetadata.status,403);
  const noIndex=await worker.fetch(new Request(path,{method:"POST",headers:{
    Origin:base,"Content-Type":"application/x-www-form-urlencoded"
  },body:""}),enabled);
  assert.equal(noIndex.status,503);
  assert.equal((await noIndex.json()).error,"Checkout schema pending");
});

test("read-only Stripe recovery link never reserves a new checkout attempt", async () => {
  const env={...flags,DB:db,STRIPE_MODE:"test",STRIPE_CHECKOUT_TEST_ENABLED:"true",
    STRIPE_TEST_SECRET_KEY:"rk_test_restricted_dummy",STRIPE_E2E_ORDER_CAPABILITY:"dummy"};
  const r=await worker.fetch(new Request(base+"/stripe-test/open"),env);
  assert.equal(r.status,409);
  assert.equal((await r.json()).error,"Existing order not eligible");
  const missing=await worker.fetch(new Request(base+"/stripe-test/open"),flags);
  assert.equal(missing.status,503);
});

test("Stripe test recovery rejects checkout without canonical consent before provider call",async()=>{
 const capability="a".repeat(64),orderId="fe2c77c4-1abd-4ab9-ae1e-c57f0b583a34";
 const bytes=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(capability));
 const hash=Array.from(new Uint8Array(bytes),x=>x.toString(16).padStart(2,"0")).join("");
 let attemptLookups=0;
 const evidenceDb={prepare(sql){return {bind(){return this;},async first(){
  if(sql.includes("FROM service_orders"))return {id:orderId,service_code:"one-question-review",amount_minor:5000,currency:"USD",status:"checkout",capability_hash:hash};
  if(sql.includes("FROM order_terms_acceptances"))return null;
  if(sql.includes("FROM payment_attempts")){attemptLookups++;return {provider_order_id:"cs_test_123",status:"pending"};}
  throw Error("Unexpected query: "+sql);
 }}}};
 const env={...flags,DB:evidenceDb,STRIPE_MODE:"test",STRIPE_CHECKOUT_TEST_ENABLED:"true",STRIPE_TEST_SECRET_KEY:"rk_test_restricted_dummy",STRIPE_E2E_ORDER_CAPABILITY:capability};
 const result=await worker.fetch(new Request(base+"/stripe-test/open"),env);
 assert.equal(result.status,409);
 assert.deepEqual(await result.json(),{error:"Accepted commercial terms required",reason:"consent_missing"});
 assert.equal(attemptLookups,0);
});

test("Stripe diagnostic POST rejects missing consent before attempt reservation or provider call",async()=>{
 const capability="a".repeat(64),orderId="fe2c77c4-1abd-4ab9-ae1e-c57f0b583a34";
 const bytes=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(capability));
 const hash=Array.from(new Uint8Array(bytes),x=>x.toString(16).padStart(2,"0")).join("");
 let attempts=0;
 const evidenceDb={prepare(sql){return {bind(){return this;},async first(){
  if(sql.includes("idx_stripe_one_attempt_per_order"))return {name:"idx_stripe_one_attempt_per_order"};
  if(sql.includes("FROM service_orders"))return {id:orderId,service_code:"one-question-review",amount_minor:5000,currency:"USD",status:"pending",capability_hash:hash};
  if(sql.includes("FROM order_terms_acceptances"))return null;
  if(sql.includes("FROM payment_attempts")){attempts++;throw Error("Payment attempt lookup must not run");}
  throw Error("Unexpected query: "+sql);
 }}}};
 const env={...flags,DB:evidenceDb,STRIPE_MODE:"test",STRIPE_CHECKOUT_TEST_ENABLED:"true",STRIPE_TEST_SECRET_KEY:"rk_test_restricted_dummy",STRIPE_E2E_ORDER_CAPABILITY:capability};
 const result=await worker.fetch(new Request(base+"/stripe-test",{method:"POST",headers:{Origin:base,"Content-Type":"application/x-www-form-urlencoded"},body:""}),env);
 assert.equal(result.status,409);
 assert.deepEqual(await result.json(),{error:"Accepted commercial terms required",reason:"consent_missing"});
 assert.equal(attempts,0);
});

test("PayPal return is informational only and cannot mark an order paid", async () => {
 const env={UNIFIED_ORDERS_ENABLED:"false",PAYPAL_CHECKOUT_ENABLED:"false",STRIPE_CHECKOUT_ENABLED:"false",DB:{prepare(){throw Error("Return must never access D1");}}};
 for(const suffix of ["?provider=paypal","?provider=paypal&cancelled=1","?provider=paypal&order_id=FORGED&status=COMPLETED"]){
  const response=await worker.fetch(new Request("https://boxvia-orders-sandbox.andeks.workers.dev/api/orders/return"+suffix),env);
  assert.equal(response.status,200);
  const body=await response.text();
  assert.match(body,/pending independent verification|No payment confirmation/);
  assert.doesNotMatch(body,/FORGED|Payment successful|Payment confirmed/);
 }
});
