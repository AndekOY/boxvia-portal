// Isolated Preview-only passkey enrollment gateway.
// Requires cryptographically verified Cloudflare Access JWT and configured owner email.
// Enrollment finish deliberately remains disabled until audited attestation validation exists.
import {encodeBase64url,decodeBase64url} from "./hitl-webauthn-verify.js";
const reply=(obj,status=200)=>Response.json(obj,{status,headers:{"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}});
const utf8=new TextDecoder("utf-8",{fatal:true}),enc=new TextEncoder();
const sha=async value=>Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",enc.encode(value))),b=>b.toString(16).padStart(2,"0")).join("");
const ascii=s=>utf8.decode(decodeBase64url(s));
const same=(a,b)=>typeof a==="string"&&typeof b==="string"&&a.length===b.length&&a===b;
async function accessIdentity(request,env) {
  const issuer=env.HITL_ACCESS_ISSUER, audience=env.HITL_ACCESS_AUD, owner=env.HITL_OWNER_EMAIL;
  if(!issuer||!audience||!owner||!/^https:\/\/[a-z0-9-]+\.cloudflareaccess\.com$/.test(issuer))return null;
  const token=request.headers.get("Cf-Access-Jwt-Assertion");
  if(!token||token.length>12000)return null;
  const parts=token.split(".");if(parts.length!==3)return null;
  const header=JSON.parse(ascii(parts[0])),payload=JSON.parse(ascii(parts[1]));
  if(header.alg!=="RS256"||typeof header.kid!=="string"||header.kid.length>256)return null;
  const now=Math.floor(Date.now()/1000);
  if(payload.iss!==issuer||!Array.isArray(payload.aud)||!payload.aud.includes(audience)||
     !Number.isSafeInteger(payload.exp)||payload.exp<=now||!Number.isSafeInteger(payload.iat)||payload.iat>now+60||
     !same(payload.email?.toLowerCase(),owner.toLowerCase())||typeof payload.sub!=="string")return null;
  const response=await fetch(issuer+"/cdn-cgi/access/certs",{redirect:"error",cf:{cacheTtl:60,cacheEverything:true}});
  if(!response.ok)return null;
  const keys=await response.json();
  const jwk=(keys.keys||[]).find(k=>k.kid===header.kid&&k.kty==="RSA"&&k.use==="sig"&&k.alg==="RS256");
  if(!jwk)return null;
  const key=await crypto.subtle.importKey("jwk",jwk,{name:"RSASSA-PKCS1-v1_5",hash:"SHA-256"},false,["verify"]);
  if(!await crypto.subtle.verify("RSASSA-PKCS1-v1_5",key,decodeBase64url(parts[2]),enc.encode(parts[0]+"."+parts[1])))return null;
  return {id:payload.sub,email:payload.email};
}
export async function handleHitlPasskeyEnrollment(request,env,url) {
  if(env.HITL_PASSKEY_ENROLLMENT_ENABLED!=="true"||env.HITL_HUMAN_ATTESTATION_REQUIRED!=="true"||!env.DB)return reply({error:"Enrollment disabled"},503);
  if(url.hostname!==env.HITL_PASSKEY_RP_ID||url.protocol!=="https:")return reply({error:"RP mismatch"},403);
  let owner;try{owner=await accessIdentity(request,env)}catch{return reply({error:"Identity unavailable"},503)}
  if(!owner)return reply({error:"Verified owner Access session required"},401);
  const base="/api/owner/hitl/passkey/";
  if(url.pathname===base+"status"&&request.method==="GET")
    return reply({ready:false,ownerVerified:true,previewOnly:true,reason:"attestation_verifier_pending"});
  if(url.pathname===base+"begin"&&request.method==="POST"){
    if(request.headers.get("Origin")!==url.origin)return reply({error:"Origin mismatch"},403);
    const challenge=encodeBase64url(crypto.getRandomValues(new Uint8Array(32)));
    const id=crypto.randomUUID();
    const ownerId=encodeBase64url(new Uint8Array(await crypto.subtle.digest("SHA-256",enc.encode(owner.id))));
    const expiresAt=Math.floor(Date.now()/1000)+120;
    try{
      const result=await env.DB.prepare("INSERT INTO hitl_passkey_enrollments(id,owner_id,challenge_sha256,rp_id,origin,expires_at) VALUES(?,?,?,?,?,?)")
       .bind(id,owner.id,await sha(challenge),url.hostname,url.origin,expiresAt).run();
      if(result.success!==true)return reply({error:"Storage unavailable"},503);
    }catch{return reply({error:"Storage unavailable"},503)}
    return reply({enrollmentId:id,publicKey:{challenge,rp:{id:url.hostname,name:"BoxVia HITL Preview"},user:{id:ownerId,name:owner.email,displayName:"BoxVia HITL Owner"},pubKeyCredParams:[{type:"public-key",alg:-7}],authenticatorSelection:{userVerification:"required",residentKey:"preferred"},attestation:"none",timeout:120000}});
  }
  // A raw attestation is not proof of enrollment without verified CBOR, COSE,
  // RP hash, origin, challenge, UV, unique credential and atomic consumption.
  if(url.pathname===base+"finish"&&request.method==="POST")return reply({error:"Attestation verifier not yet enabled; no credential registered"},501);
  return reply({error:"Not found"},404);
}
