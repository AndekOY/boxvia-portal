// Isolated private R2 storage adapter for contract PDFs (staging only).
// Not imported by worker.js. No R2 binding exists in current wrangler.jsonc.
// The object key is never returned to a public client.
const SHA = /^[a-f0-9]{64}$/;
const ORDER = /^[A-Za-z0-9_-]{6,100}$/;
const hex = bytes => [...new Uint8Array(bytes)].map(b => b.toString(16).padStart(2, "0")).join("");
export async function sha256Bytes(bytes) {
  if (!(bytes instanceof Uint8Array)) throw new TypeError("PDF bytes required");
  return hex(await crypto.subtle.digest("SHA-256", bytes));
}
export async function storePrivateContractPdf({ bucket, orderId, pdfBytes, expectedSha256 }) {
  if (!bucket?.put || !bucket?.get || !ORDER.test(orderId || "") ||
      !(pdfBytes instanceof Uint8Array) || pdfBytes.length < 32 ||
      !SHA.test(expectedSha256 || "")) throw new TypeError("Invalid contract storage request");
  if (String.fromCharCode(...pdfBytes.subarray(0, 5)) !== "%PDF-") throw new TypeError("Not a PDF");
  const actualHash = await sha256Bytes(pdfBytes);
  if (actualHash !== expectedSha256) throw new Error("PDF hash mismatch");
  // Content-addressed key prevents accidental overwrite of a different PDF for the same order.
  const key = "contracts/" + orderId + "/" + actualHash + ".pdf";
  const existing = await bucket.get(key);
  if (existing) {
    const oldHash = await sha256Bytes(new Uint8Array(await existing.arrayBuffer()));
    if (oldHash !== actualHash) throw new Error("Existing private object integrity failure");
    return { privateObjectKey: key, pdfSha256: actualHash, reused: true };
  }
  const writeResult = await bucket.put(key, pdfBytes, {
    onlyIf: { etagDoesNotMatch: "*" },
    httpMetadata: { contentType: "application/pdf", contentDisposition: "attachment" },
    customMetadata: { orderId, sha256: actualHash }
  });
  // A conditional write may lose a race; verify the winning bytes instead.
  const stored = await bucket.get(key);
  if (!stored) throw new Error("R2 read-after-write verification failed");
  const storedHash = await sha256Bytes(new Uint8Array(await stored.arrayBuffer()));
  if (storedHash !== actualHash) throw new Error("Stored PDF integrity failure");
  return { privateObjectKey: key, pdfSha256: actualHash, reused: !writeResult };
}
export async function loadPrivateContractPdf({ bucket, privateObjectKey, expectedSha256 }) {
  if (!bucket?.get || !/^contracts\/[A-Za-z0-9_-]{6,100}\/[a-f0-9]{64}\.pdf$/.test(privateObjectKey || "") ||
      !SHA.test(expectedSha256 || "")) throw new TypeError("Invalid private PDF reference");
  if (!privateObjectKey.endsWith("/" + expectedSha256 + ".pdf")) throw new Error("Object key digest mismatch");
  const object = await bucket.get(privateObjectKey);
  if (!object) throw new Error("Private contract PDF missing");
  const bytes = new Uint8Array(await object.arrayBuffer());
  if (await sha256Bytes(bytes) !== expectedSha256) throw new Error("Private contract PDF corrupted");
  return bytes;
}
