// Owner-authenticated, sandbox-only R2 round-trip diagnostic.
// Never uses customer orders, PII, payment credentials, or the bcde/ archive prefix.
export async function probeBcdeR2(bucket){
 if(!bucket || typeof bucket.put!=="function" || typeof bucket.get!=="function" || typeof bucket.delete!=="function")throw new Error("R2 binding unavailable");
 const bytes=crypto.getRandomValues(new Uint8Array(32));
 const key="diagnostics/"+crypto.randomUUID()+".bin";
 const expected=Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",bytes)),b=>b.toString(16).padStart(2,"0")).join("");
 let wrote=false;
 try{
  const saved=await bucket.put(key,bytes,{onlyIf:{etagDoesNotMatch:"*"},httpMetadata:{contentType:"application/octet-stream"}});
  if(!saved)throw new Error("R2 write rejected");
  wrote=true;
  const object=await bucket.get(key);
  if(!object)throw new Error("R2 read missing");
  const actualBytes=new Uint8Array(await object.arrayBuffer());
  const actual=Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",actualBytes)),b=>b.toString(16).padStart(2,"0")).join("");
  if(actual!==expected||actualBytes.length!==bytes.length)throw new Error("R2 digest mismatch");
  return {write:true,read:true,sha256Verified:true,bytes:bytes.length};
 }finally{
  if(wrote)await bucket.delete(key);
 }
}

export async function probeBcdeSyntheticPdfPack(bucket,buildOrderTermsPdf,buildAcceptancePdf,sha256Bytes){
 if(!bucket||typeof bucket.put!=="function"||typeof bucket.get!=="function"||typeof bucket.delete!=="function")throw new Error("R2 binding unavailable");
 const id=crypto.randomUUID(),digest="b".repeat(64);
 const a=buildOrderTermsPdf({orderId:id,service:"Synthetic Diagnostic Only",amountMinor:5000,currency:"USD",scope:"SYNTHETIC TEST ONLY - NO CUSTOMER CONTRACT",deliverable:"Synthetic PDF test",deadline:"Not applicable",termsVersion:"TEST",offerVersion:"TEST",confidentialityVersion:"TEST"});
 const b=buildAcceptancePdf({orderId:id,termsDigest:digest,offerVersion:"TEST",offerDigest:digest,offerAcceptedAt:"2000-01-01T00:00:00Z",confidentialityVersion:"TEST",confidentialityDigest:digest,confidentialityAcceptedAt:"2000-01-01T00:00:00Z"});
 const files=[["01_SYNTHETIC_TERMS.pdf",a],["02_SYNTHETIC_ACCEPTANCE.pdf",b]];
 const manifest={schema:"bcde-synthetic-diagnostic-v1",synthetic:true,files:await Promise.all(files.map(async ([name,bytes])=>({name,bytes:bytes.byteLength,sha256:await sha256Bytes(bytes)})))};
 const entries=[...files,["manifest.json",new TextEncoder().encode(JSON.stringify(manifest))]];
 const prefix="diagnostics/pdf-"+id+"/",written=[];
 try{
  for(const [name,bytes] of entries){
   const key=prefix+name;
   const saved=await bucket.put(key,bytes,{onlyIf:{etagDoesNotMatch:"*"},httpMetadata:{contentType:name.endsWith(".pdf")?"application/pdf":"application/json"}});
   if(!saved)throw new Error("R2 synthetic PDF write rejected");
   written.push(key);
  }
  for(const [name,bytes] of entries){
   const obj=await bucket.get(prefix+name);
   if(!obj)throw new Error("R2 synthetic PDF read missing");
   const actual=new Uint8Array(await obj.arrayBuffer());
   if(actual.byteLength!==bytes.byteLength || await sha256Bytes(actual)!==await sha256Bytes(bytes))throw new Error("R2 synthetic PDF integrity mismatch");
  }
 }finally{
  const results=await Promise.allSettled(written.map(key=>bucket.delete(key)));
  if(results.some(r=>r.status!=="fulfilled"))throw new Error("R2 synthetic PDF cleanup failed");
  for(const key of written)if(await bucket.get(key))throw new Error("R2 synthetic PDF cleanup not verified");
 }
 return {ok:true,synthetic:true,pdfCount:2,manifestVerified:true,sha256Verified:true,cleanupVerified:true};
}
