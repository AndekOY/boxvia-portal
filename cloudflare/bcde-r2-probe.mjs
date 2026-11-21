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
