// Contract PDF A4 regression tests, isolated from production and external services.
// Run: node --experimental-default-type=module cloudflare/contract-pdf-a4.test.mjs
import assert from "node:assert/strict";
import { renderContractConfirmationA4 } from "./contract-pdf-a4.js";
const decode = bytes => new TextDecoder().decode(bytes);
const base = {
  orderId: "BXC-TEST-001", acceptedAt: "2026-11-10T10:00:00Z",
  providerName: "BoxVia Test Provider", providerContact: "contact@example.invalid",
  providerAddress: "Test Street 1, Szczecin, Poland",
  customerEmail: "customer@example.invalid", productId: "check-a-claim",
  productVersion: "v0.2", exactScope: "One claim checked against one public primary source",
  totalPrice: "20.00", currency: "USD", taxDisclosure: "TEST ONLY",
  deliveryRule: "Within 24 hours after lawful acceptance",
  reportLanguage: "English", deliveryChannel: "Email",
  termsVersion: "v0.1", scheduleVersion: "A-v0.1",
  acceptedDocuments: [{ id: "terms", version: "v0.1", sha256: "a".repeat(64) }],
  earlyPerformanceRequest: null
};
const names = [
  ["check-a-claim", "Check a Claim", "20.00"],
  ["one-question-review", "One Question Review", "50.00"],
  ["focused-ai-governance-review", "Focused AI Governance Review", "50.00"]
];
for (const [productId, name, totalPrice] of names) {
  const pdf = decode(renderContractConfirmationA4({ ...base, productId, totalPrice }));
  assert.ok(pdf.startsWith("%PDF-1.4\n"));
  assert.ok(pdf.includes("/Count 1"));
  assert.ok(pdf.includes("/MediaBox [0 0 595.276 841.89]"));
  assert.ok(pdf.includes("SERVICE: " + name));
  assert.ok(pdf.includes("BOXVIA | " + name));
  assert.ok(pdf.includes("Page 1 of 1"));
  assert.ok(pdf.includes("stream\nBT /F2"));
  assert.ok(!pdf.includes("stream\\nBT"));
  assert.ok(pdf.endsWith("%%EOF\n"));
}
assert.throws(() => renderContractConfirmationA4({ ...base, exactScope: "long ".repeat(5000) }), /overflow/);
assert.throws(() => renderContractConfirmationA4({ ...base, providerName: "Name with Polish letter ł" }), /Unsupported glyph/);
assert.throws(() => renderContractConfirmationA4({ ...base, acceptedDocuments: [] }), /Accepted documents/);
console.log("English A4 PDF renderer regression tests passed");
