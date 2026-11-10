import assert from "node:assert/strict";
import { buildVerifiedCheckoutAcceptanceDraft } from "./contract-checkout-evidence-draft.js";
const acceptedAt = "2026-11-10T12:00:00.000Z";
const orderId = "BXCORDER123";
const docs = ["terms","schedule","withdrawal"].map(id => ({ id, version: "v1", sha256: "a".repeat(64) }));
const snapshot = {
  orderId, acceptedAt, productId: "check-a-claim", productVersion: "v1",
  exactScope: "Review of one public claim", termsVersion: "v1", scheduleVersion: "v1",
  customerEmail: "customer@example.test", providerName: "BoxVia",
  providerAddress: "Poland", providerContact: "contact@example.test",
  totalPrice: "20.00", currency: "USD", taxDisclosure: "Tax included",
  deliveryRule: "Within 24 hours", reportLanguage: "English",
  deliveryChannel: "Email", acceptedDocuments: docs
};
const db = { prepare(sql) {
  assert.match(sql, /SELECT id, customer_email FROM claims/);
  return { bind(id) { assert.equal(id, 42); return { first: async () =>
    ({ id: 42, customer_email: "customer@example.test" }) }; } };
} };
const consent = { affirmative: true, termsAccepted: true, scheduleAccepted: true,
  withdrawalNoticeAcknowledged: true, privacyNoticeAcknowledged: true };
const input = { db, claimId: 42, accessToken: "private-test-token", checkoutSessionId: orderId,
  rawSnapshot: snapshot, consent, now: () => acceptedAt,
  verifyClaimCapability: async (_db, id, token) => id === 42 && token === "private-test-token" };
const result = await buildVerifiedCheckoutAcceptanceDraft(input);
assert.equal(result.evidence.source, "server_checkout");
assert.equal(result.event.documents.length, 3);
assert.match(result.evidence.acceptanceEventSha256, /^[a-f0-9]{64}$/);
await assert.rejects(buildVerifiedCheckoutAcceptanceDraft({ ...input, accessToken: "bad" }), /capability not verified/);
await assert.rejects(buildVerifiedCheckoutAcceptanceDraft({ ...input, consent: { ...consent, affirmative: false } }), /acknowledgements/);
await assert.rejects(buildVerifiedCheckoutAcceptanceDraft({ ...input, rawSnapshot: { ...snapshot, customerEmail: "other@example.test" } }), /identity mismatch/);
await assert.rejects(buildVerifiedCheckoutAcceptanceDraft({ ...input, rawSnapshot: { ...snapshot, acceptedAt: "2026-11-10T12:00:01.000Z" } }), /time mismatch/);
await assert.rejects(buildVerifiedCheckoutAcceptanceDraft({ ...input, rawSnapshot: { ...snapshot, acceptedDocuments: docs.slice(0,2) } }), /document set/);
console.log("Checkout acceptance evidence draft tests passed");
