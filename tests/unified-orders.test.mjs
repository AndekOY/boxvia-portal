import test from "node:test";
import assert from "node:assert/strict";
import { buildPendingOrder, canTransitionOrder, verifyProviderPayment } from "../cloudflare/unified-orders.mjs";

const orderId = "6a7bb765-5fb8-4a65-95be-8458e1bc7654";
const capabilityHash = "a".repeat(64);
const make = (serviceCode = "one-question-review") => buildPendingOrder({ serviceCode, serviceRequestId: 7, orderId, capabilityHash });
test("two $50 orders are authoritative and cannot be forged", () => {
  for (const code of ["one-question-review", "ai-governance-review"]) {
    const order = make(code);
    assert.equal(order.amountMinor, 5000);
    assert.equal(order.currency, "USD");
    assert.equal(order.status, "pending");
    assert.ok(Object.isFrozen(order));
  }
  assert.throws(() => make("check-a-claim"), /Unknown/);
  assert.throws(() => buildPendingOrder({ serviceCode: "one-question-review", serviceRequestId: 0, orderId, capabilityHash }), /request/);
});
test("state machine refuses premature fulfillment and re-payment", () => {
  assert.equal(canTransitionOrder("pending", "paid"), false);
  assert.equal(canTransitionOrder("pending", "checkout"), true);
  assert.equal(canTransitionOrder("checkout", "paid"), true);
  assert.equal(canTransitionOrder("paid", "paid"), false);
  assert.equal(canTransitionOrder("paid", "fulfillment_ready"), true);
  assert.equal(canTransitionOrder("delivered", "checkout"), false);
  assert.equal(canTransitionOrder("__proto__", "paid"), false);
});
test("provider payment must match service, amount, currency and order", () => {
  const expected = make();
  const paid = { provider: "stripe", status: "completed", providerOrderId: "cs_test_123456", providerPaymentId: "pi_12345678", amountMinor: 5000, currency: "USD", orderId };
  assert.equal(verifyProviderPayment(expected, paid), true);
  assert.equal(verifyProviderPayment(expected, { ...paid, amountMinor: 2000 }), false);
  assert.equal(verifyProviderPayment(expected, { ...paid, currency: "EUR" }), false);
  assert.equal(verifyProviderPayment(expected, { ...paid, orderId: "another-order" }), false);
  assert.equal(verifyProviderPayment(expected, { ...paid, status: "pending" }), false);
  assert.equal(verifyProviderPayment(expected, { ...paid, provider: "unknown" }), false);
});
