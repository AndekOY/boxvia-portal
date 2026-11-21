import test from "node:test";
import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import worker from "../cloudflare/orders-sandbox-worker.mjs";
globalThis.crypto ??= webcrypto;

const origin = "https://boxvia-orders-sandbox.andeks.workers.dev";
const adminToken = "a".repeat(64);
const flags = {
  UNIFIED_ORDERS_ENABLED: "false",
  PAYPAL_CHECKOUT_ENABLED: "false",
  STRIPE_CHECKOUT_ENABLED: "false",
  ORDERS_SANDBOX_ADMIN_TOKEN: adminToken
};
class InMemoryD1Contract {
  constructor() {
    this.requests = new Map([[7001, "one-question-review"], [7002, "ai-governance-review"]]);
    this.orders = new Map();
  }
  prepare(sql) {
    const db = this;
    let args = [];
    return {
      bind(...values) { args = values; return this; },
      async first() {
        if (sql.includes("FROM service_requests")) {
          return db.requests.has(args[0]) ? { id: args[0], service_code: db.requests.get(args[0]) } : null;
        }
        if (sql.includes("WHERE service_request_id")) return db.orders.get(args[0]) || null;
        if (sql.includes("FROM service_orders WHERE id =")) {
          return [...db.orders.values()].find(row => row.id === args[0]) || null;
        }
        if (sql.includes("SELECT 1 AS ok")) return { ok: 1 };
        throw new Error("Unmodeled SQL: " + sql);
      },
      async run() {
        assert.match(sql, /^INSERT OR IGNORE INTO service_orders /);
        const [id, serviceRequestId, serviceCode, amountMinor, currency, capabilityHash] = args;
        if (db.orders.has(serviceRequestId)) return { success: true, meta: { changes: 0 } };
        db.orders.set(serviceRequestId, {
          id, service_code: serviceCode, amount_minor: amountMinor, currency,
          capability_hash: capabilityHash, status: "pending"
        });
        return { success: true, meta: { changes: 1 } };
      },
      async all() {
        return { results: ["service_orders","service_quotes","payment_attempts","payment_events","fulfillment_outbox"].map(name => ({name})) };
      }
    };
  }
}
const post = (path, body, headers = {}) => new Request(origin + path, {
  method: "POST",
  headers: { "Content-Type": "application/json", Origin: origin, ...headers },
  body: JSON.stringify(body)
});
const call = async (env, path, body, headers = {}) => {
  const response = await worker.fetch(post(path, body, headers), env);
  return { status: response.status, data: await response.json() };
};

test("in-process full HTTP contract: $50 order, deduplication, capability and isolation", async () => {
  const env = { ...flags, DB: new InMemoryD1Contract() };
  const input = { serviceRequestId: 7001, serviceCode: "one-question-review" };
  const unauth = await call(env, "/api/orders/create", input);
  assert.equal(unauth.status, 401);
  const forgedOrigin = await call(env, "/api/orders/create", input, {
    Authorization: "Bearer " + adminToken, Origin: "https://invalid.example"
  });
  assert.equal(forgedOrigin.status, 403);
  const created = await call(env, "/api/orders/create", input, { Authorization: "Bearer " + adminToken });
  assert.equal(created.status, 201);
  assert.equal(created.data.created, true);
  assert.equal(created.data.amountMinor, 5000);
  assert.equal(created.data.currency, "USD");
  assert.match(created.data.capability, /^[a-f0-9]{64}$/);
  const repeated = await call(env, "/api/orders/create", input, { Authorization: "Bearer " + adminToken });
  assert.equal(repeated.status, 200);
  assert.equal(repeated.data.created, false);
  assert.equal(repeated.data.orderId, created.data.orderId);
  assert.equal(Object.hasOwn(repeated.data, "capability"), false);
  const status = await call(env, "/api/orders/status", {
    orderId: created.data.orderId, capability: created.data.capability
  });
  assert.equal(status.status, 200);
  assert.equal(status.data.status, "pending");
  assert.equal(status.data.amountMinor, 5000);
  const denied = await call(env, "/api/orders/status", {
    orderId: created.data.orderId, capability: "f".repeat(64)
  });
  assert.equal(denied.status, 404);
  const mismatch = await call(env, "/api/orders/create", {
    serviceRequestId: 7002, serviceCode: "one-question-review"
  }, { Authorization: "Bearer " + adminToken });
  assert.equal(mismatch.status, 400);
  assert.equal(env.DB.orders.size, 1);
});
