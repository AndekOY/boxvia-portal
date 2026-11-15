// WebAuthn assertion verification primitive, ES256 only.
// No identity enrollment or D1 event insertion is performed here.
// Trusted expected values MUST come from server-side challenge and credential records.
const decoder = new TextDecoder("utf-8", {fatal:true});
const encoder = new TextEncoder();
export function decodeBase64url(s) {
  if (typeof s !== "string" || !/^[A-Za-z0-9_-]+$/.test(s)) throw new Error("invalid_base64url");
  const padded=s.replace(/-/g,"+").replace(/_/g,"/")+"=".repeat((4-s.length%4)%4);
  const binary=atob(padded);
  return Uint8Array.from(binary,c=>c.charCodeAt(0));
}
export function encodeBase64url(bytes) {
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
}
const sha256 = async bytes => new Uint8Array(await crypto.subtle.digest("SHA-256",bytes));
const equal = (a,b) => a.length===b.length && a.reduce((v,x,i)=>v|(x^b[i]),0)===0;
function u32(bytes,offset) { return new DataView(bytes.buffer,bytes.byteOffset+offset,4).getUint32(0,false); }
function derToRaw(der) {
  // WebAuthn signatures are ASN.1 DER ECDSA. WebCrypto ECDSA expects P1363 r||s.
  let i=0;
  if (der[i++]!==0x30) throw new Error("invalid_signature_der");
  const length=der[i++];
  if (length>=128 || length!==der.length-2) throw new Error("invalid_signature_der");
  const numbers=[];
  for (let k=0;k<2;k++) {
    if (der[i++]!==0x02) throw new Error("invalid_signature_der");
    const n=der[i++];
    if (!n || n>33 || i+n>der.length) throw new Error("invalid_signature_der");
    let b=der.slice(i,i+n);i+=n;
    if (b[0]&0x80 || (b.length>1 && b[0]===0 && !(b[1]&0x80))) throw new Error("invalid_signature_der");
    if (b.length===33) { if (b[0]!==0) throw new Error("invalid_signature_der"); b=b.slice(1); }
    if (b.length>32) throw new Error("invalid_signature_der");
    const fixed=new Uint8Array(32);fixed.set(b,32-b.length);numbers.push(fixed);
  }
  if (i!==der.length) throw new Error("invalid_signature_der");
  const raw=new Uint8Array(64);raw.set(numbers[0]);raw.set(numbers[1],32);return raw;
}
export async function verifyWebAuthnAssertion({assertion, expected, credential}) {
  if (!expected || !credential || !assertion || typeof assertion!=="object") throw new Error("missing_inputs");
  if (!Number.isFinite(expected.expiresAtMs) || Date.now()>=expected.expiresAtMs) throw new Error("expired");
  if (credential.state!=="ACTIVE" || credential.rpId!==expected.rpId) throw new Error("inactive_credential");
  if (assertion.id!==credential.credentialId || assertion.type!=="public-key") throw new Error("credential_mismatch");
  const response=assertion.response;
  if (!response || typeof response!=="object") throw new Error("missing_response");
  const clientBytes=decodeBase64url(response.clientDataJSON);
  const client=JSON.parse(decoder.decode(clientBytes));
  if (client.type!=="webauthn.get" || client.origin!==expected.origin || client.crossOrigin===true ||
      client.challenge!==expected.challenge) throw new Error("client_data_mismatch");
  const auth=decodeBase64url(response.authenticatorData);
  if (auth.length<37) throw new Error("short_authenticator_data");
  if (!equal(auth.slice(0,32),await sha256(encoder.encode(expected.rpId)))) throw new Error("rp_id_mismatch");
  const flags=auth[32];
  if ((flags&0x01)===0 || (flags&0x04)===0) throw new Error("user_verification_missing");
  if ((flags&0x40)!==0 || (flags&0x80)!==0) throw new Error("unexpected_extensions_or_attestation");
  const counter=u32(auth,33);
  if (!Number.isSafeInteger(credential.signCount)||credential.signCount<0) throw new Error("invalid_counter");
  if (counter!==0 && credential.signCount!==0 && counter<=credential.signCount) throw new Error("counter_replay");
  const clientHash=await sha256(clientBytes);
  const signed=new Uint8Array(auth.length+clientHash.length);signed.set(auth);signed.set(clientHash,auth.length);
  const key=await crypto.subtle.importKey("spki",decodeBase64url(credential.publicKeySpki),"ECDSA",false,["verify"]);
  const verified=await crypto.subtle.verify({name:"ECDSA",hash:"SHA-256"},key,derToRaw(decodeBase64url(response.signature)),signed);
  if (!verified) throw new Error("invalid_signature");
  return {credentialId:credential.credentialId, signCount:counter, userVerified:true};
}
