// Isolated end-to-end integration regression test: no network, no real D1/R2/Resend.
// Run: node --experimental-default-type=module cloudflare/contract-pipeline-staging.test.mjs
import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
if (!globalThis.crypto) globalThis.crypto = webcrypto;
if (!globalThis.btoa) globalThis.btoa = str => Buffer.from(str, "binary").toString("base64");
import { prepareContractConfirmationStaging, dispatchContractConfirmationStaging } from "./contract-pipeline-staging.js";
import { sha256Bytes } from "./contract-private-r2-staging.js";
const pdf = text => new TextEncoder().encode("%PDF-1.4\n" + text + "\n" + " ".repeat(50) + "\n%%EOF\n");
const annexes = await Promise.all(["terms", "schedule", "withdrawal"].map(async id => {
  const bytes = pdf(id);
  return { id, version: "v1", filename: id + ".pdf", bytes, sha256: await sha256Bytes(bytes) };
}));
const order = {
  orderId: "BXC-TEST-001", acceptedAt: "2026-11-10T10:00:00Z",
  providerName: "BoxVia Test Provider", providerContact: "contact@example.invalid",
  providerAddress: "Test Street 1, Szczecin, Poland",
  customerEmail: "customer@example.invalid", productId: "check-a-claim",
  productVersion: "v0.2", exactScope: "One claim checked against one public primary source",
  totalPrice: "20.00", currency: "USD", taxDisclosure: "TEST ONLY",
  deliveryRule: "Within 24 hours after lawful acceptance",
  reportLanguage: "English", deliveryChannel: "Email",
  termsVersion: "v1", scheduleVersion: "v1",
  acceptedDocuments: annexes.map(({ id, version, sha256 }) => ({ id, version, sha256 })),
  earlyPerformanceRequest: null
};
const rows = new Map(), objects = new Map();
const DB = {
  prepare(sql) {
    let args = [];
    return {
      bind(...values) { args = values; return this; },
      async first() {
        const row = rows.get(args[0]); return row ? { ...row } : null;
      },
      async run() {
        if (sql.startsWith("INSERT OR IGNORE")) {
          const [order_id, product_id, customer_email, snapshot_sha256, terms_version, schedule_version] = args;
          if (rows.has(order_id)) return { meta: { changes: 0 } };
          rows.set(order_id, { order_id, product_id, customer_email, snapshot_sha256, terms_version,
            schedule_version, pdf_sha256: null, private_object_key: null, email_status: "pending",
            resend_message_id: null, attempts: 0 });
          return { meta: { changes: 1 } };
        }
        if (sql.includes("SET pdf_sha256")) {
          const [pdfHash, key, id, snapshotHash] = args, row = rows.get(id);
          if (!row || row.snapshot_sha256 !== snapshotHash || row.pdf_sha256)
            return { meta: { changes: 0 } };
          Object.assign(row, { pdf_sha256: pdfHash, private_object_key: key });
          return { meta: { changes: 1 } };
        }
        if (sql.includes("SET email_status = 'sending'")) {
          const row = rows.get(args[0]);
          if (!row || !row.pdf_sha256 || row.attempts >= 5 ||
            !["pending", "failed"].includes(row.email_status)) return { meta: { changes: 0 } };
          row.email_status = "sending"; row.attempts++;
          return { meta: { changes: 1 } };
        }
        if (sql.includes("SET email_status = 'provider_accepted'")) {
          const [messageId, id] = args, row = rows.get(id);
          if (!row || row.email_status !== "sending") return { meta: { changes: 0 } };
          row.email_status = "provider_accepted"; row.resend_message_id = messageId;
          return { meta: { changes: 1 } };
        }
        throw new Error("Unexpected SQL: " + sql);
      }
    };
  }
};
const CONTRACT_R2 = {
  async put(key, bytes) { objects.set(key, new Uint8Array(bytes)); },
  async get(key) {
    if (!objects.has(key)) return null;
    return { async arrayBuffer() { return objects.get(key).slice().buffer; } };
  }
};
let sends = 0;
const originalFetch = globalThis.fetch;
globalThis.fetch = async (url, options) => {
  assert.equal(url, "https://api.resend.com/emails");
  const body = JSON.parse(options.body);
  assert.equal(body.attachments.length, 4);
  assert.equal(body.to[0], order.customerEmail);
  sends++;
  return { ok: true, async json() { return { id: "mail_mock_123456" }; } };
};
const env = {
  DB, CONTRACT_R2, BXC_CONTRACT_STAGING_ENABLED: "true",
  RESEND_API_KEY: "mock", CONTRACT_FROM: "sender@example.invalid"
};
try {
  await assert.rejects(prepareContractConfirmationStaging({
    env, acceptedOrder: order, annexes, acceptanceVerified: false
  }), /acceptance/);
  await assert.rejects(prepareContractConfirmationStaging({
    env, acceptedOrder: order, annexes: annexes.slice(0, 2), acceptanceVerified: true
  }), /annexes/);
  const prepared = await prepareContractConfirmationStaging({
    env, acceptedOrder: order, annexes, acceptanceVerified: true
  });
  assert.equal(objects.size, 1);
  assert.equal((await prepareContractConfirmationStaging({
    env, acceptedOrder: order, annexes, acceptanceVerified: true
  })).pdfSha256, prepared.pdfSha256);
  assert.equal(objects.size, 1);
  const params = { env, acceptedOrder: order, annexes, acceptanceVerified: true,
    privateObjectKey: prepared.privateObjectKey, pdfSha256: prepared.pdfSha256 };
  await assert.rejects(dispatchContractConfirmationStaging({
    ...params, acceptedOrder: { ...order, exactScope: "Changed scope" }
  }), /mismatch/);
  assert.equal(sends, 0);
  const result = await dispatchContractConfirmationStaging(params);
  assert.equal(result.status, "provider_accepted");
  assert.equal(sends, 1);
  assert.equal((await dispatchContractConfirmationStaging(params)).status, "not_claimed");
  assert.equal(sends, 1);
  assert.equal(rows.get(order.orderId).email_status, "provider_accepted");
  console.log("Integrated contract staging pipeline mock tests passed");
} finally {
  globalThis.fetch = originalFetch;
}
