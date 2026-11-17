// Preview-only owner attestation. The caller MUST already have a verified owner Access JWT.
// This module never writes legacy H3/H4/H5 PASS or production data.
import {encodeBase64url,decodeBase64url,verifyWebAuthnAssertion} from './hitl-webauthn-verify.js';
import {prepareBoundDecision} from './hitl-minimax-binding.js';
import {canonicalDecision} from './hitl-minimax-canonical.js';
const enc=new TextEncoder();
const digest=async s=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',enc.encode(s))),b=>b.toString(16).padStart(2,'0')).join('');
const json=(v,status=200)=>Response.json(v,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
export async function handleMinimaxAttestation(request,env,url,owner) {
  if(!owner||!env.DB||env.HITL_MINIMAX_ENABLED!=='true')return json({error:'Unavailable'},503);
  if(request.method!=='POST'||request.headers.get('Origin')!==url.origin||url.protocol!=='https:'||url.hostname!==env.HITL_PASSKEY_RP_ID)return json({error:'Denied'},403);
  let body;
  try{const raw=await request.text();if(raw.length>30000)throw Error();body=JSON.parse(raw);if(!body||typeof body!=='object'||Array.isArray(body))throw Error()}catch{return json({error:'Invalid request'},400)}
  if(url.pathname.endsWith('/attest/status')){
    try {
      const credential=await env.DB.prepare("SELECT credential_id FROM hitl_authenticators WHERE owner_id=? AND state='ACTIVE' AND rp_id=? LIMIT 1").bind(owner.id,url.hostname).first();
      return json({ready:!!credential,credentialState:credential?'ACTIVE':'NO_ACTIVE_CREDENTIAL',previewOnly:true});
    } catch {return json({error:'Status unavailable'},503)}
  }
  if(url.pathname.endsWith('/attest/begin')){
    let bound;
    try{bound=await prepareBoundDecision(env.DB,body)}catch{return json({error:'Snapshot not ready'},409)}
    const credential=await env.DB.prepare("SELECT credential_id,public_key_spki,rp_id,sign_count,state FROM hitl_authenticators WHERE owner_id=? AND state='ACTIVE' AND rp_id=? ORDER BY id DESC LIMIT 1").bind(owner.id,url.hostname).first();
    if(!credential?.public_key_spki)return json({error:'No active owner credential'},409);
    const challenge=encodeBase64url(crypto.getRandomValues(new Uint8Array(32))),attestationId=crypto.randomUUID();
    const expiresAt=Math.floor(Date.now()/1000)+120;
    try{
      const result=await env.DB.prepare("INSERT INTO hitl_minimax_challenges(id,owner_id,credential_id,case_id,decision_id,decision_version,action,snapshot_sha256,challenge_sha256,rp_id,origin,expires_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)")
        .bind(attestationId,owner.id,credential.credential_id,bound.snapshot.caseId,bound.snapshot.decisionId,bound.snapshot.version,bound.action,bound.snapshotSha256,await digest(challenge),url.hostname,url.origin,expiresAt).run();
      if(!result.success)return json({error:'Storage unavailable'},503);
    }catch{return json({error:'Storage unavailable'},503)}
    return json({attestationId,snapshot:bound.snapshot,action:bound.action,snapshotSha256:bound.snapshotSha256,
      publicKey:{challenge,rpId:url.hostname,allowCredentials:[{type:'public-key',id:credential.credential_id}],userVerification:'required',timeout:120000}});
  }
  if(url.pathname.endsWith('/attest/finish')){
    if(typeof body.attestationId!=='string'||body.attestationId.length>128)return json({error:'Invalid attestation'},400);
    try{
      const record=await env.DB.prepare("SELECT * FROM hitl_minimax_challenges WHERE id=? AND owner_id=?").bind(body.attestationId,owner.id).first();
      if(!record||record.state!=='PENDING'||record.expires_at<=Math.floor(Date.now()/1000)||record.rp_id!==url.hostname||record.origin!==url.origin)return json({error:'Expired or consumed'},409);
      const snapshotRow=await env.DB.prepare("SELECT gate FROM hitl_minimax_snapshots WHERE case_id=? AND decision_id=? AND version=? AND state='READY'").bind(record.case_id,record.decision_id,record.decision_version).first();
      if(!snapshotRow)return json({error:'Snapshot unavailable'},409);
      const bound=await prepareBoundDecision(env.DB,{caseId:record.case_id,decisionId:record.decision_id,version:record.decision_version,gate:snapshotRow.gate,action:record.action});
      if(bound.snapshotSha256!==record.snapshot_sha256)return json({error:'Snapshot changed'},409);
      const credential=await env.DB.prepare("SELECT * FROM hitl_authenticators WHERE credential_id=? AND owner_id=? AND state='ACTIVE'").bind(record.credential_id,owner.id).first();
      if(!credential?.public_key_spki)return json({error:'Credential unavailable'},409);
      const client=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(decodeBase64url(body.assertion?.response?.clientDataJSON)));
      if(typeof client.challenge!=='string'||await digest(client.challenge)!==record.challenge_sha256)return json({error:'Challenge mismatch'},403);
      const verified=await verifyWebAuthnAssertion({assertion:body.assertion,expected:{challenge:client.challenge,origin:url.origin,rpId:url.hostname,expiresAtMs:record.expires_at*1000},
        credential:{state:credential.state,credentialId:credential.credential_id,rpId:credential.rp_id,publicKeySpki:credential.public_key_spki,signCount:credential.sign_count}});
      const assertionHash=await digest(JSON.stringify(body.assertion));
      const proofId=crypto.randomUUID();
      const changes=await env.DB.batch([
        env.DB.prepare("UPDATE hitl_minimax_challenges SET state='CONSUMED',consumed_at=CURRENT_TIMESTAMP WHERE id=? AND owner_id=? AND state='PENDING' AND expires_at>CAST(strftime('%s','now') AS INTEGER)").bind(record.id,owner.id),
        env.DB.prepare("UPDATE hitl_authenticators SET sign_count=? WHERE credential_id=? AND owner_id=? AND state='ACTIVE' AND sign_count=?").bind(verified.signCount,credential.credential_id,owner.id,credential.sign_count),
        env.DB.prepare("INSERT INTO hitl_minimax_proofs(id,challenge_id,owner_id,credential_id,case_id,decision_id,decision_version,action,snapshot_sha256,assertion_sha256,user_verified) VALUES(?,?,?,?,?,?,?,?,?,?,1)")
          .bind(proofId,record.id,owner.id,credential.credential_id,record.case_id,record.decision_id,record.decision_version,record.action,record.snapshot_sha256,assertionHash),
        env.DB.prepare("INSERT INTO hitl_minimax_proof_bundles(proof_id,canonical_decision,challenge,public_key_spki,client_data_json,authenticator_data,signature,rp_id,origin,sign_count_before,sign_count_after) VALUES(?,?,?,?,?,?,?,?,?,?,?)")
          .bind(proofId,canonicalDecision(bound.snapshot,record.action),client.challenge,credential.public_key_spki,body.assertion.response.clientDataJSON,body.assertion.response.authenticatorData,body.assertion.response.signature,record.rp_id,record.origin,credential.sign_count,verified.signCount)
      ]);
      if(changes.length!==4||changes.some(x=>!x.success||x.meta?.changes!==1))throw Error('not_committed');
      return json({verified:true,proofId,action:record.action,decisionId:record.decision_id,version:record.decision_version,snapshotSha256:record.snapshot_sha256,legacyGateAuthorized:false});
    }catch{return json({error:'Verification or atomic commit failed'},409)}
  }
  return json({error:'Not found'},404);
}
