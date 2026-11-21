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
        if (sql.includes("idx_payment_attempt_one_total_per_order")) return null;
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
  const wrongProvider=await worker.fetch(new Request(base+"/api/orders/return?provider=unknown"),flags);
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
  if(sql.includes("idx_payment_attempt_one_total_per_order"))return {name:"idx_payment_attempt_one_total_per_order"};
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

test("PayPal unified sandbox checkout stays disabled with production-safe flags",async()=>{
 const response=await worker.fetch(post("/api/paypal/sandbox/checkout",{orderId:"forged",capability:"forged"}),flags);
 assert.equal(response.status,503);
 assert.deepEqual(await response.json(),{error:"Unavailable"});
});
test("PayPal sandbox checkout rejects enabled payment flags at worker boundary",async()=>{
 const env={...flags,PAYPAL_MODE:"sandbox",PAYPAL_UNIFIED_TEST_ENABLED:"true",PAYPAL_CHECKOUT_ENABLED:"true",UNIFIED_ORDERS_ENABLED:"true",DB:{prepare(){throw Error("No DB access allowed");}}};
 const response=await worker.fetch(post("/api/paypal/sandbox/checkout",{orderId:"forged",capability:"forged"},{Origin:"https://evil.example"}),env);
 assert.equal(response.status,503);
 assert.equal((await response.json()).error,"Sandbox configuration rejected");
});
test("PayPal sandbox checkout refuses missing unique attempt index",async()=>{
 const env={...flags,PAYPAL_MODE:"sandbox",PAYPAL_UNIFIED_TEST_ENABLED:"true",PAYPAL_CHECKOUT_ENABLED:"true",UNIFIED_ORDERS_ENABLED:"true",DB:{prepare(){return {async first(){return null;}};}}};
 const response=await worker.fetch(post("/api/paypal/sandbox/checkout",{orderId:"forged",capability:"forged"}),env);
 assert.equal(response.status,503);
 assert.equal((await response.json()).error,"Sandbox configuration rejected");
});

test("PayPal sandbox recovery requires test-mode gate and never touches D1 when disabled",async()=>{
 const req=post("/api/paypal/sandbox/recover",{orderId:"6a7bb765-5fb8-4a65-95be-8458e1bc7654",capability:"a".repeat(64)});
 const response=await worker.fetch(req,{...flags,DB:{prepare(){throw Error("No D1 access permitted");}}});
 assert.equal(response.status,503);
});
test("PayPal sandbox recovery rejects foreign origin and invalid payload before D1 access",async()=>{
 const env={...flags,PAYPAL_MODE:"sandbox",PAYPAL_UNIFIED_TEST_ENABLED:"true",
  DB:{prepare(){throw Error("Unexpected D1 access");}}};
 const input={orderId:"6a7bb765-5fb8-4a65-95be-8458e1bc7654",capability:"a".repeat(64)};
 const foreign=await worker.fetch(post("/api/paypal/sandbox/recover",input,{Origin:"https://evil.example"}),env);
 assert.equal(foreign.status,403);
 const malformed=await worker.fetch(new Request(base+"/api/paypal/sandbox/recover",{
  method:"POST",headers:{Origin:base,"Content-Type":"application/json"},body:"{"}),env);
 assert.equal(malformed.status,400);
 const oversized=await worker.fetch(new Request(base+"/api/paypal/sandbox/recover",{
  method:"POST",headers:{Origin:base,"Content-Type":"application/json"},body:"x".repeat(2050)}),env);
 assert.equal(oversized.status,413);
});
test("PayPal sandbox recovery does not reveal attempts without valid order capability",async()=>{
 const env={...flags,PAYPAL_MODE:"sandbox",PAYPAL_UNIFIED_TEST_ENABLED:"true",
  DB:{prepare(sql){assert.match(sql,/FROM service_orders/);return {bind(){return {async first(){return null;}}}};}}};
 const response=await worker.fetch(post("/api/paypal/sandbox/recover",{
  orderId:"6a7bb765-5fb8-4a65-95be-8458e1bc7654",capability:"a".repeat(64)}),env);
 assert.equal(response.status,404);
 assert.deepEqual(await response.json(),{error:"Not found"});
});

