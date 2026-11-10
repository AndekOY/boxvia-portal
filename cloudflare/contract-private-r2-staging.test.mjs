// Offline private R2 adapter tests (mock storage only).
// Run: node --experimental-default-type=module cloudflare/contract-private-r2-staging.test.mjs
import assert from "node:assert/strict";
import { sha256Bytes, storePrivateContractPdf, loadPrivateContractPdf } from "./contract-private-r2-staging.js";
const items = new Map();
const bucket = {
  async put(key, bytes) { items.set(key, new Uint8Array(bytes)); },
  async get(key) {
    if (!items.has(key)) return null;
    return { async arrayBuffer() { return items.get(key).slice().buffer; } };
  }
};
const pdf = new TextEncoder().encode("%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF\n");
const digest = await sha256Bytes(pdf);
const args = { bucket, orderId: "BXC-TEST-001", pdfBytes: pdf, expectedSha256: digest };
const first = await storePrivateContractPdf(args);
assert.equal(first.reused, false);
assert.equal((await storePrivateContractPdf(args)).reused, true);
assert.deepEqual(await loadPrivateContractPdf({
  bucket, privateObjectKey: first.privateObjectKey, expectedSha256: digest
}), pdf);
await assert.rejects(storePrivateContractPdf({ ...args, expectedSha256: "a".repeat(64) }), /mismatch/);
items.set(first.privateObjectKey, new TextEncoder().encode("%PDF-1.4\ncorrupted"));
await assert.rejects(loadPrivateContractPdf({
  bucket, privateObjectKey: first.privateObjectKey, expectedSha256: digest
}), /corrupted/);
console.log("Private contract R2 adapter mock tests passed");
