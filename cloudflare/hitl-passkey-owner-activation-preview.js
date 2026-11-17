// Isolated Preview-only self-activation of a registered owner credential.
// Fresh user-verified WebAuthn proof; never authorizes legacy H3/H4/H5 PASS.
import {encodeBase64url,decodeBase64url,verifyWebAuthnAssertion} from './hitl-webauthn-verify.js';
const enc=new TextEncoder();
const digest=async s=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',enc.encode(s))),b=>b.toString(16).padStart(2,'0')).join('');
const reply=(v,status=200)=>Response.json(v,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
export async function activateOwnerPasskey(request,env,url,owner){
 if(!owner||!env.DB||env.HITL_MINIMAX_ACTIVATION_ENABLED!=='true')return reply({error:'Activation disabled'},503);
 if(request.method!=='POST'||request.headers.get('Origin')!==url.origin||url.protocol!=='https:'||url.hostname!==env.HITL_PASSKEY_RP_ID)return reply({error:'Denied'},403);
 if(url.pathname.endsWith('/activate/begin')){
   const credential=await env.DB.prepare("SELECT credential_id,public_key_spki FROM hitl_authenticators WHERE owner_id=? AND state='PENDING' AND rp_id=? ORDER BY id DESC LIMIT 1").bind(owner.id,url.hostname).first();
   if(!credential?.public_key_spki)return reply({error:'No pending credential'},409);
   const challenge=encodeBase64url(crypto.getRandomValues(new Uint8Array(32)));
   const activationId=crypto.randomUUID(),expiresAt=Math.floor(Date.now()/1000)+120;
   try{
     const result=await env.DB.prepare("INSERT INTO hitl_minimax_activation_challenges(id,owner_id,credential_id,challenge_sha256,purpose,rp_id,origin,expires_at) VALUES(?,?,?,?,?,?,?,?)")
       .bind(activationId,owner.id,credential.credential_id,await digest(challenge),'OWNER_ACTIVATE_MINIMAX_V1',url.hostname,url.origin,expiresAt).run();
     if(!result.success)return reply({error:'Storage unavailable'},503);
   }catch{return reply({error:'Storage unavailable'},503)}
   return reply({activationId,purpose:'OWNER_ACTIVATE_MINIMAX_V1',publicKey:{challenge,rpId:url.hostname,allowCredentials:[{type:'public-key',id:credential.credential_id}],userVerification:'required',timeout:120000}});
 }
 if(!url.pathname.endsWith('/activate/finish'))return reply({error:'Not found'},404);
 let body;try{const raw=await request.text();if(raw.length>30000)throw Error();body=JSON.parse(raw)}catch{return reply({error:'Invalid body'},400)}
 if(typeof body?.activationId!=='string'||body.activationId.length>128||body.confirmActivation!==true)return reply({error:'Explicit confirmation required'},400);
 try{
  const challenge=await env.DB.prepare("SELECT * FROM hitl_minimax_activation_challenges WHERE id=? AND owner_id=?").bind(body.activationId,owner.id).first();
  if(!challenge||challenge.purpose!=='OWNER_ACTIVATE_MINIMAX_V1'||challenge.state!=='PENDING'||challenge.expires_at<=Math.floor(Date.now()/1000)||challenge.rp_id!==url.hostname||challenge.origin!==url.origin)return reply({error:'Challenge expired'},409);
  const credential=await env.DB.prepare("SELECT * FROM hitl_authenticators WHERE credential_id=? AND owner_id=? AND state='PENDING'").bind(challenge.credential_id,owner.id).first();
  if(!credential?.public_key_spki)return reply({error:'Pending credential unavailable'},409);
  const client=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(decodeBase64url(body.assertion?.response?.clientDataJSON)));
  if(typeof client.challenge!=='string'||await digest(client.challenge)!==challenge.challenge_sha256)return reply({error:'Challenge mismatch'},403);
  // The shared assertion verifier requires ACTIVE for decision authorization.
  // Here a transient ACTIVE copy verifies possession only; the database remains PENDING until the atomic transition.
  const verified=await verifyWebAuthnAssertion({assertion:body.assertion,expected:{challenge:client.challenge,origin:url.origin,rpId:url.hostname,expiresAtMs:challenge.expires_at*1000},credential:{state:'ACTIVE',credentialId:credential.credential_id,rpId:credential.rp_id,publicKeySpki:credential.public_key_spki,signCount:credential.sign_count}});
  const ops=[
   env.DB.prepare("UPDATE hitl_minimax_activation_challenges SET state='CONSUMED',consumed_at=CURRENT_TIMESTAMP WHERE id=? AND owner_id=? AND state='PENDING' AND expires_at>CAST(strftime('%s','now') AS INTEGER)").bind(challenge.id,owner.id),
   env.DB.prepare("UPDATE hitl_authenticators SET state='ACTIVE',sign_count=? WHERE credential_id=? AND owner_id=? AND state='PENDING' AND sign_count=?").bind(verified.signCount,credential.credential_id,owner.id,credential.sign_count),
   env.DB.prepare("INSERT INTO hitl_passkey_lifecycle_events(id,credential_id,owner_id,action,from_state,to_state,evidence_ref,actor_type) VALUES(?,?,?,'ACTIVATED','PENDING','ACTIVE',?,'VERIFIED_OWNER')").bind(crypto.randomUUID(),credential.credential_id,owner.id,challenge.id)
  ];
  const results=await env.DB.batch(ops);
  if(results.length!==3||results.some(x=>!x.success||x.meta?.changes!==1))throw Error('atomic_activation_unconfirmed');
  return reply({activated:true,credentialState:'ACTIVE',legacyGateAuthorized:false,activationEvidenceRef:challenge.id});
 }catch{return reply({error:'Activation verification or commit failed'},409)}
}
