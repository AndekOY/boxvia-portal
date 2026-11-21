import { isStripeTestApiKey } from "../cloudflare/stripe-test-key.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import { buildStripeCheckoutForm, requestStripeTestSession, retrieveExistingStripeTestSession } from "../cloudflare/stripe-checkout.mjs";
globalThis.crypto ??= webcrypto;
const order={orderId:"6a7bb765-5fb8-4a65-95be-8458e1bc7654",serviceCode:"one-question-review",amountMinor:5000,currency:"USD",status:"pending"};
const origin="https://boxvia-orders-sandbox.andeks.workers.dev";
test("server-only Stripe price, identity and safe redirects",()=>{
  const form=buildStripeCheckoutForm(order,origin);
  assert.equal(form.get("line_items[0][price_data][unit_amount]"),"5000");
  assert.equal(form.get("line_items[0][price_data][currency]"),"usd");
  assert.equal(form.get("metadata[order_id]"),order.orderId);
  assert.equal(new URL(form.get("cancel_url")).origin,origin);
  assert.ok(form.get("success_url").includes("{CHECKOUT_SESSION_ID}"));
  assert.throws(()=>buildStripeCheckoutForm({...order,amountMinor:2000},origin));
  assert.throws(()=>buildStripeCheckoutForm({...order,status:"paid"},origin));
  assert.throws(()=>buildStripeCheckoutForm({...order,serviceCode:"technical-pilot"},origin));
});
test("Stripe API adapter rejects missing test secrets before fetch",async()=>{
  await assert.rejects(requestStripeTestSession(order,{STRIPE_MODE:"test",STRIPE_CHECKOUT_TEST_ENABLED:"true",STRIPE_TEST_SECRET_KEY:"sk_live_wrong"},origin,crypto.randomUUID()),/unavailable/);
});

test("restricted test key allowed, live keys and malformed keys rejected",()=>{
  assert.equal(isStripeTestApiKey("rk_test_example123"),true);
  assert.equal(isStripeTestApiKey("sk_test_example123"),true);
  for(const key of ["rk_live_example123","sk_live_example123","rk_test_","sk_test_","",null,"rk_test_abc xyz"]){
    assert.equal(isStripeTestApiKey(key),false);
  }
});

test("Stripe Test Mode session adapter sends immutable price, idempotency and safe return",async()=>{
  const originalFetch=globalThis.fetch;
  const attemptId="7c9f0fd8-fb8a-4a2d-9cde-8e1e30f59112";
  const sessionId="cs_test_123456789012345";
  let calls=0;
  globalThis.fetch=async(url,options)=>{
    calls++;
    assert.equal(url,"https://api.stripe.com/v1/checkout/sessions");
    assert.equal(options.method,"POST");
    assert.equal(options.headers["Idempotency-Key"],"boxvia-test-"+attemptId);
    assert.equal(options.headers.Authorization,"Bearer rk_test_restricted_dummy");
    const form=new URLSearchParams(options.body);
    assert.equal(form.get("client_reference_id"),order.orderId);
    assert.equal(form.get("line_items[0][price_data][unit_amount]"),"5000");
    assert.equal(form.get("metadata[order_id]"),order.orderId);
    assert.equal(new URL(form.get("success_url")).pathname,"/api/orders/return");
    return Response.json({
      id:sessionId,livemode:false,mode:"payment",
      client_reference_id:order.orderId,amount_total:5000,currency:"usd",
      url:"https://checkout.stripe.com/c/pay/cs_test_example"
    });
  };
  try{
    const env={STRIPE_MODE:"test",STRIPE_CHECKOUT_TEST_ENABLED:"true",STRIPE_TEST_SECRET_KEY:"rk_test_restricted_dummy"};
    const session=await requestStripeTestSession(order,env,origin,attemptId);
    assert.equal(session.sessionId,sessionId);
    assert.equal(new URL(session.checkoutUrl).hostname,"checkout.stripe.com");
    assert.equal(calls,1);
  }finally{globalThis.fetch=originalFetch;}
});
test("Stripe Test Mode adapter rejects live sessions and off-domain redirects",async()=>{
  const originalFetch=globalThis.fetch;
  const env={STRIPE_MODE:"test",STRIPE_CHECKOUT_TEST_ENABLED:"true",STRIPE_TEST_SECRET_KEY:"sk_test_dummy"};
  const attemptId="7c9f0fd8-fb8a-4a2d-9cde-8e1e30f59112";
  const baseSession={
    id:"cs_test_123456789012345",livemode:false,mode:"payment",
    client_reference_id:order.orderId,amount_total:5000,currency:"usd",
    url:"https://checkout.stripe.com/c/pay/cs_test_example"
  };
  try{
    for(const invalid of [
      {...baseSession,livemode:true},
      {...baseSession,amount_total:2000},
      {...baseSession,url:"https://checkout.stripe.com.evil.example/pay"},
      {...baseSession,url:"http://checkout.stripe.com/pay"}
    ]){
      globalThis.fetch=async()=>Response.json(invalid);
      await assert.rejects(requestStripeTestSession(order,env,origin,attemptId));
    }
  }finally{globalThis.fetch=originalFetch;}
});

test("existing test session recovery is read-only, bound to the order and Stripe",async()=>{
  const original=globalThis.fetch;
  const sessionId="cs_test_123456789012345";
  const existing={...order,status:"checkout"};
  const env={STRIPE_MODE:"test",STRIPE_CHECKOUT_TEST_ENABLED:"true",STRIPE_TEST_SECRET_KEY:"rk_test_restricted_dummy"};
  const good={id:sessionId,livemode:false,mode:"payment",status:"open",
    client_reference_id:order.orderId,metadata:{order_id:order.orderId},
    amount_total:5000,currency:"usd",url:"https://checkout.stripe.com/c/pay/cs_test_existing"};
  let calls=0;
  try{
    globalThis.fetch=async(url,options)=>{
      calls++;
      assert.equal(options.method,"GET");
      assert.equal(url,"https://api.stripe.com/v1/checkout/sessions/"+sessionId);
      assert.equal(options.headers.Authorization,"Bearer rk_test_restricted_dummy");
      return Response.json(good);
    };
    const recovered=await retrieveExistingStripeTestSession(existing,sessionId,env);
    assert.equal(recovered.status,"open");
    assert.equal(new URL(recovered.checkoutUrl).hostname,"checkout.stripe.com");
    assert.equal(calls,1);
    globalThis.fetch=async()=>Response.json({...good,status:"expired",url:null});
    const expired=await retrieveExistingStripeTestSession(existing,sessionId,env);
    assert.deepEqual(expired,{status:"expired",checkoutUrl:null});
    for(const invalid of [
      {...good,livemode:true},{...good,client_reference_id:"another"},
      {...good,metadata:{order_id:"another"}},
      {...good,url:"https://checkout.stripe.com.evil.example/pay"},
      {...good,amount_total:100}
    ]){
      globalThis.fetch=async()=>Response.json(invalid);
      await assert.rejects(retrieveExistingStripeTestSession(existing,sessionId,env));
    }
    await assert.rejects(retrieveExistingStripeTestSession({...existing,status:"pending"},sessionId,env));
    await assert.rejects(retrieveExistingStripeTestSession(existing,"cs_live_123456789012345",env));
  }finally{globalThis.fetch=original;}
});
