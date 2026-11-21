// BCDE Stage 1: deterministic, dependency-free PDF prototype for English ASCII terms.
// Fail closed on unsupported glyphs; production multilingual PDF requires embedded Unicode font.
const ascii = value => {
  if (typeof value !== "string" || /[^\x20-\x7e]/.test(value)) throw new Error("Unsupported PDF characters");
  return value.replaceAll("\\","\\\\").replaceAll("(","\\(").replaceAll(")","\\)");
};
const lines = (title, rows) => {
  const result=[title,...rows];
  if(result.length>45) throw new Error("PDF exceeds single-page limit");
  return result.map(ascii);
};
export function renderCommercialPdf(title, rows) {
  const items=lines(title,rows);
  const stream=["BT","/F1 11 Tf","50 790 Td","15 TL",
    ...items.flatMap((item,i)=>[...(i?["T*"]:[]),`(${item}) Tj`]),"ET"].join("\n");
  const objects=[
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`
  ];
  let pdf="%PDF-1.4\n",offsets=[0];
  for(let i=0;i<objects.length;i++){offsets.push(pdf.length);pdf+=`${i+1} 0 obj\n${objects[i]}\nendobj\n`;}
  const start=pdf.length;
  pdf+=`xref\n0 ${objects.length+1}\n0000000000 65535 f \n`;
  for(const offset of offsets.slice(1))pdf+=String(offset).padStart(10,"0")+" 00000 n \n";
  pdf+=`trailer\n<< /Size ${objects.length+1} /Root 1 0 R >>\nstartxref\n${start}\n%%EOF\n`;
  return new TextEncoder().encode(pdf);
}
const hex = bytes=>[...new Uint8Array(bytes)].map(x=>x.toString(16).padStart(2,"0")).join("");
export async function sha256Bytes(bytes){return hex(await crypto.subtle.digest("SHA-256",bytes));}
export function buildOrderTermsPdf({orderId,service,amountMinor,currency,scope,deliverable,deadline,termsVersion,offerVersion,confidentialityVersion}){
  if(!Number.isSafeInteger(amountMinor)||amountMinor<=0||currency!=="USD")throw new Error("Invalid price");
  return renderCommercialPdf("BoxVia - Commercial Order Terms",[
    "Order: "+orderId,"Service: "+service,"Final price: USD "+(amountMinor/100).toFixed(2),
    "Scope: "+scope,"Deliverable: "+deliverable,"Deadline: "+deadline,
    "Terms version: "+termsVersion,"Offer version: "+offerVersion,
    "Confidentiality version: "+confidentialityVersion,
    "Commercial order summary only - not a tax invoice."
  ]);
}
export function buildAcceptancePdf({orderId,termsDigest,offerVersion,offerDigest,offerAcceptedAt,confidentialityVersion,confidentialityDigest,confidentialityAcceptedAt}){
  return renderCommercialPdf("BoxVia - Acceptance Evidence Record",[
    "Order: "+orderId,"Terms SHA-256: "+termsDigest,
    "Offer version: "+offerVersion,"Offer SHA-256: "+offerDigest,
    "Offer accepted: "+offerAcceptedAt,
    "Confidentiality version: "+confidentialityVersion,
    "Confidentiality SHA-256: "+confidentialityDigest,
    "Confidentiality accepted: "+confidentialityAcceptedAt,
    "Recorded consent evidence - not a digital signature."
  ]);
}
