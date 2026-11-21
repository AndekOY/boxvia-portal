// Verify Cloudflare Access JWT inside Worker. Never trust an unverified identity header.
// Config: BCDE_ACCESS_TEAM_DOMAIN (e.g. example.cloudflareaccess.com),
// BCDE_ACCESS_AUD (Access application AUD tag), BCDE_OWNER_EMAIL (exact identity).
const enc=new TextEncoder();
function b64url(part){if(!/^[A-Za-z0-9_-]+$/.test(part))throw Error("Malformed JWT");const s=part.replace(/-/g,"+").replace(/_/g,"/");const raw=atob(s+"=".repeat((4-s.length%4)%4));return Uint8Array.from(raw,c=>c.charCodeAt(0));}
function parse(part){return JSON.parse(new TextDecoder().decode(b64url(part)));}
export async function verifyBcdeAccess(request,env,{fetchKeys=fetch,now=Math.floor(Date.now()/1000),onFailure=()=>{}}={}){
 const fail=reason=>{onFailure(reason);return false;};
 let stage="initial";
 try{
  const domain=env?.BCDE_ACCESS_TEAM_DOMAIN,aud=env?.BCDE_ACCESS_AUD,email=env?.BCDE_OWNER_EMAIL;
  if(typeof domain!=="string"||!/^[a-z0-9-]+\.cloudflareaccess\.com$/.test(domain)||
     typeof aud!=="string"||!aud.trim()||typeof email!=="string"||!email.includes("@"))return fail("config");
  const token=request.headers.get("Cf-Access-Jwt-Assertion");
  if(!token||token.length>16000)return fail("assertion_missing");
  const parts=token.split(".");if(parts.length!==3)return fail("jwt_format");
  stage="jwt_decode";
  const header=parse(parts[0]),payload=parse(parts[1]);
  if(header.alg!=="RS256"||(header.typ!==undefined&&header.typ!=="JWT")||typeof header.kid!=="string")return fail("jwt_header");
  if(payload.iss!==`https://${domain}`||!Array.isArray(payload.aud)||!payload.aud.includes(aud)||
     typeof payload.exp!=="number"||payload.exp<=now||typeof payload.iat!=="number"||payload.iat>now+60||
     (typeof payload.nbf==="number"&&payload.nbf>now)||
     typeof payload.email!=="string"||payload.email.toLowerCase()!==email.toLowerCase())return fail("jwt_claims");
  const url=`https://${domain}/cdn-cgi/access/certs`;
  stage="certs_fetch";
  const response=await fetchKeys(url,{redirect:"error",headers:{"Accept":"application/json"}});
  if(!response.ok)return fail("certs_http");
  stage="certs_parse";
  const keys=await response.json();
  const jwk=keys.keys?.find(k=>k.kid===header.kid&&k.kty==="RSA"&&(k.use===undefined||k.use==="sig")&&(k.alg===undefined||k.alg==="RS256"));
  if(!jwk)return fail("certs_key");
  stage="key_import";
  const key=await crypto.subtle.importKey("jwk",jwk,{name:"RSASSA-PKCS1-v1_5",hash:"SHA-256"},false,["verify"]);
  stage="signature_verify";
  return await crypto.subtle.verify("RSASSA-PKCS1-v1_5",key,b64url(parts[2]),enc.encode(parts[0]+"."+parts[1])) || fail("signature");
 }catch(error){
  if(stage==="certs_fetch"){
   const kind=error instanceof TypeError?"type_error":error?.name==="AbortError"?"abort":error?.name==="NetworkError"?"network_error":"other";
   return fail("exception_certs_fetch_"+kind);
  }
  return fail("exception_"+stage);
 }
}
