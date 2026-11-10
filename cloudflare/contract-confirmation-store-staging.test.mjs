// Isolated contract D1 persistence regression tests. No network or production D1.
// Run: node --experimental-default-type=module cloudflare/contract-confirmation-store-staging.test.mjs
import assert from "node:assert/strict";
import { registerContractConfirmation, markConfirmationPdfReady,
  claimContractEmailJob, recordResendAcceptance } from "./contract-confirmation-store-staging.js";
const state = new Map();
const db = {
  prepare(sql) {
    let params = [];
    return {
      bind(...values) { params = values; return this; },
      async run() {
        if (sql.startsWith("INSERT OR IGNORE")) {
          const [order_id, product_id, customer_email, snapshot_sha256, terms_version, schedule_version] = params;
          if (state.has(order_id)) return { meta: { changes: 0 } };
          state.set(order_id, { order_id, product_id, customer_email, snapshot_sha256,
            terms_version, schedule_version, pdf_sha256: null, private_object_key: null,
            email_status: "pending", attempts: 0, resend_message_id: null });
          return { meta: { changes: 1 } };
        }
        if (sql.includes("SET pdf_sha256")) {
          const [hash, key, orderId, snapshotHash] = params;
          const row = state.get(orderId);
          if (!row || row.snapshot_sha256 !== snapshotHash || row.pdf_sha256 !== null)
            return { meta: { changes: 0 } };
          Object.assign(row, { pdf_sha256: hash, private_object_key: key });
          return { meta: { changes: 1 } };
        }
        if (sql.includes("SET email_status = 'sending'")) {
          const [orderId] = params; const row = state.get(orderId);
          if (!row || !row.pdf_sha256 || row.attempts >= 5 ||
              !["pending", "failed"].includes(row.email_status)) return { meta: { changes: 0 } };
          row.email_status = "sending"; row.attempts++;
          return { meta: { changes: 1 } };
        }
        if (sql.includes("SET email_status = 'provider_accepted'")) {
          const [messageId, orderId] = params; const row = state.get(orderId);
          if (!row || row.email_status !== "sending") return { meta: { changes: 0 } };
          row.email_status = "provider_accepted"; row.resend_message_id = messageId;
          return { meta: { changes: 1 } };
        }
        throw new Error("Unexpected SQL in test: " + sql);
      },
      async first() {
        if (!sql.startsWith("SELECT")) throw new Error("Unexpected select");
        return state.get(params[0]) ?? null;
      }
    };
  }
};
const input = {
  orderId: "BXC-TEST-100", acceptedAt: "2026-11-10T10:00:00Z",
  productId: "check-a-claim", productVersion: "v0.2", exactScope: "One claim against one public source",
  termsVersion: "v0.1", scheduleVersion: "A-v0.1",
  customerEmail: "test@example.invalid", providerName: "Test Provider",
  providerAddress: "Test Street 1", providerContact: "test@example.invalid",
  totalPrice: "20.00", currency: "USD", taxDisclosure: "TEST",
  deliveryRule: "24 hours", reportLanguage: "English", deliveryChannel: "email",
  acceptedDocuments: [{ id: "terms", version: "v0.1", sha256: "a".repeat(64) }],
  earlyPerformanceRequest: null
};
const registered = await registerContractConfirmation(db, input);
assert.equal(registered.emailStatus, "pending");
assert.equal((await registerContractConfirmation(db, input)).snapshotSha256, registered.snapshotSha256);
await assert.rejects(registerContractConfirmation(db, { ...input, exactScope: "Changed scope" }), /conflict/);
assert.equal(await claimContractEmailJob(db, input.orderId), false);
const pdf = { orderId: input.orderId, snapshotHash: registered.snapshotSha256,
  pdfSha256: "b".repeat(64), privateObjectKey: "contracts/BXC-TEST-100/" + "b".repeat(64) + ".pdf" };
await assert.rejects(markConfirmationPdfReady(db, { ...pdf, privateObjectKey: "contracts/BXC-OTHER-100/" + pdf.pdfSha256 + ".pdf" }), /match order/);
await assert.rejects(markConfirmationPdfReady(db, { ...pdf, privateObjectKey: "contracts/BXC-TEST-100/" + "c".repeat(64) + ".pdf" }), /match order/);
assert.equal((await markConfirmationPdfReady(db, pdf)).status, "pdf_ready");
assert.equal((await markConfirmationPdfReady(db, pdf)).status, "pdf_ready");
await assert.rejects(markConfirmationPdfReady(db, { ...pdf, pdfSha256: "c".repeat(64) }), /conflict/);
assert.equal(await claimContractEmailJob(db, input.orderId), true);
assert.equal(await claimContractEmailJob(db, input.orderId), false);
await recordResendAcceptance(db, input.orderId, "mail_test_123456");
assert.equal(state.get(input.orderId).email_status, "provider_accepted");
assert.equal(state.get(input.orderId).attempts, 1);
console.log("Contract staging D1 state tests passed");
