import assert from "node:assert/strict";
import { archiveCheckoutAcceptanceDraft } from "./contract-checkout-archive-bridge-draft.js";
const acceptedAt = "2026-11-10T12:00:00.000Z";
const orderId = "BXCORDER123";
const snapshot = {
  orderId, acceptedAt, productId: "check-a-claim", productVersion: "v1",
  exactScope: "Review one public claim", termsVersion: "v1", scheduleVersion: "v1",
  customerEmail: "customer@example.test", providerName: "BoxVia",
  providerAddress: "Poland", providerContact: "contact@example.test",
  totalPrice: "20.00", currency: "USD", taxDisclosure: "Tax included",
  deliveryRule: "Within 24 hours", reportLanguage: "English",
  deliveryChannel: "Email", acceptedDocuments: ["terms","schedule","withdrawal"].map(id =>
    ({ id, version: "v1", sha256: "a".repeat(64) }))
};
const consent = { affirmative: true, termsAccepted: true, scheduleAccepted: true,
  withdrawalNoticeAcknowledged: true, privacyNoticeAcknowledged: true };
const rows = new Map();
const db = { prepare(sql) { return { bind(...params) { return {
  async first() {
    if (sql.includes("FROM claims")) return { id: 42, customer_email: "customer@example.test" };
    return rows.get(params[0]) || null;
  },
  async run() {
    if (sql.includes("INSERT OR IGNORE")) {
      if (!rows.has(params[0])) rows.set(params[0], {
        snapshot_json: params[1], snapshot_sha256: params[2],
        acceptance_evidence_json: params[3], acceptance_evidence_sha256: params[4]
      });
      return { success: true };
    }
    throw new Error("Unexpected SQL");
  }
}; } }; } };
const input = { db, claimId: 42, accessToken: "token", checkoutSessionId: orderId,
  rawSnapshot: snapshot, consent, now: () => acceptedAt,
  verifyClaimCapability: async (_db, _id, token) => token === "token" };
const first = await archiveCheckoutAcceptanceDraft(input);
assert.equal(first.status, "accepted_archived");
assert.match(first.snapshotSha256, /^[a-f0-9]{64}$/);
const second = await archiveCheckoutAcceptanceDraft(input);
assert.deepEqual(second, first);
await assert.rejects(archiveCheckoutAcceptanceDraft({
  ...input, rawSnapshot: { ...snapshot, exactScope: "Changed after acceptance" }
}), /Immutable checkout acceptance conflict/);
await assert.rejects(archiveCheckoutAcceptanceDraft({ ...input, accessToken: "bad" }), /capability not verified/);
assert.equal(rows.size, 1);
console.log("Checkout acceptance to immutable archive bridge tests passed");
