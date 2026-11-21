import test from "node:test";
import assert from "node:assert/strict";
import { SERVICE_CATALOG, getServiceDefinition, resolveOrderPrice } from "../cloudflare/service-catalog.mjs";

test("six active services, no legacy $20 sale", () => {
  assert.equal(Object.keys(SERVICE_CATALOG).length, 6);
  assert.equal(getServiceDefinition("check-a-claim"), null);
  assert.equal(getServiceDefinition("__proto__"), null);
  assert.equal(getServiceDefinition("toString"), null);
  assert.equal(getServiceDefinition("faar-stage-1").title, "Project Definition Review");
});
test("two independent $50 entry services", () => {
  for (const code of ["one-question-review", "ai-governance-review"]) {
    assert.deepEqual(resolveOrderPrice(code), { amountMinor: 5000, currency: "USD" });
    assert.throws(() => resolveOrderPrice(code, { amountMinor: 1 }), /does not accept/);
  }
});
test("fixed price cannot be overridden", () => {
  assert.throws(() => resolveOrderPrice("pre-decision-review"), /quote/);
  assert.throws(() => resolveOrderPrice("check-a-claim"), /Unknown/);
});
test("variable-price services require an accepted server-side quote", () => {
  for (const code of ["pre-decision-review", "technical-pilot", "faar-stage-1", "ai-governance-gap-assessment"]) {
    const s = getServiceDefinition(code);
    assert.throws(() => resolveOrderPrice(code), /quote/);
    assert.throws(() => resolveOrderPrice(code, { serviceCode: code, amountMinor: 1, currency: "USD", status: "accepted", scopeDigest: "a".repeat(64) }), /quote/);
    assert.deepEqual(resolveOrderPrice(code, { serviceCode: code, amountMinor: s.startingPriceMinor, currency: "USD", status: "accepted", scopeDigest: "a".repeat(64) }), { amountMinor: s.startingPriceMinor, currency: "USD" });
  }
});
