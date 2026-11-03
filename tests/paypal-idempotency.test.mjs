// Run: node --experimental-default-type=module --test tests/paypal-idempotency.test.mjs
// No network, real payments, or D1 writes. PayPal calls are intercepted.
import test from "node:test";
import assert from "node:assert/strict";
import { handlePayment } from "../cloudflare/paypal.js";

const origin = "https://boxvia.andeks.workers.dev";
const claimId = 3;
const orderId = "0YM02393AC503000D";
const captureId = "3LU82775LB714011Y";
const accessToken = "a".repeat(64);
const digest = async value => [...new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)))].map(x => x.toString(16).padStart(2, "0")).join("");

function database(state) {
  return {
    prepare(sql) {
      let params = [];
      return {
        bind(...values) { params = values; return this; },
        async first() {
          if (sql.includes("FROM claim_access")) return { token_hash: state.hash };
          if (sql.includes("FROM claims")) return { id: claimId, payment_status: state.payment };
          if (sql.includes("FROM paypal_orders") && sql.includes("paypal_order_id = ?")) return { id: 1, status: state.orderStatus };
          if (sql.includes("FROM paypal_orders")) return { status: state.orderStatus };
          throw Error("Unexpected query: " + sql);
        },
        async run() {
          if (sql.startsWith("UPDATE paypal_orders")) {
            assert.equal(params[0], captureId);
            state.orderStatus = "COMPLETED";
          } else if (sql.startsWith("UPDATE claims")) {
            state.payment = "paid";
          } else throw Error("Unexpected write: " + sql);
          return { success: true };
        }
      };
    },
    async batch(statements) {
      const results = [];
      for (const statement of statements) results.push(await statement.run());
      return results;
    }
  };
}

async function fixture(initialPayment = "pending", initialOrder = "CREATED") {
  const state = { payment: initialPayment, orderStatus: initialOrder, hash: await digest(accessToken) };
  const env = {
    DB: database(state), PAYPAL_CHECKOUT_ENABLED: "true", PAYPAL_ENV: "sandbox",
    PAYPAL_CLIENT_ID: "test-client", PAYPAL_CLIENT_SECRET: "test-secret"
  };
  const calls = [];
  const mockFetch = async (input, init = {}) => {
    const url = String(input);
    calls.push({ url, method: init.method });
    if (url.endsWith("/v1/oauth2/token")) return Response.json({ access_token: "test-oauth" });
    if (url.endsWith("/v2/checkout/orders/" + orderId + "/capture")) return Response.json({ status: "COMPLETED" });
    if (url.endsWith("/v2/checkout/orders/" + orderId)) return Response.json({
      id: orderId, status: "COMPLETED",
      purchase_units: [{ custom_id: String(claimId), payments: { captures: [{
        id: captureId, status: "COMPLETED", amount: { currency_code: "USD", value: "20.00" }
      }] } }]
    });
    throw Error("Unexpected PayPal call: " + url);
  };
  const request = (path, body = {}) => new Request(origin + path, {
    method: "POST", headers: { Origin: origin, "Content-Type": "application/json" },
    body: JSON.stringify({ claim_id: claimId, access_token: accessToken, ...body })
  });
  return { state, env, calls, mockFetch, request };
}

test("repeat capture after success never issues another PayPal capture", async () => {
  const f = await fixture();
  const previous = globalThis.fetch;
  globalThis.fetch = f.mockFetch;
  try {
    const path = "/api/paypal/capture-order";
    const first = await handlePayment(f.request(path, { order_id: orderId }), f.env, new URL(origin + path));
    assert.equal(first.status, 200);
    assert.equal(f.state.payment, "paid");
    assert.equal(f.state.orderStatus, "COMPLETED");
    const second = await handlePayment(f.request(path, { order_id: orderId }), f.env, new URL(origin + path));
    assert.equal(second.status, 200);
    assert.equal(f.calls.filter(c => c.url.endsWith("/capture")).length, 1);
  } finally { globalThis.fetch = previous; }
});

test("already paid claim rejects new PayPal order", async () => {
  const f = await fixture("paid", "COMPLETED");
  const previous = globalThis.fetch;
  globalThis.fetch = f.mockFetch;
  try {
    const path = "/api/paypal/create-order";
    const response = await handlePayment(f.request(path), f.env, new URL(origin + path));
    assert.equal(response.status, 409);
    assert.equal(f.calls.length, 0);
  } finally { globalThis.fetch = previous; }
});

test("cancelled checkout alone does not mark claim paid", async () => {
  const f = await fixture();
  const previous = globalThis.fetch;
  globalThis.fetch = f.mockFetch;
  try {
    const path = "/api/claim-status";
    const response = await handlePayment(f.request(path), f.env, new URL(origin + path));
    assert.equal(response.status, 200);
    assert.equal((await response.json()).payment_status, "pending");
    assert.equal(f.state.payment, "pending");
    assert.equal(f.calls.length, 0);
  } finally { globalThis.fetch = previous; }
});