test("PayPal recovery authenticates evidence and retrieves existing checkout without creating payment",async()=>{
 const orderId="6a7bb765-5fb8-4a65-95be-8458e1bc7654";
 const attemptId="89c35f1e-8a3d-47aa-a2c8-0ac837ed24e1";
 const providerOrderId="PAYPALTEST123";
 const capability="a".repeat(64);
 const hash=async s=>[...new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s)))].map(x=>x.toString(16).padStart(2,"0")).join("");
 const scope="Fixed scope",offer="Fixed offer",confidentiality="Confidentiality";
 const termsDigest=await hash(scope);
 const evidence={service_code:"one-question-review",amount_minor:5000,currency:"USD",
  scope_digest:termsDigest,terms_digest:termsDigest,deliverable:"Report",deadline:"24h",
  quote_id:null,offer_version:"v1",offer_digest:await hash(offer),
  offer_accepted_at:"2026-11-21T12:00:00Z",confidentiality_version:"v1",
  confidentiality_digest:await hash(confidentiality),confidentiality_accepted_at:"2026-11-21T12:00:00Z"};
 const source={scope_text:scope,terms_version:"v1",offer_text:offer,offer_version:"v1",
  confidentiality_text:confidentiality,confidentiality_version:"v1",deliverable:"Report",deadline:"24h"};
 const queries=[];
 const recoveryDb={prepare(sql){return {bind(){return this;},async first(){
  queries.push(sql);
  if(sql.includes("FROM service_orders"))return {id:orderId,service_code:"one-question-review",
   amount_minor:5000,currency:"USD",status:"checkout",capability_hash:await hash(capability)};
  if(sql.includes("FROM order_terms_acceptances"))return evidence;
  if(sql.includes("FROM order_document_sources"))return source;
  if(sql.includes("FROM sqlite_master"))return {name:"idx_payment_attempt_one_total_per_order"};
  if(sql.includes("FROM payment_attempts"))return {id:attemptId,provider:"paypal",status:"pending",
   provider_order_id:providerOrderId,amount_minor:5000,currency:"USD"};
  throw Error("Unexpected read: "+sql);
 },async run(){throw Error("Recovery must never write D1");}};}};
 const originalFetch=globalThis.fetch;
 const calls=[];
 globalThis.fetch=async(url,options)=>{
  calls.push({url,options});
  if(url.endsWith("/v1/oauth2/token"))return Response.json({access_token:"sandbox-access-token-123",token_type:"Bearer"});
  if(url.endsWith("/v2/checkout/orders/"+providerOrderId))return Response.json({
   id:providerOrderId,status:"CREATED",intent:"CAPTURE",
   purchase_units:[{reference_id:attemptId,custom_id:orderId,amount:{currency_code:"USD",value:"50.00"}}],
   links:[{rel:"payer-action",href:"https://www.sandbox.paypal.com/checkoutnow?token="+providerOrderId}]
  });
  throw Error("Unexpected provider request");
 };
 try{
  const response=await worker.fetch(post("/api/paypal/sandbox/recover",{orderId,capability}),{
   ...flags,DB:recoveryDb,PAYPAL_MODE:"sandbox",PAYPAL_UNIFIED_TEST_ENABLED:"true",
   PAYPAL_SANDBOX_CLIENT_ID:"sandbox-client-123",PAYPAL_SANDBOX_CLIENT_SECRET:"sandbox-secret-123"});
  assert.equal(response.status,200);
  const result=await response.json();
  assert.equal(result.status,"CREATED");
  assert.equal(result.checkoutUrl,"https://www.sandbox.paypal.com/checkoutnow?token="+providerOrderId);
  assert.equal(calls.length,2);
  assert.equal(calls[1].options.method,"GET");
  assert.ok(queries.some(x=>x.includes("FROM order_terms_acceptances")));
  assert.ok(queries.some(x=>x.includes("FROM payment_attempts")));
 }finally{globalThis.fetch=originalFetch;}
});

