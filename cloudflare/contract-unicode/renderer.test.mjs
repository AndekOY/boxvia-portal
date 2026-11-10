import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PDFDocument } from "pdf-lib";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import { renderContractConfirmationUnicodeA4 } from "./renderer.js";

const font = new Uint8Array(await readFile(process.env.BXC_TEST_TTF || "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"));
const base = {
  orderId: "BXC-TEST-UNICODE-001", acceptedAt: "2026-11-10T10:00:00Z",
  providerName: "BoxVia", providerContact: "contact@example.invalid",
  providerAddress: "ul. Żwirki i Wigury 13/4, Szczecin, Polska",
  customerEmail: "customer@example.invalid", productId: "check-a-claim",
  productVersion: "v1", exactScope: "Independent review of a public claim",
  totalPrice: "20.00", currency: "USD", taxDisclosure: "TEST ONLY",
  deliveryRule: "Within 24 hours", reportLanguage: "English",
  deliveryChannel: "Email", termsVersion: "v1", scheduleVersion: "v1",
  acceptedDocuments: ["terms", "schedule", "withdrawal"].map(id => ({ id, version: "v1", sha256: "a".repeat(64) })),
  earlyPerformanceRequest: null
};
for (const productId of ["check-a-claim", "one-question-review", "focused-ai-governance-review"]) {
  const bytes = await renderContractConfirmationUnicodeA4({ ...base, productId }, font);
  assert.equal(new TextDecoder().decode(bytes.subarray(0, 5)), "%PDF-");
  const document = await PDFDocument.load(bytes);
  assert.equal(document.getPageCount(), 1);
  assert.deepEqual(document.getPage(0).getSize(), { width: 595.276, height: 841.89 });
  const reader = await pdfjs.getDocument({ data: bytes, useSystemFonts: false,
    disableFontFace: true }).promise;
  const pageText = await (await reader.getPage(1)).getTextContent();
  const extracted = pageText.items.map(item => item.str).join(" ");
  assert.ok(extracted.includes("Żwirki i Wigury"), "Polish Ż must survive PDF extraction");
  assert.ok(extracted.includes("Szczecin"), "Provider city must survive PDF extraction");
  assert.ok(extracted.includes("BOXVIA |"), "Confirmation footer must survive extraction");
  await reader.destroy();
  // Embedded font is produced by embedFont() in the renderer; independently\n  // verify the resulting PDF through text extraction above. Raw byte-string\n  // searches are not reliable for compressed PDF objects.
}
await assert.rejects(renderContractConfirmationUnicodeA4({
  ...base, exactScope: "long ".repeat(10000)
}, font), /overflow/);
await assert.rejects(renderContractConfirmationUnicodeA4({
  ...base, providerAddress: "Street 1\nStreet 2"
}, font), /Invalid PDF field/);
console.log("Unicode embedded-font A4 PDF staging tests passed");
