// Staging-only Unicode renderer. Not imported by production Worker.
// Font bytes must be a reviewed, licensed TTF with Polish glyph coverage.
// No font data is fetched over the network and no names are transliterated.
import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

const A4 = [595.276, 841.89];
const names = {
  "check-a-claim": "Check a Claim",
  "one-question-review": "One Question Review",
  "focused-ai-governance-review": "Focused AI Governance Review"
};
function printable(value, label) {
  if (typeof value !== "string" || !value.trim() || /[\u0000-\u001f\u007f]/u.test(value)) {
    throw new TypeError("Invalid PDF field: " + label);
  }
  return value;
}
function linesFor(font, value, size, maxWidth) {
  const result = [];
  let current = "";
  for (const word of value.split(/ +/u)) {
    if (font.widthOfTextAtSize(word, size) > maxWidth) throw new Error("Unbreakable A4 text: " + word.slice(0, 24));
    const candidate = current ? current + " " + word : word;
    if (font.widthOfTextAtSize(candidate, size) > maxWidth) {
      result.push(current);
      current = word;
    } else current = candidate;
  }
  if (current) result.push(current);
  return result;
}
export async function renderContractConfirmationUnicodeA4(snapshot, fontBytes) {
  if (!(fontBytes instanceof Uint8Array) || fontBytes.length < 1024) throw new TypeError("Reviewed TTF font bytes required");
  const name = names[snapshot?.productId];
  if (!name) throw new TypeError("Unsupported contract product");
  const fields = ["orderId", "acceptedAt", "providerName", "providerContact",
    "providerAddress", "customerEmail", "productVersion", "exactScope",
    "totalPrice", "currency", "taxDisclosure", "deliveryRule", "reportLanguage",
    "deliveryChannel", "termsVersion", "scheduleVersion"];
  for (const field of fields) printable(snapshot[field], field);
  if (!Array.isArray(snapshot.acceptedDocuments) || snapshot.acceptedDocuments.length === 0) throw new TypeError("Accepted documents required");
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const font = await pdf.embedFont(fontBytes, { subset: true });
  // Font embedding is isolated from production pending glyph-fidelity review.
  const page = pdf.addPage(A4);
  const dark = rgb(0.12, 0.16, 0.22);
  let y = 790;
  function write(value, size = 9, leading = 13, gap = 0) {
    for (const line of linesFor(font, String(value), size, 505)) {
      if (y - leading < 84) throw new Error("A4 confirmation overflow");
      page.drawText(line, { x: 45, y, size, font, color: dark });
      y -= leading;
    }
    y -= gap;
  }
  function section(title) { write(title, 10, 16, 2); }
  write("BOXVIA | ORDER & CONTRACT CONFIRMATION", 15, 23, 3);
  write("Document: Order confirmation | Language: English | Page 1 of 1", 8, 16, 8);
  write("SERVICE: " + name, 12, 19, 6);
  section("1. CONTRACT AND PARTIES");
  write("Order ID: " + snapshot.orderId + " | Accepted (UTC): " + snapshot.acceptedAt);
  write("Provider: " + snapshot.providerName + " | Contact: " + snapshot.providerContact);
  write("Provider address: " + snapshot.providerAddress);
  write("Customer email: " + snapshot.customerEmail, 9, 13, 5);
  section("2. SERVICE AND PRICE");
  write("Service name: " + name + " | Version: " + snapshot.productVersion);
  write("Agreed scope: " + snapshot.exactScope);
  write("Total payable: " + snapshot.totalPrice + " " + snapshot.currency + " | Tax: " + snapshot.taxDisclosure, 9, 13, 5);
  section("3. DELIVERY");
  write("Delivery rule: " + snapshot.deliveryRule);
  write("Report language: " + snapshot.reportLanguage + " | Channel: " + snapshot.deliveryChannel, 9, 13, 5);
  section("4. ACCEPTED TERMS AND CONSUMER INFORMATION");
  write("Terms version: " + snapshot.termsVersion + " | Schedule version: " + snapshot.scheduleVersion);
  for (const d of snapshot.acceptedDocuments) {
    if (!/^[a-f0-9]{64}$/.test(d?.sha256 || "")) throw new TypeError("Invalid annex hash");
    write("Accepted document: " + printable(d.id, "document id") + " / " +
      printable(d.version, "document version") + " / SHA-256: " + d.sha256, 7.5, 11);
  }
  const early = snapshot.earlyPerformanceRequest;
  write(early ? "Early performance request: " + printable(early.textVersion, "early text") +
    " / " + printable(early.requestedAt, "early date") : "Early performance request: not recorded");
  write("Complete accepted terms, schedule and applicable statutory withdrawal information are supplied as separate immutable attachments.", 8, 12, 6);
  section("5. RECORD INTEGRITY");
  write("This confirmation records the accepted order. Payment alone does not remove statutory withdrawal rights.", 8, 12);
  write("Keep this PDF and the accompanying contractual documents for your records.", 8, 12);
  page.drawLine({ start: { x: 45, y: 62 }, end: { x: 550, y: 62 }, thickness: 0.7, color: dark });
  page.drawText("BOXVIA | " + name, { x: 45, y: 48, size: 8, font, color: dark });
  page.drawText("Order: " + snapshot.orderId + " | Contract confirmation | Page 1 of 1",
    { x: 45, y: 35, size: 7, font, color: dark });
  if (pdf.getPageCount() !== 1) throw new Error("A4 page count violation");
  return new Uint8Array(await pdf.save({ useObjectStreams: false }));
}
