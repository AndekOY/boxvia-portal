// Strict WebAuthn registration verification for Preview, ES256 + fmt=none only.
// No identity activation; credential remains PENDING.
import {decodeBase64url,encodeBase64url} from "./hitl-webauthn-verify.js";
const enc=new TextEncoder(),decoder=new TextDecoder("utf-8",{fatal:true});
function cbor(bytes,offset=0){
 let i=offset;
 const read=n=>{if(n<0||i+n>bytes.length)throw Error("cbor_bounds");const v=bytes.slice(i,i+n);i+=n;return v};
 const length=ai=>{if(ai<24)return ai;if(ai===24)return read(1)[0];if(ai===25){const v=read(2);return v[0]*256+v[1]}if(ai===26){const v=read(4);return ((v[0]*2**24)+(v[1]<<16)+(v[2]<<8)+v[3])}throw Error("cbor_length")};
 function parse(depth=0){if(depth>8)throw Error("cbor_depth");const b=read(1)[0],major=b>>5,ai=b&31;if(ai===31)throw Error("cbor_indefinite");
 if(major===7){if(ai===20)return false;if(ai===21)return true;if(ai===22)return null;throw Error("cbor_simple")}
 const n=length(ai);if(n>65536)throw Error("cbor_size");
 if(major===0)return n;if(major===1)return -1-n;if(major===2)return read(n);if(major===3)return decoder.decode(read(n));
 if(major===4)return Array.from({length:n},()=>parse(depth+1));
 if(major===5){const m=new Map();for(let k=0;k<n;k++){const key=parse(depth+1);if(typeof key!=="string"&&typeof key!=="number")throw Error("cbor_key");if(m.has(key))throw Error("cbor_duplicate");m.set(key,parse(depth+1))}return m}
 throw Error("cbor_type")}
 return {value:parse(),end:i};
}
const equal=(a,b)=>a.length===b.length&&a.every((v,i)=>v===b[i]);
const sha=async bytes=>new Uint8Array(await crypto.subtle.digest("SHA-256",bytes));
const u16=(b,i)=>b[i]*256+b[i+1];
export async function verifyHitlRegistration({credential,expectedChallenge,origin,rpId}){
 if(!credential||credential.type!=="public-key"||typeof credential.id!=="string"||!credential.response)throw Error("invalid_credential");
 const rawId=decodeBase64url(credential.rawId);
 if(rawId.length<16||rawId.length>1024||!equal(rawId,decodeBase64url(credential.id)))throw Error("credential_id_mismatch");
 const clientBytes=decodeBase64url(credential.response.clientDataJSON);
 if(clientBytes.length>4096)throw Error("client_too_large");
 const client=JSON.parse(decoder.decode(clientBytes));
 if(client.type!=="webauthn.create"||client.challenge!==expectedChallenge||client.origin!==origin||client.crossOrigin===true)throw Error("client_mismatch");
 const bytes=decodeBase64url(credential.response.attestationObject);
 if(bytes.length>16384)throw Error("attestation_too_large");
 const decoded=cbor(bytes);if(decoded.end!==bytes.length||!(decoded.value instanceof Map))throw Error("attestation_format");
 const obj=decoded.value;if(obj.size!==3||obj.get("fmt")!=="none"||!(obj.get("attStmt") instanceof Map)||obj.get("attStmt").size!==0)throw Error("attestation_not_none");
 const auth=obj.get("authData");if(!(auth instanceof Uint8Array)||auth.length<55)throw Error("auth_data");
 if(!equal(auth.slice(0,32),await sha(enc.encode(rpId))))throw Error("rp_mismatch");
 const flags=auth[32];if((flags&0x45)!==0x45||(flags&0x80)!==0)throw Error("uv_or_attested_data_missing");
 const counter=(auth[33]*2**24)+(auth[34]<<16)+(auth[35]<<8)+auth[36];
 let i=37;
 const aaguid=auth.slice(i,i+16);i+=16;
 const len=u16(auth,i);i+=2;
 if(len<16||len>1024||i+len>auth.length)throw Error("credential_length");
 const credentialBytes=auth.slice(i,i+len);i+=len;
 if(!equal(credentialBytes,rawId))throw Error("attested_credential_mismatch");
 const parsed=cbor(auth,i);i=parsed.end;
 if(i!==auth.length)throw Error("extensions_or_trailing_data");
 const key=parsed.value;
 if(!(key instanceof Map)||key.size!==5||key.get(1)!==2||key.get(3)!==-7||key.get(-1)!==1||
 !(key.get(-2) instanceof Uint8Array)||!(key.get(-3) instanceof Uint8Array)||
 key.get(-2).length!==32||key.get(-3).length!==32)throw Error("unsupported_cose_key");
 const jwk={kty:"EC",crv:"P-256",x:encodeBase64url(key.get(-2)),y:encodeBase64url(key.get(-3)),ext:true};
 const imported=await crypto.subtle.importKey("jwk",jwk,{name:"ECDSA",namedCurve:"P-256"},true,["verify"]);
 const spki=encodeBase64url(new Uint8Array(await crypto.subtle.exportKey("spki",imported)));
 return {credentialId:credential.id,publicKeyCose:encodeBase64url(auth.slice(parsed.end-(parsed.end-(i-(parsed.end-i))),i)),publicKeySpki:spki,signCount:counter,userVerified:true};
}