test("PayPal recovery refuses pending order before consent, index or provider access",async()=>{
 const orderId="6a7bb765-5fb8-4a65-95be-8458e1bc7654",capability="a".repeat(64);
 const hash=[...new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(capability)))].map(x=>x.toString(16).padStart(2,"0")).join("");
 const queries=[];
 const DB={prepare(sql){
  queries.push(sql);
  if(!sql.includes("FROM service_orders"))throw Error("Unexpected D1 access");
  return {bind(){return {async first(){return {
   id:orderId,service_code:"one-question-review",amount_minor:5000,
   currency:"USD",status:"pending",capability_hash:hash
  };}};}};
 }};
 const response=await worker.fetch(post("/api/paypal/sandbox/recover",{orderId,capability}),{
  ...flags,DB,PAYPAL_MODE:"sandbox",PAYPAL_UNIFIED_TEST_ENABLED:"true"});
 assert.equal(response.status,409);
 assert.equal((await response.json()).error,"Order not eligible");
 assert.equal(queries.length,1);
});
test("PayPal recovery rejects wrong-provider attempt before contacting PayPal",async()=>{
 const orderId="6a7bb765-5fb8-4a65-95be-8458e1bc7654",capability="a".repeat(64);
 const hash=async s=>[...new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s)))].map(x=>x.toString(16).padStart(2,"0")).join("");
 const scope="Scope",offer="Offer",conf="Confidentiality";
 const evidence={service_code:"one-question-review",amount_minor:5000,currency:"USD",
  scope_digest:await hash(scope),terms_digest:await hash(scope),deliverable:"Report",deadline:"24h",
  quote_id:null,offer_version:"v1",offer_digest:await hash(offer),
  offer_accepted_at:"2026-11-21T12:00:00Z",confidentiality_version:"v1",
  confidentiality_digest:await hash(conf),confidentiality_accepted_at:"2026-11-21T12:00:00Z"};
 const DB={prepare(sql){return {bind(){return this;},async first(){
  if(sql.includes("FROM service_orders"))return {id:orderId,service_code:"one-question-review",
   amount_minor:5000,currency:"USD",status:"checkout",capability_hash:await hash(capability)};
  if(sql.includes("FROM order_terms_acceptances"))return evidence;
  if(sql.includes("FROM order_document_sources"))return {scope_text:scope,terms_version:"v1",
   offer_text:offer,offer_version:"v1",confidentiality_text:conf,confidentiality_version:"v1",
   deliverable:"Report",deadline:"24h"};
  if(sql.includes("FROM sqlite_master"))return {name:"idx_payment_attempt_one_total_per_order"};
  if(sql.includes("FROM payment_attempts"))return {id:"89c35f1e-8a3d-47aa-a2c8-0ac837ed24e1",
   provider:"stripe",provider_order_id:"cs_test_123456789",status:"pending",amount_minor:5000,currency:"USD"};
  throw Error("Unexpected read");
 },async run(){throw Error("No writes permitted");}};}};
 const response=await worker.fetch(post("/api/paypal/sandbox/recover",{orderId,capability}),{
  ...flags,DB,PAYPAL_MODE:"sandbox",PAYPAL_UNIFIED_TEST_ENABLED:"true"});
 assert.equal(response.status,409);
 assert.equal((await response.json()).error,"Existing PayPal attempt requires reconciliation");
});

