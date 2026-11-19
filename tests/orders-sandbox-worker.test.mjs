import test from "node:test";
import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
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
  assert.equal(r.status,404);
});
