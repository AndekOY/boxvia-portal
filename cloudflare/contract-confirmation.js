// BoxVia contract confirmation: staging-only pure data boundary.
// This module is deliberately NOT imported by worker.js and does not send email.
// It must be connected only after Polish consumer-law, checkout, VAT and GDPR gates.
const required = ["orderId", "acceptedAt", "productId", "productVersion", "exactScope",
  "termsVersion", "scheduleVersion", "customerEmail", "providerName",
  "providerAddress", "providerContact", "totalPrice", "currency", "taxDisclosure",
  "deliveryRule", "reportLanguage", "deliveryChannel"];
const productIds = new Set(["check-a-claim", "one-question-review", "focused-ai-governance-review"]);
const plain = value => typeof value === "string" && value.trim().length > 0;
const asString = value => String(value ?? "").trim();
const invalidControl = value => /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value);
const hex = bytes => [...new Uint8Array(bytes)].map(b => b.toString(16).padStart(2, "0")).join("");
export function validateContractSnapshot(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new TypeError("Invalid contract snapshot");
  for (const key of required) {
    if (!plain(input[key])) throw new TypeError("Missing contract field: " + key);
    if (asString(input[key]).length > 5000 || invalidControl(input[key])) throw new TypeError("Invalid contract field: " + key);
  }
  // Reject fields the current A4 renderer cannot reproduce faithfully.
  for (const key of required) {
    if (/[^\x20-\x7e]/.test(input[key])) throw new TypeError("Unsupported contract glyph or line break: " + key);
  }
  if (input.reportLanguage !== "English") throw new TypeError("English-only contract report required");
  if (!productIds.has(input.productId)) throw new TypeError("Unsupported standardized service");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.customerEmail)) throw new TypeError("Invalid email");
  if (!/^\d{4}-\d{2}-\d{2}T/.test(input.acceptedAt) || Number.isNaN(Date.parse(input.acceptedAt))) throw new TypeError("Invalid acceptance time");
  if (!/^[A-Z]{3}$/.test(input.currency)) throw new TypeError("Invalid currency");
  if (!/^\d+(?:\.\d{2})?$/.test(input.totalPrice)) throw new TypeError("Invalid total price");
  const expected = { "check-a-claim": "20.00", "one-question-review": "50.00", "focused-ai-governance-review": "50.00" };
  if (input.currency !== "USD" || Number(input.totalPrice) !== Number(expected[input.productId])) {
    throw new TypeError("Product/price mismatch");
  }
  if (!Array.isArray(input.acceptedDocuments) || !input.acceptedDocuments.length) {
    throw new TypeError("Missing immutable accepted documents");
  }
  const documentIds = new Set();
  for (const doc of input.acceptedDocuments) {
    if (!plain(doc?.id) || !plain(doc?.version) || !plain(doc?.sha256) ||
        !/^[a-f0-9]{64}$/.test(doc.sha256) ||
        !/^[A-Za-z0-9_.-]{1,100}$/.test(doc.id) ||
        !/^[A-Za-z0-9_.-]{1,100}$/.test(doc.version) ||
        documentIds.has(doc.id)) {
      throw new TypeError("Invalid or duplicate accepted document reference");
    }
    documentIds.add(doc.id);
  }
  if (input.earlyPerformanceRequest != null) {
    if (!plain(input.earlyPerformanceRequest.textVersion) ||
        !plain(input.earlyPerformanceRequest.requestedAt) ||
        Number.isNaN(Date.parse(input.earlyPerformanceRequest.requestedAt))) {
      throw new TypeError("Invalid early performance evidence");
    }
  }
  return Object.freeze({
    ...Object.fromEntries(required.map(key => [key, asString(input[key])])),
    acceptedDocuments: Object.freeze(input.acceptedDocuments.map(d => Object.freeze({
      id: d.id, version: d.version, sha256: d.sha256
    }))),
    earlyPerformanceRequest: input.earlyPerformanceRequest == null ? null :
      Object.freeze({ textVersion: input.earlyPerformanceRequest.textVersion,
        requestedAt: input.earlyPerformanceRequest.requestedAt })
  });
}
export async function snapshotSha256(snapshot) {
  const encoded = new TextEncoder().encode(JSON.stringify(snapshot));
  return hex(await crypto.subtle.digest("SHA-256", encoded));
}
export function confirmationText(snapshot) {
  return [
    "BOXVIA — ORDER & CONTRACT CONFIRMATION",
    "Order: " + snapshot.orderId,
    "Accepted: " + snapshot.acceptedAt,
    "Provider: " + snapshot.providerName,
    "Provider address: " + snapshot.providerAddress,
    "Provider contact: " + snapshot.providerContact,
    "Customer: " + snapshot.customerEmail,
    "Service: " + snapshot.productId + " / " + snapshot.productVersion,
    "Scope: " + snapshot.exactScope,
    "Total price: " + snapshot.totalPrice + " " + snapshot.currency,
    "Tax: " + snapshot.taxDisclosure,
    "Delivery: " + snapshot.deliveryRule,
    "Report language: " + snapshot.reportLanguage,
    "Channel: " + snapshot.deliveryChannel,
    "Terms: " + snapshot.termsVersion,
    "Service schedule: " + snapshot.scheduleVersion,
    "Accepted document IDs: " + snapshot.acceptedDocuments.map(d => d.id + "@" + d.version).join(", "),
    "Early performance request: " + (snapshot.earlyPerformanceRequest ?
      snapshot.earlyPerformanceRequest.textVersion + " / " + snapshot.earlyPerformanceRequest.requestedAt : "not recorded"),
    "This one-page confirmation is accompanied by the complete accepted terms and applicable statutory notices."
  ].join("\n");
}
// PDF rendering must enforce A4 page count === 1 and fail closed on overflow.
// No PDF library, private storage or Resend dispatch is activated in this module.
