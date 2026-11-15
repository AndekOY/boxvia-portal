import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {generateKeyPairSync,sign,createHash,randomBytes} from 'node:crypto';
const asUrl=s=>'data:text/javascript;base64,'+Buffer.from(s).toString('base64');
const verify=asUrl(readFileSync('cloudflare/hitl-webauthn-verify.js','utf8'));
const binding=asUrl(readFileSync('cloudflare/hitl-decision-binding.js','utf8').replace('./hitl-webauthn-verify.js',verify));
const preflight=asUrl(readFileSync('cloudflare/hitl-signed-preflight.js','utf8').replace('./hitl-webauthn-verify.js',verify).replace('./hitl-decision-binding.js',binding));
const {verifyHitlSignedPreflight}=await import(preflight);
const commitUrl=asUrl(readFileSync('cloudflare/hitl-signed-commit-preview.js','utf8').replace('./hitl-signed-preflight.js',preflight).replace('./hitl-webauthn-verify.js',verify));
const {commitHitlSignedPreview}=await import(commitUrl);
const {eventChainHead,decisionDigest}=await import(binding);
const {encodeBase64url}=await import(verify);
const rpId='boxvia-hitl-identity-hold-test.andeks.workers.dev',origin='https://'+rpId;
const {publicKey,privateKey}=generateKeyPairSync('ec',{namedCurve:'prime256v1'});
const challenge=encodeBase64url(randomBytes(32));
const history=[],head=await eventChainHead(history);
const decision={caseId:1,gate:'H3',decision:'PASS',evidenceRef:'synthetic/evidence',reviewDigest:'a'.repeat(64),objectVersion:'v1',chainHead:head};
const sha=s=>createHash('sha256').update(s).digest('hex');
const c={id:'synthetic-challenge-12345',case_id:1,gate:'H3',payload_sha256:await decisionDigest(decision),chain_head_sha256:head,credential_id:'synthetic-key',challenge_sha256:sha(challenge),expires_at:Math.floor(Date.now()/1000)+120,state:'PENDING'};
const credential={credential_id:'synthetic-key',state:'ACTIVE',rp_id:rpId,sign_count:0,public_key_spki:encodeBase64url(publicKey.export({type:'spki',format:'der'}))};
const committed=[];
const db={async batch(stmts){committed.push(stmts);return [{success:true},{success:true}]},prepare(sql){return {bind(){return {
 async first(){if(sql.includes('FROM hitl_auth_challenges'))return c;if(sql.includes('FROM hitl_cases'))return {status:'HOLD',assessor:'TEST_ONLY'};if(sql.includes('MAX(id)'))return {last_id:0};if(sql.includes('FROM hitl_authenticators'))return credential;throw Error('unexpected query');},
 async all(){return {results:history};}
};}}}};
function assertion(ch=challenge,key=privateKey) {
 const client=Buffer.from(JSON.stringify({type:'webauthn.get',challenge:ch,origin,crossOrigin:false}));
 const auth=Buffer.alloc(37);createHash('sha256').update(rpId).digest().copy(auth);auth[32]=5;auth.writeUInt32BE(1,33);
 return {id:'synthetic-key',type:'public-key',response:{clientDataJSON:encodeBase64url(client),authenticatorData:encodeBase64url(auth),signature:encodeBase64url(sign('sha256',Buffer.concat([auth,createHash('sha256').update(client).digest()]),key))}};
}
const params=()=>({db,challengeId:c.id,decision,assertion:assertion(),origin,rpId});
test('valid synthetic ES256 preflight, no database writes',async()=>{const v=await verifyHitlSignedPreflight(params());assert.equal(v.verified,true);assert.equal(v.gate,'H3')});
test('reject changed evidence',async()=>assert.rejects(()=>verifyHitlSignedPreflight({...params(),decision:{...decision,evidenceRef:'changed'}}),/decision_mismatch/));
test('reject wrong challenge',async()=>assert.rejects(()=>verifyHitlSignedPreflight({...params(),assertion:assertion(encodeBase64url(randomBytes(32)))}),/challenge_mismatch/));
test('reject invalid signature',async()=>assert.rejects(()=>verifyHitlSignedPreflight({...params(),assertion:assertion(challenge,generateKeyPairSync('ec',{namedCurve:'prime256v1'}).privateKey)}),/invalid_signature/));
test('reject stale event chain',async()=>{const old=c.chain_head_sha256;c.chain_head_sha256='b'.repeat(64);try{await assert.rejects(()=>verifyHitlSignedPreflight(params()),/stale_chain_head/)}finally{c.chain_head_sha256=old}});
test('reject expired challenge',async()=>{const old=c.expires_at;c.expires_at=1;try{await assert.rejects(()=>verifyHitlSignedPreflight(params()),/challenge_unavailable/)}finally{c.expires_at=old}});
test('reject missing SPKI enrollment',async()=>{const old=credential.public_key_spki;credential.public_key_spki=null;try{await assert.rejects(()=>verifyHitlSignedPreflight(params()),/credential_unavailable/)}finally{credential.public_key_spki=old}});

test('signed coordinator batches intent and event only after verified signature',async()=>{
 const result=await commitHitlSignedPreview(params());
 assert.equal(result.committed,true);assert.equal(committed.length,1);assert.equal(committed[0].length,2);
});
test('invalid signature never reaches atomic batch',async()=>{
 const before=committed.length;
 await assert.rejects(()=>commitHitlSignedPreview({...params(),assertion:assertion(challenge,generateKeyPairSync('ec',{namedCurve:'prime256v1'}).privateKey)}));
 assert.equal(committed.length,before);
});
