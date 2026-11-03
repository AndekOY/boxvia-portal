// Run: node --experimental-default-type=module --test tests/paypal-gates.test.mjs
// Offline, no PayPal calls, D1 writes or credentials.
import test from "node:test";
import assert from "node:assert/strict";
import worker from "../cloudflare/worker.js";

const origin = "https://boxvia.andeks.workers.dev";
const post = (path, originHeader = origin, body = {}) => new Request(origin + path, {
  method: "POST", headers: { "Content-Type": "application/json", Origin: originHeader },
  body: JSON.stringify(body)
});
const disabledEnv = { PAYPAL_CHECKOUT_ENABLED: "false", CLAIM_INTAKE_ENABLED: "false" };

test("health responds without credentials", async () => {
  const response = await worker.fetch(new Request(origin + "/api/health"), disabledEnv);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { service: "boxvia", status: "ok" });
});

test("claim intake is closed by default", async () => {
  const response = await worker.fetch(post("/api/claim"), disabledEnv);
  assert.equal(response.status, 503);
  assert.match((await response.json()).error, /not yet enabled/);
});

for (const path of ["/api/paypal/create-order", "/api/paypal/capture-order", "/api/claim-status"]) {
  test(path + " rejects requests when checkout disabled", async () => {
    const response = await worker.fetch(post(path), disabledEnv);
    assert.equal(response.status, 503);
    assert.match((await response.json()).error, /not enabled/);
  });
}

test("missing secrets keep checkout closed even with true gate", async () => {
  const response = await worker.fetch(post("/api/paypal/create-order"), {
    PAYPAL_CHECKOUT_ENABLED: "true", PAYPAL_ENV: "sandbox"
  });
  assert.equal(response.status, 503);
});

test("invalid PayPal environment fails closed before database access", async () => {
  const response = await worker.fetch(post("/api/paypal/create-order"), {
    PAYPAL_CHECKOUT_ENABLED: "true", PAYPAL_ENV: "invalid",
    DB: {}, PAYPAL_CLIENT_ID: "test", PAYPAL_CLIENT_SECRET: "test"
  });
  assert.equal(response.status, 503);
});

test("cross-origin payment requests are forbidden", async () => {
  const response = await worker.fetch(post("/api/paypal/create-order", "https://attacker.example"), {
    PAYPAL_CHECKOUT_ENABLED: "true", PAYPAL_ENV: "sandbox",
    DB: {}, PAYPAL_CLIENT_ID: "test", PAYPAL_CLIENT_SECRET: "test"
  });
  assert.equal(response.status, 403);
});

test("missing capability is rejected before database access", async () => {
  const response = await worker.fetch(post("/api/paypal/create-order"), {
    PAYPAL_CHECKOUT_ENABLED: "true", PAYPAL_ENV: "sandbox",
    DB: { prepare() { throw Error("DB should not be queried"); } },
    PAYPAL_CLIENT_ID: "test", PAYPAL_CLIENT_SECRET: "test"
  });
  assert.equal(response.status, 403);
});

test("unknown API endpoints do not expose static content", async () => {
  const response = await worker.fetch(new Request(origin + "/api/unknown"), disabledEnv);
  assert.equal(response.status, 503);
});
