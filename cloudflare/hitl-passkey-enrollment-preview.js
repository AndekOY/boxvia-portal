// Isolated Preview-only passkey enrollment gateway.
// Requires cryptographically verified Cloudflare Access JWT and configured owner email.
// Registration requires strict WebAuthn verification; new credentials remain PENDING.
import {encodeBase64url,decodeBase64url} from "./hitl-webauthn-verify.js";
import {verifyHitlRegistration} from "./hitl-passkey-registration-verify.js";
import {handleHitlPasskeyLogin} from "./hitl-passkey-authentication-preview.js";
import {handleMinimaxAttestation} from "./hitl-minimax-attestation-preview.js";
const reply=(obj,status=200)=>Response.json(obj,{status,headers:{"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}});
const utf8=new TextDecoder("utf-8",{fatal:true}),enc=new TextEncoder();
const sha=async value=>Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",enc.encode(value))),b=>b.toString(16).padStart(2,"0")).join("");
const ascii=s=>utf8.decode(decodeBase64url(s));
const same=(a,b)=>typeof a==="string"&&typeof b==="string"&&a.length===b.length&&a===b;
async function accessIdentity(request,env) {
  const issuer=env.HITL_ACCESS_ISSUER, audience=env.HITL_ACCESS_AUD, owner=env.HITL_OWNER_EMAIL;
  if(typeof issuer!=="string"||typeof audience!=="string"||typeof owner!=="string"||
     !/^https:\/\/[a-z0-9-]+\.cloudflareaccess\.com$/.test(issuer))return null;
  const token=request.headers.get("Cf-Access-Jwt-Assertion");
  if(!token||token.length>12000)return null;
  const parts=token.split(".");if(parts.length!==3)return null;
  let header,payload;
  try {
    header=JSON.parse(ascii(parts[0]));
    payload=JSON.parse(ascii(parts[1]));
  } catch {throw Error("JWT_DECODE_OR_PARSE");}
  if(!header||typeof header!=="object"||Array.isArray(header)||
     !payload||typeof payload!=="object"||Array.isArray(payload))throw Error("JWT_STRUCTURE");
  if(header.alg!=="RS256"||typeof header.kid!=="string"||header.kid.length>256)return null;
  const now=Math.floor(Date.now()/1000);
  // Cloudflare Access JWT audience can be a string or an array of strings.
  const audiences=typeof payload.aud==="string"?[payload.aud]:payload.aud;
  if(payload.iss!==issuer||!Array.isArray(audiences)||!audiences.includes(audience)||
     !Number.isSafeInteger(payload.exp)||payload.exp<=now||
     !Number.isSafeInteger(payload.iat)||payload.iat>now+60||
     typeof payload.email!=="string"||!same(payload.email.toLowerCase(),owner.toLowerCase())||
     typeof payload.sub!=="string")return null;
  // Public Access JWKS is fetched by the trusted deployment runner, never from a Worker request.
  // Fail closed when absent, malformed, or older than 48h; Refresh by rerunning the isolated Preview workflow before expiry or on rotation.
  let keys;
  try {keys=JSON.parse(env.HITL_ACCESS_JWKS_PUBLIC||"");}
  catch {throw Error("JWKS_CONFIG");}
  if(!keys||!Array.isArray(keys.keys)||!Number.isSafeInteger(keys.fetched_at)||
     keys.fetched_at>now+60||now-keys.fetched_at>172800)throw Error("JWKS_STALE_OR_INVALID");
  const jwk=keys.keys.find(k=>k&&k.kid===header.kid&&k.kty==="RSA"&&
    (k.use===undefined||k.use==="sig")&&(k.alg===undefined||k.alg==="RS256"));
  if(!jwk)return null;
  let verified;
  try {
    const key=await crypto.subtle.importKey("jwk",jwk,{name:"RSASSA-PKCS1-v1_5",hash:"SHA-256"},false,["verify"]);
    verified=await crypto.subtle.verify("RSASSA-PKCS1-v1_5",key,decodeBase64url(parts[2]),enc.encode(parts[0]+"."+parts[1]));
  } catch {throw Error("SIGNATURE_CRYPTO");}
  if(!verified)return null;
  return {id:payload.sub,email:payload.email};
}
export async function handleHitlPasskeyEnrollment(request,env,url) {
  if(env.HITL_PASSKEY_ENROLLMENT_ENABLED!=="true"||env.HITL_HUMAN_ATTESTATION_REQUIRED!=="true"||!env.DB)return reply({error:"Enrollment disabled"},503);
  if(url.hostname!==env.HITL_PASSKEY_RP_ID||url.protocol!=="https:")return reply({error:"RP mismatch"},403);
  let owner;try{owner=await accessIdentity(request,env)}catch(error){
    // Diagnostic is deliberately non-sensitive: no JWT, owner email, key material or exception message.
    const allowed=new Set(["JWT_DECODE_OR_PARSE","JWT_STRUCTURE","JWKS_CONFIG","JWKS_STALE_OR_INVALID","SIGNATURE_CRYPTO"]);
    const code=allowed.has(error?.message)?error.message:"IDENTITY_VERIFICATION_EXCEPTION";
    console.error("HITL_ACCESS_IDENTITY_EXCEPTION",code);
    return reply({error:"Identity unavailable",diagnostic:code},503);
  }
  if(!owner)return reply({error:"Verified owner Access session required"},401);
  if(url.pathname.startsWith("/api/owner/hitl/passkey/attest/"))return handleMinimaxAttestation(request,env,url,owner);
  if(url.pathname.startsWith("/api/owner/hitl/passkey/login/"))return handleHitlPasskeyLogin(request,env,url,owner);
  const base="/api/owner/hitl/passkey/";
  if(url.pathname===base+"status"&&request.method==="GET")
    return reply({ready:true,ownerVerified:true,previewOnly:true});
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
  if(url.pathname===base+"finish"&&request.method==="POST"){
    if(request.headers.get("Origin")!==url.origin)return reply({error:"Origin mismatch"},403);
    let body;try{const raw=await request.text();if(raw.length>30000)throw Error("large");body=JSON.parse(raw)}catch{return reply({error:"Invalid request"},400)}
    if(typeof body?.enrollmentId!=="string"||body.enrollmentId.length>128)return reply({error:"Invalid enrollment"},400);
    try{
      const record=await env.DB.prepare("SELECT * FROM hitl_passkey_enrollments WHERE id=? AND owner_id=?")
        .bind(body.enrollmentId,owner.id).first();
      if(!record||record.state!=="PENDING"||record.expires_at<=Math.floor(Date.now()/1000)||
         record.rp_id!==url.hostname||record.origin!==url.origin)return reply({error:"Enrollment expired or unavailable"},409);
      const client=JSON.parse(utf8.decode(decodeBase64url(body.credential?.response?.clientDataJSON)));
      if(typeof client.challenge!=="string"||await sha(client.challenge)!==record.challenge_sha256)
        return reply({error:"Challenge mismatch"},403);
      const verified=await verifyHitlRegistration({credential:body.credential,expectedChallenge:client.challenge,origin:url.origin,rpId:url.hostname});
      const consumed=env.DB.prepare("UPDATE hitl_passkey_enrollments SET state='CONSUMED',consumed_at=CURRENT_TIMESTAMP WHERE id=? AND owner_id=? AND state='PENDING' AND expires_at>CAST(strftime('%s','now') AS INTEGER)")
        .bind(body.enrollmentId,owner.id);
      const pending=env.DB.prepare("INSERT INTO hitl_authenticators(credential_id,owner_id,public_key_cose,public_key_spki,rp_id,sign_count,state,enrollment_ref) VALUES(?,?,?,?,?,?,'PENDING',?)")
        .bind(verified.credentialId,owner.id,verified.publicKeyCose,verified.publicKeySpki,url.hostname,verified.signCount,body.enrollmentId);
      const results=await env.DB.batch([consumed,pending]);
      if(results.length!==2||results.some(x=>x.success!==true)||results[0].meta?.changes!==1)
        throw Error("atomic_enrollment_unconfirmed");
      return reply({state:"PENDING",credentialId:verified.credentialId});
    }catch{return reply({error:"Registration verification or storage failed"},409)}
  }
  return reply({error:"Not found"},404);
}
