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

// Missing write acknowledgment and silent storage corruption must not be accepted.
const missingBucket = {
  async get() { return null; },
  async put() { return undefined; }
};
await assert.rejects(storePrivateContractPdf({ ...args, bucket: missingBucket }), /read-after-write/);
const corruptedBucket = {
  async get() { return { async arrayBuffer() {
    return new TextEncoder().encode("%PDF-1.4\\nWRONG\\n%%EOF").buffer;
  } }; },
  async put() { throw new Error("Existing object must never be overwritten"); }
};
await assert.rejects(storePrivateContractPdf({ ...args, bucket: corruptedBucket }), /integrity failure/);
const failingPutBucket = {
  async get() { return null; },
  async put() { throw new Error("R2 write unavailable"); }
};
await assert.rejects(storePrivateContractPdf({ ...args, bucket: failingPutBucket }), /R2 write unavailable/);
console.log("Private contract R2 adapter mock tests passed");
