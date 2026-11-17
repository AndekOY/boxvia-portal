// Isolated Preview-only self-activation of a registered owner credential.
// Fresh user-verified WebAuthn proof; never authorizes legacy H3/H4/H5 PASS.
import {decodeBase64url,verifyWebAuthnAssertion} from './hitl-webauthn-verify.js';
const enc=new TextEncoder();
const digest=async s=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',enc.encode(s))),b=>b.toString(16).padStart(2,'0')).join('');
const reply=(v,status=200)=>Response.json(v,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
export async function activateOwnerPasskey(request,env,url,owner){
 if(!owner||!env.DB||env.HITL_MINIMAX_ACTIVATION_ENABLED!=='true')return reply({error:'Activation disabled'},503);
 if(request.method!=='POST'||request.headers.get('Origin')!==url.origin||url.protocol!=='https:'||url.hostname!==env.HITL_PASSKEY_RP_ID)return reply({error:'Denied'},403);
 let body;try{const raw=await request.text();if(raw.length>30000)throw Error();body=JSON.parse(raw)}catch{return reply({error:'Invalid body'},400)}
 if(typeof body?.loginId!=='string'||body.loginId.length>128||body.confirmActivation!==true)return reply({error:'Explicit confirmation required'},400);
 try{
  const challenge=await env.DB.prepare("SELECT * FROM hitl_passkey_login_challenges WHERE id=? AND owner_id=?").bind(body.loginId,owner.id).first();
  if(!challenge||challenge.state!=='PENDING'||challenge.expires_at<=Math.floor(Date.now()/1000)||challenge.rp_id!==url.hostname||challenge.origin!==url.origin)return reply({error:'Challenge expired'},409);
  const credential=await env.DB.prepare("SELECT * FROM hitl_authenticators WHERE credential_id=? AND owner_id=? AND state='PENDING'").bind(challenge.credential_id,owner.id).first();
  if(!credential?.public_key_spki)return reply({error:'Pending credential unavailable'},409);
  const client=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(decodeBase64url(body.assertion?.response?.clientDataJSON)));
  if(typeof client.challenge!=='string'||await digest(client.challenge)!==challenge.challenge_sha256)return reply({error:'Challenge mismatch'},403);
  // The shared assertion verifier requires ACTIVE for decision authorization.
  // Here a transient ACTIVE copy verifies possession only; the database remains PENDING until the atomic transition.
  const verified=await verifyWebAuthnAssertion({assertion:body.assertion,expected:{challenge:client.challenge,origin:url.origin,rpId:url.hostname,expiresAtMs:challenge.expires_at*1000},credential:{state:'ACTIVE',credentialId:credential.credential_id,rpId:credential.rp_id,publicKeySpki:credential.public_key_spki,signCount:credential.sign_count}});
  const ops=[
   env.DB.prepare("UPDATE hitl_passkey_login_challenges SET state='CONSUMED',consumed_at=CURRENT_TIMESTAMP WHERE id=? AND owner_id=? AND state='PENDING' AND expires_at>CAST(strftime('%s','now') AS INTEGER)").bind(challenge.id,owner.id),
   env.DB.prepare("UPDATE hitl_authenticators SET state='ACTIVE',activated_at=CURRENT_TIMESTAMP,sign_count=? WHERE credential_id=? AND owner_id=? AND state='PENDING' AND sign_count=?").bind(verified.signCount,credential.credential_id,owner.id,credential.sign_count),
   env.DB.prepare("INSERT INTO hitl_passkey_lifecycle_events(id,credential_id,owner_id,action,from_state,to_state,evidence_ref,actor_type) VALUES(?,?,?,'ACTIVATED','PENDING','ACTIVE',?,'VERIFIED_OWNER')").bind(crypto.randomUUID(),credential.credential_id,owner.id,challenge.id)
  ];
  const results=await env.DB.batch(ops);
  if(results.length!==3||results.some(x=>!x.success||x.meta?.changes!==1))throw Error('atomic_activation_unconfirmed');
  return reply({activated:true,credentialState:'ACTIVE',legacyGateAuthorized:false,activationEvidenceRef:challenge.id});
 }catch{return reply({error:'Activation verification or commit failed'},409)}
}