test("PayPal recovery rejects changed canonical offer before any provider API request",async()=>{
 const orderId="6a7bb765-5fb8-4a65-95be-8458e1bc7654";
 const attemptId="89c35f1e-8a3d-47aa-a2c8-0ac837ed24e1";
 const providerOrderId="PAYPALTEST123";
 const capability="a".repeat(64);
 const hash=async s=>[...new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s)))].map(x=>x.toString(16).padStart(2,"0")).join("");
 const scope="Fixed scope",offer="Fixed offer",confidentiality="Confidentiality";
 const termsDigest=await hash(scope);
 const evidence={service_code:"one-question-review",amount_minor:5000,currency:"USD",
  scope_digest:termsDigest,terms_digest:termsDigest,deliverable:"Report",deadline:"24h",
  quote_id:null,offer_version:"v1",offer_digest:await hash(offer),
  offer_accepted_at:"2026-11-21T12:00:00Z",confidentiality_version:"v1",
  confidentiality_digest:await hash(confidentiality),confidentiality_accepted_at:"2026-11-21T12:00:00Z"};
 const source={scope_text:scope,terms_version:"v1",offer_text:offer+" TAMPERED",offer_version:"v1",
  confidentiality_text:confidentiality,confidentiality_version:"v1",deliverable:"Report",deadline:"24h"};
 const queries=[];
 const recoveryDb={prepare(sql){return {bind(){return this;},async first(){
  queries.push(sql);
  if(sql.includes("FROM service_orders"))return {id:orderId,service_code:"one-question-review",
   amount_minor:5000,currency:"USD",status:"checkout",capability_hash:await hash(capability)};
  if(sql.includes("FROM order_terms_acceptances"))return evidence;
  if(sql.includes("FROM order_document_sources"))return source;
  if(sql.includes("FROM sqlite_master"))return {name:"idx_payment_attempt_one_total_per_order"};
  if(sql.includes("FROM payment_attempts"))return {id:attemptId,provider:"paypal",status:"pending",
   provider_order_id:providerOrderId,amount_minor:5000,currency:"USD"};
  throw Error("Unexpected read: "+sql);
 },async run(){throw Error("Recovery must never write D1");}};}};
 const originalFetch=globalThis.fetch;
 const calls=[];
 globalThis.fetch=async(url,options)=>{
  calls.push({url,options});
  if(url.endsWith("/v1/oauth2/token"))return Response.json({access_token:"sandbox-access-token-123",token_type:"Bearer"});
  if(url.endsWith("/v2/checkout/orders/"+providerOrderId))return Response.json({
   id:providerOrderId,status:"CREATED",intent:"CAPTURE",
   purchase_units:[{reference_id:attemptId,custom_id:orderId,amount:{currency_code:"USD",value:"50.00"}}],
   links:[{rel:"payer-action",href:"https://www.sandbox.paypal.com/checkoutnow?token="+providerOrderId}]
  });
  throw Error("Unexpected provider request");
 };
 try{
  const response=await worker.fetch(post("/api/paypal/sandbox/recover",{orderId,capability}),{
   ...flags,DB:recoveryDb,PAYPAL_MODE:"sandbox",PAYPAL_UNIFIED_TEST_ENABLED:"true",
   PAYPAL_SANDBOX_CLIENT_ID:"sandbox-client-123",PAYPAL_SANDBOX_CLIENT_SECRET:"sandbox-secret-123"});
  assert.equal(response.status,409);
  assert.equal((await response.json()).reason,"canonical_document_changed");
  assert.equal(calls.length,0);
  assert.ok(queries.some(x=>x.includes("FROM order_terms_acceptances")));
  assert.equal(queries.some(x=>x.includes("FROM payment_attempts")),false);
 }finally{globalThis.fetch=originalFetch;}
});

