// Preview-only proof of possession of a PENDING passkey. Never activates a key or authorizes HITL.
import {encodeBase64url,decodeBase64url,verifyWebAuthnAssertion} from "./hitl-webauthn-verify.js";
const enc=new TextEncoder();
const hash=async s=>Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",enc.encode(s))),x=>x.toString(16).padStart(2,"0")).join("");
const reply=(data,status=200)=>Response.json(data,{status,headers:{"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}});
export async function handleHitlPasskeyLogin(request,env,url,owner) {
  if(!owner||!env.DB||env.HITL_HUMAN_ATTESTATION_REQUIRED!=="true")return reply({error:"Login unavailable"},503);
  if(url.protocol!=="https:"||url.hostname!==env.HITL_PASSKEY_RP_ID)return reply({error:"RP mismatch"},403);
  if(request.method!=="POST"||request.headers.get("Origin")!==url.origin)return reply({error:"Origin or method denied"},403);
  if(url.pathname==="/api/owner/hitl/passkey/login/begin"){
    const credential=await env.DB.prepare("SELECT credential_id,public_key_spki,rp_id,sign_count,state FROM hitl_authenticators WHERE owner_id=? AND state='PENDING' AND rp_id=? ORDER BY id DESC LIMIT 1").bind(owner.id,url.hostname).first();
    if(!credential||!credential.public_key_spki)return reply({error:"No pending credential"},404);
    const challenge=encodeBase64url(crypto.getRandomValues(new Uint8Array(32)));
    const id=crypto.randomUUID();
    const expiresAt=Math.floor(Date.now()/1000)+120;
    try {
      const saved=await env.DB.prepare("INSERT INTO hitl_passkey_login_challenges(id,owner_id,credential_id,challenge_sha256,rp_id,origin,expires_at) VALUES(?,?,?,?,?,?,?)")
        .bind(id,owner.id,credential.credential_id,await hash(challenge),url.hostname,url.origin,expiresAt).run();
      if(!saved.success)return reply({error:"Challenge unavailable"},503);
    }catch{return reply({error:"Challenge unavailable"},503)}
    return reply({loginId:id,publicKey:{challenge,rpId:url.hostname,allowCredentials:[{type:"public-key",id:credential.credential_id}],userVerification:"required",timeout:120000}});
  }
  if(url.pathname==="/api/owner/hitl/passkey/login/finish"){
    let body;
    try{const raw=await request.text();if(raw.length>30000)throw Error();body=JSON.parse(raw)}catch{return reply({error:"Invalid request"},400)}
    if(typeof body?.loginId!=="string"||body.loginId.length>128||
       (body.requestActivation!==undefined&&body.requestActivation!==true))return reply({error:"Invalid login"},400);
    try{
      const record=await env.DB.prepare("SELECT * FROM hitl_passkey_login_challenges WHERE id=? AND owner_id=?").bind(body.loginId,owner.id).first();
      if(!record||record.state!=="PENDING"||record.expires_at<=Math.floor(Date.now()/1000)||record.rp_id!==url.hostname||record.origin!==url.origin)return reply({error:"Challenge expired or consumed"},409);
      const credential=await env.DB.prepare("SELECT * FROM hitl_authenticators WHERE credential_id=? AND owner_id=? AND state='PENDING'").bind(record.credential_id,owner.id).first();
      if(!credential||!credential.public_key_spki)return reply({error:"Credential unavailable"},409);
      const client=JSON.parse(new TextDecoder("utf-8",{fatal:true}).decode(decodeBase64url(body.assertion?.response?.clientDataJSON)));
      if(typeof client.challenge!=="string"||await hash(client.challenge)!==record.challenge_sha256)return reply({error:"Challenge mismatch"},403);
      // The verifier's ACTIVE check is a decision-authorization safeguard.
      // This isolated proof-of-possession check uses a transient copy only; D1 remains PENDING.
      const verified=await verifyWebAuthnAssertion({
        assertion:body.assertion,
        expected:{challenge:client.challenge,origin:url.origin,rpId:url.hostname,expiresAtMs:record.expires_at*1000},
        credential:{state:"ACTIVE",credentialId:credential.credential_id,rpId:credential.rp_id,publicKeySpki:credential.public_key_spki,signCount:credential.sign_count}
      });
      const consumed=env.DB.prepare("UPDATE hitl_passkey_login_challenges SET state='CONSUMED',consumed_at=CURRENT_TIMESTAMP WHERE id=? AND owner_id=? AND state='PENDING' AND expires_at>CAST(strftime('%s','now') AS INTEGER)").bind(body.loginId,owner.id);
      const counter=env.DB.prepare("UPDATE hitl_authenticators SET sign_count=? WHERE credential_id=? AND owner_id=? AND state='PENDING' AND sign_count=?")
        .bind(verified.signCount,credential.credential_id,owner.id,credential.sign_count);
      const results=await env.DB.batch([consumed,counter]);
      if(results.length!==2||results.some(x=>!x.success)||results.some(x=>x.meta?.changes!==1))throw Error("unconfirmed");
      return reply({verified:true,credentialState:"PENDING",hitlAuthorization:false});
    }catch{return reply({error:"Verification failed or challenge consumed"},409)}
  }
  return reply({error:"Not found"},404);
}
