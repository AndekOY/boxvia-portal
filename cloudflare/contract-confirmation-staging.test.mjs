// Run in a JS runtime supporting ES modules and Web Crypto (e.g. Node 20+).
// This test does not call Resend or touch Cloudflare D1.
import assert from "node:assert/strict";
import { validateContractSnapshot, snapshotSha256 } from "./contract-confirmation.js";
import { validateContractAttachments, sendContractConfirmationStaging } from "./contract-email-staging.js";
const sha = "a".repeat(64);
const base = {
  orderId: "BXC-TEST-001", acceptedAt: "2026-11-10T10:00:00Z",
  productId: "check-a-claim", productVersion: "v0.2", exactScope: "One claim against one public primary source",
  termsVersion: "v0.1", scheduleVersion: "A-v0.1",
  customerEmail: "test@example.invalid", providerName: "Example Provider",
  providerAddress: "Example Street 1", providerContact: "contact@example.invalid",
  totalPrice: "20.00", currency: "USD", taxDisclosure: "TEST ONLY",
  deliveryRule: "24 hours after accepted lawful order (TEST)", reportLanguage: "English",
  deliveryChannel: "email", acceptedDocuments: [{ id: "terms", version: "v0.1", sha256: sha }],
  earlyPerformanceRequest: null
};
const snapshot = validateContractSnapshot(base);
assert.equal((await snapshotSha256(snapshot)).length, 64);
assert.throws(() => validateContractSnapshot({ ...base, productId: "technical-pilot" }));
assert.throws(() => validateContractSnapshot({ ...base, reportLanguage: "EN" }), /English-only/);
assert.throws(() => validateContractSnapshot({ ...base, totalPrice: "50.00" }));
assert.throws(() => validateContractSnapshot({ ...base, acceptedDocuments: [] }));
assert.throws(() => validateContractAttachments([]));
const pdf = new Uint8Array([37, 80, 68, 70, 45, 49, 46, 52, 10, 37]);
assert.equal(validateContractAttachments([{ filename: "confirmation.pdf", bytes: pdf }, { filename: "terms.pdf", bytes: pdf }]).length, 2);
await assert.rejects(sendContractConfirmationStaging({
  env: { BXC_CONTRACT_STAGING_ENABLED: "false" },
  orderId: "BXC-TEST-001", customerEmail: "test@example.invalid",
  attachments: [{ filename: "confirmation.pdf", bytes: pdf }, { filename: "terms.pdf", bytes: pdf }]
}));
console.log("Contract staging boundary tests passed");