test("PayPal recovery fails closed on provider order identity mismatch",async()=>{
 const orderId="6a7bb765-5fb8-4a65-95be-8458e1bc7654";
 const attemptId="89c35f1e-8a3d-47aa-a2c8-0ac837ed24e1";
 const providerOrderId="PAYPALTEST123";
 const capability="a".repeat(64);
 const hash=async s=>[...new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s)))].map(x=>x.toString(16).padStart(2,"0")).join("");
 const scope="Fixed scope",offer="Fixed offer",confidentiality="Confidentiality";
 const termsDigest=await hash(scope);
 const evidence={service_code:"one-question-review",amount_minor:5000,currency:"USD",
  scope_digest:termsDigest,terms_digest:termsDigest,deliverable:"Report",deadline:"24h",
  quote_id:null,offer_version:"v1",offer_digest:await hash(offer),
  offer_accepted_at:"2026-11-21T12:00:00Z",confidentiality_version:"v1",
  confidentiality_digest:await hash(confidentiality),confidentiality_accepted_at:"2026-11-21T12:00:00Z"};
 const source={scope_text:scope,terms_version:"v1",offer_text:offer,offer_version:"v1",
  confidentiality_text:confidentiality,confidentiality_version:"v1",deliverable:"Report",deadline:"24h"};
 const queries=[];
 const recoveryDb={prepare(sql){return {bind(){return this;},async first(){
  queries.push(sql);
  if(sql.includes("FROM service_orders"))return {id:orderId,service_code:"one-question-review",
   amount_minor:5000,currency:"USD",status:"checkout",capability_hash:await hash(capability)};
  if(sql.includes("FROM order_terms_acceptances"))return evidence;
  if(sql.includes("FROM order_document_sources"))return source;
  if(sql.includes("FROM sqlite_master"))return {name:"idx_payment_attempt_one_total_per_order"};
  if(sql.includes("FROM payment_attempts"))return {id:attemptId,provider:"paypal",status:"pending",
   provider_order_id:providerOrderId,amount_minor:5000,currency:"USD"};
  throw Error("Unexpected read: "+sql);
 },async run(){throw Error("Recovery must never write D1");}};}};
 const originalFetch=globalThis.fetch;
 const calls=[];
 globalThis.fetch=async(url,options)=>{
  calls.push({url,options});
  if(url.endsWith("/v1/oauth2/token"))return Response.json({access_token:"sandbox-access-token-123",token_type:"Bearer"});
  if(url.endsWith("/v2/checkout/orders/"+providerOrderId))return Response.json({
   id:"WRONGPAYPAL123",status:"CREATED",intent:"CAPTURE",
   purchase_units:[{reference_id:attemptId,custom_id:orderId,amount:{currency_code:"USD",value:"50.00"}}],
   links:[{rel:"payer-action",href:"https://www.sandbox.paypal.com/checkoutnow?token="+providerOrderId}]
  });
  throw Error("Unexpected provider request");
 };
 try{
  const response=await worker.fetch(post("/api/paypal/sandbox/recover",{orderId,capability}),{
   ...flags,DB:recoveryDb,PAYPAL_MODE:"sandbox",PAYPAL_UNIFIED_TEST_ENABLED:"true",
   PAYPAL_SANDBOX_CLIENT_ID:"sandbox-client-123",PAYPAL_SANDBOX_CLIENT_SECRET:"sandbox-secret-123"});
  assert.equal(response.status,503);
  assert.equal((await response.json()).error,"Recovery unavailable; reconciliation required");
  assert.equal(calls.length,2);
  assert.equal(calls[1].options.method,"GET");
  assert.ok(queries.some(x=>x.includes("FROM order_terms_acceptances")));
  assert.ok(queries.some(x=>x.includes("FROM payment_attempts")));
 }finally{globalThis.fetch=originalFetch;}
});

