import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const asUrl=s=>'data:text/javascript;base64,'+Buffer.from(s).toString('base64');
const verifier=asUrl(readFileSync('cloudflare/hitl-webauthn-verify.js','utf8'));
const moduleCode=readFileSync('cloudflare/hitl-passkey-enrollment-preview.js','utf8').replace('./hitl-webauthn-verify.js',verifier);
const {handleHitlPasskeyEnrollment}=await import(asUrl(moduleCode));
const base='https://boxvia-hitl-identity-hold-test.andeks.workers.dev/api/owner/hitl/passkey/';
const env={HITL_PASSKEY_ENROLLMENT_ENABLED:'true',HITL_HUMAN_ATTESTATION_REQUIRED:'true',HITL_PASSKEY_RP_ID:'boxvia-hitl-identity-hold-test.andeks.workers.dev',DB:{}};
const run=async(path,method='GET',environment=env)=>handleHitlPasskeyEnrollment(new Request(base+path,{method,headers:method==='POST'?{Origin:new URL(base).origin}:undefined}),environment,new URL(base+path));
test('without Access JWT status remains unauthorized',async()=>assert.equal((await run('status')).status,401));
test('without Access JWT begin remains unauthorized',async()=>assert.equal((await run('begin','POST')).status,401));
test('without Access JWT finish remains unauthorized',async()=>assert.equal((await run('finish','POST')).status,401));
test('disabled feature is unavailable',async()=>assert.equal((await run('status','GET',{...env,HITL_PASSKEY_ENROLLMENT_ENABLED:'false'})).status,503));
test('wrong RP ID is rejected',async()=>assert.equal((await run('status','GET',{...env,HITL_PASSKEY_RP_ID:'invalid.example'})).status,403));
test('registration remains unrouted in existing preview Worker',()=>{
 const worker=readFileSync('cloudflare/hitl-preview-worker.js','utf8');
 assert.match(worker,/url\.pathname !== "\/api\/owner\/hitl"/);
});
test('finish remains fail-closed and status not ready',()=>{
 assert.match(moduleCode,/Attestation verifier not yet enabled/);
 assert.match(moduleCode,/ready:false/);
});
