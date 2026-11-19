import test from "node:test";
import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import { buildStripeCheckoutForm, requestStripeTestSession } from "../cloudflare/stripe-checkout.mjs";
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