test("PayPal recovery never reopens completed provider orders",async()=>{
 const orderId="6a7bb765-5fb8-4a65-95be-8458e1bc7654";
 const attemptId="89c35f1e-8a3d-47aa-a2c8-0ac837ed24e1";
 const providerOrderId="PAYPALTEST123";
 const capability="a".repeat(64);
 const hash=async s=>[...new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s)))].map(x=>x.toString(16).padStart(2,"0")).join("");
 const scope="Fixed scope",offer="Fixed offer",confidentiality="Confidentiality";
 const termsDigest=await hash(scope);
 const evidence={service_code:"one-question-review",amount_minor:5000,currency:"USD",
  scope_digest:termsDigest,terms_digest:termsDigest,deliverable:"Report",deadline:"24h",
  quote_id:null,offer_version:"v1",offer_digest:await hash(offer),
  offer_accepted_at:"2026-11-21T12:00:00Z",confidentiality_version:"v1",
  confidentiality_digest:await hash(confidentiality),confidentiality_accepted_at:"2026-11-21T12:00:00Z"};
 const source={scope_text:scope,terms_version:"v1",offer_text:offer,offer_version:"v1",
  confidentiality_text:confidentiality,confidentiality_version:"v1",deliverable:"Report",deadline:"24h"};
 const queries=[];
 const recoveryDb={prepare(sql){return {bind(){return this;},async first(){
  queries.push(sql);
  if(sql.includes("FROM service_orders"))return {id:orderId,service_code:"one-question-review",
   amount_minor:5000,currency:"USD",status:"checkout",capability_hash:await hash(capability)};
  if(sql.includes("FROM order_terms_acceptances"))return evidence;
  if(sql.includes("FROM order_document_sources"))return source;
  if(sql.includes("FROM sqlite_master"))return {name:"idx_payment_attempt_one_total_per_order"};
  if(sql.includes("FROM payment_attempts"))return {id:attemptId,provider:"paypal",status:"pending",
   provider_order_id:providerOrderId,amount_minor:5000,currency:"USD"};
  throw Error("Unexpected read: "+sql);
 },async run(){throw Error("Recovery must never write D1");}};}};
 const originalFetch=globalThis.fetch;
 const calls=[];
 globalThis.fetch=async(url,options)=>{
  calls.push({url,options});
  if(url.endsWith("/v1/oauth2/token"))return Response.json({access_token:"sandbox-access-token-123",token_type:"Bearer"});
  if(url.endsWith("/v2/checkout/orders/"+providerOrderId))return Response.json({
   id:providerOrderId,status:"COMPLETED",intent:"CAPTURE",
   purchase_units:[{reference_id:attemptId,custom_id:orderId,amount:{currency_code:"USD",value:"50.00"}}],
   links:[{rel:"payer-action",href:"https://www.sandbox.paypal.com/checkoutnow?token="+providerOrderId}]
  });
  throw Error("Unexpected provider request");
 };
 try{
  const response=await worker.fetch(post("/api/paypal/sandbox/recover",{orderId,capability}),{
   ...flags,DB:recoveryDb,PAYPAL_MODE:"sandbox",PAYPAL_UNIFIED_TEST_ENABLED:"true",
   PAYPAL_SANDBOX_CLIENT_ID:"sandbox-client-123",PAYPAL_SANDBOX_CLIENT_SECRET:"sandbox-secret-123"});
  assert.equal(response.status,200);
  const result=await response.json();
  assert.equal(result.status,"COMPLETED");
  assert.equal(result.checkoutUrl,null);
  assert.equal(calls.length,2);
  assert.equal(calls[1].options.method,"GET");
  assert.ok(queries.some(x=>x.includes("FROM order_terms_acceptances")));
  assert.ok(queries.some(x=>x.includes("FROM payment_attempts")));
 }finally{globalThis.fetch=originalFetch;}
});

test("global HOLD blocks both payment creation routes before any D1 or provider access",async()=>{
 const orderId="6a7bb765-5fb8-4a65-95be-8458e1bc7654",capability="a".repeat(64);
 let dbCalls=0,providerCalls=0;
 const DB={prepare(){dbCalls++;throw Error("HOLD must prevent D1 access");}};
 const oldFetch=globalThis.fetch;
 globalThis.fetch=async()=>{providerCalls++;throw Error("HOLD must prevent provider access");};
 try{
  for(const [path,extra] of [
   ["/api/stripe/checkout",{STRIPE_MODE:"test",STRIPE_CHECKOUT_TEST_ENABLED:"true",STRIPE_TEST_SECRET_KEY:"rk_test_restricted_dummy"}],
   ["/api/paypal/sandbox/checkout",{PAYPAL_MODE:"sandbox",PAYPAL_UNIFIED_TEST_ENABLED:"true"}]
  ]){
   const response=await worker.fetch(post(path,{orderId,capability}),{...flags,DB,...extra});
   assert.equal(response.status,503,path);
   assert.deepEqual(await response.json(),{error:path==="/api/stripe/checkout"?"Checkout unavailable; reconciliation required":"Unavailable"});
  }
  assert.equal(dbCalls,0);
  assert.equal(providerCalls,0);
 }finally{globalThis.fetch=oldFetch;}
});
