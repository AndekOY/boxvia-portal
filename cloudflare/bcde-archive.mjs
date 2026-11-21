// BCDE sandbox-only private R2 archiver; not exposed through public routes.
// Object keys are opaque order IDs and version digests; no client PII in keys.
import { sha256Bytes } from "./bcde-pdf.mjs";
const validId=/^[a-f0-9-]{36}$/i,validDigest=/^[a-f0-9]{64}$/;
export async function archiveCommercialPack(bucket,{orderId,termsPdf,acceptancePdf=null,termsDigest,version="v1"}){
  if(!bucket || !validId.test(orderId||"") || !validDigest.test(termsDigest||"") ||
      !/^v[1-9][0-9]*$/.test(version) || !(termsPdf instanceof Uint8Array) ||
      (acceptancePdf!==null && !(acceptancePdf instanceof Uint8Array)))throw new Error("Invalid archive input");
  const prefix=`bcde/${orderId}/${version}-${termsDigest}/`;
  const files=[["01_ORDER_TERMS.pdf",termsPdf]];
  if(acceptancePdf)files.push(["02_ACCEPTANCE_RECORD.pdf",acceptancePdf]);
  const manifest={schema:"bcde-stage1-v1",orderId,version,termsDigest,
    files:await Promise.all(files.map(async ([name,data])=>({name,sha256:await sha256Bytes(data),bytes:data.byteLength})))};
  const entries=[...files,["manifest.json",new TextEncoder().encode(JSON.stringify(manifest))]];
  // Preflight prevents normal overwrites; R2 conditional puts handle races.
  for(const [name] of entries)if(await bucket.head(prefix+name))throw new Error("Archive already exists");
  for(const [name,data] of entries){
    const result=await bucket.put(prefix+name,data,{
      onlyIf:{etagDoesNotMatch:"*"},
      httpMetadata:{contentType:name.endsWith(".pdf")?"application/pdf":"application/json"},
      customMetadata:{orderId,version}
    });
    if(!result)throw new Error("Archive write conflict");
  }
  return {prefix,manifest};
}
export async function downloadOwnerDocument(bucket,{orderId,termsDigest,version="v1",fileName}){
  if(!bucket || !validId.test(orderId||"") || !validDigest.test(termsDigest||"") ||
      !/^v[1-9][0-9]*$/.test(version) ||
      !["01_ORDER_TERMS.pdf","02_ACCEPTANCE_RECORD.pdf","manifest.json"].includes(fileName))return null;
  // Caller MUST authenticate owner separately. No public route is registered.
  const prefix=`bcde/${orderId}/${version}-${termsDigest}/`;
  // Manifest is written last: a partially written pack is not downloadable.
  if(fileName!=="manifest.json" && !await bucket.head(prefix+"manifest.json"))return null;
  return bucket.get(prefix+fileName);
}
