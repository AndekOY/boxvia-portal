// BoxVia contract PDF A4 renderer. Draft only; not connected to Worker.
// Pure JS; English ASCII text only. Rejects unsupported Unicode rather than corrupting legal names.
// For Polish diacritics in real customer/provider data, a reviewed embedded Unicode font is required.
const W = 595.276, H = 841.89;
const enc = new TextEncoder();
const safe = v => {
  const s = String(v);
  if (/[^\x20-\x7e]/.test(s)) throw new Error("Unsupported glyph; Unicode font required");
  return s.replaceAll("\\", "\\\\").replaceAll("(", "\\(").replaceAll(")", "\\)");
};
function wrap(text, width, size) {
  const n = Math.max(1, Math.floor(width / (size * 0.54)));
  const lines = []; let line = "";
  for (const word of String(text).split(/\s+/)) {
    if (word.length > n) throw new Error("Unbreakable text exceeds A4 width");
    if (line && line.length + word.length + 1 > n) { lines.push(line); line = word; }
    else line += (line ? " " : "") + word;
  }
  if (line) lines.push(line);
  return lines;
}
export function renderContractConfirmationA4(s) {
  const required = ["orderId","acceptedAt","providerName","providerContact","providerAddress",
    "customerEmail","productId","productVersion","exactScope","totalPrice","currency",
    "taxDisclosure","deliveryRule","reportLanguage","deliveryChannel","termsVersion","scheduleVersion"];
  for (const key of required) if (typeof s?.[key] !== "string" || !s[key].trim()) throw new Error("Missing field: " + key);
  if (!["check-a-claim","one-question-review","focused-ai-governance-review"].includes(s.productId)) throw new Error("Unsupported service");
  if (!Array.isArray(s.acceptedDocuments) || !s.acceptedDocuments.length) throw new Error("Accepted documents required");
  const serviceNames = { "check-a-claim": "Check a Claim", "one-question-review": "One Question Review", "focused-ai-governance-review": "Focused AI Governance Review" };
  const serviceName = serviceNames[s.productId];
  const commands = []; let y = 793;
  const add = (text, { bold = false, size = 9, leading = 13, gap = 0 } = {}) => {
    for (const line of wrap(text, 505, size)) {
      if (y - leading < 83) throw new Error("A4 confirmation overflow");
      commands.push(`BT /${bold ? "F2" : "F1"} ${size} Tf 1 0 0 1 45 ${y.toFixed(2)} Tm (${safe(line)}) Tj ET`);
      y -= leading;
    }
    y -= gap;
  };
  const heading = t => add(t, { bold: true, size: 10, leading: 16, gap: 2 });
  add("BOXVIA | ORDER & CONTRACT CONFIRMATION", { bold: true, size: 15, leading: 23, gap: 3 });
  add("Document: Order confirmation | Language: English | Page 1 of 1", { size: 8, leading: 16, gap: 8 });
  add("SERVICE: " + serviceName, { bold: true, size: 12, leading: 19, gap: 6 });
  heading("1. CONTRACT AND PARTIES");
  add(`Order ID: ${s.orderId} | Accepted (UTC): ${s.acceptedAt}`);
  add(`Provider: ${s.providerName} | Contact: ${s.providerContact}`);
  add(`Provider address: ${s.providerAddress}`);
  add(`Customer email: ${s.customerEmail}`, { gap: 5 });
  heading("2. SERVICE AND PRICE");
  add(`Service name: ${serviceName} | Version: ${s.productVersion}`);
  add(`Agreed scope: ${s.exactScope}`);
  add(`Total payable: ${s.totalPrice} ${s.currency} | Tax: ${s.taxDisclosure}`, { gap: 5 });
  heading("3. DELIVERY");
  add(`Delivery rule: ${s.deliveryRule}`);
  add(`Report language: ${s.reportLanguage} | Channel: ${s.deliveryChannel}`, { gap: 5 });
  heading("4. ACCEPTED TERMS AND CONSUMER INFORMATION");
  add(`Terms version: ${s.termsVersion} | Schedule version: ${s.scheduleVersion}`);
  for (const d of s.acceptedDocuments) {
    if (!d?.id || !d?.version || !/^[a-f0-9]{64}$/.test(d.sha256 || "")) throw new Error("Invalid accepted document");
    add(`Accepted document: ${d.id} / ${d.version} / SHA-256: ${d.sha256}`, { size: 7.5, leading: 11 });
  }
  add(s.earlyPerformanceRequest ?
    `Early performance request: ${s.earlyPerformanceRequest.textVersion} / ${s.earlyPerformanceRequest.requestedAt}` :
    "Early performance request: not recorded");
  add("Complete accepted terms, schedule and applicable statutory withdrawal information are supplied as separate immutable attachments.", { size: 8, leading: 12, gap: 6 });
  heading("5. RECORD INTEGRITY");
  add("This confirmation records the accepted order. Payment alone does not remove statutory withdrawal rights.", { size: 8, leading: 12 });
  add("Keep this PDF and the accompanying contractual documents for your records.", { size: 8, leading: 12 });
  // Fixed footer remains separate from the variable-length body.
  const footer = [
    "0.7 w 45 62 m 550 62 l S",
    `BT /F2 8 Tf 1 0 0 1 45 48 Tm (${safe("BOXVIA | " + serviceName)}) Tj ET`,
    `BT /F1 7 Tf 1 0 0 1 45 35 Tm (${safe("Order: " + s.orderId + " | Contract confirmation | Page 1 of 1")}) Tj ET`
  ];
  const stream = [...commands, ...footer].join("\n") + "\n";
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
    `<< /Length ${enc.encode(stream).length} >>\nstream\n${stream}endstream`
  ];
  let pdf = "%PDF-1.4\n"; const offsets = [];
  for (let i = 0; i < objects.length; i++) {
    offsets.push(enc.encode(pdf).length);
    pdf += `${i + 1} 0 obj\n${objects[i]}\nendobj\n`;
  }
  const xref = enc.encode(pdf).length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets) pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return enc.encode(pdf);
}
