import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const asUrl=s=>'data:text/javascript;base64,'+Buffer.from(s).toString('base64');
const verifier=asUrl(readFileSync('cloudflare/hitl-webauthn-verify.js','utf8'));
const registration=asUrl(readFileSync('cloudflare/hitl-passkey-registration-verify.js','utf8').replace('./hitl-webauthn-verify.js',verifier));
const login=asUrl(readFileSync('cloudflare/hitl-passkey-authentication-preview.js','utf8').replace('./hitl-webauthn-verify.js',verifier));
const moduleCode=readFileSync('cloudflare/hitl-passkey-enrollment-preview.js','utf8').replace('./hitl-webauthn-verify.js',verifier).replace('./hitl-passkey-registration-verify.js',registration).replace('./hitl-passkey-authentication-preview.js',login);
const {handleHitlPasskeyEnrollment}=await import(asUrl(moduleCode));
const base='https://boxvia-hitl-identity-hold-test.andeks.workers.dev/api/owner/hitl/passkey/';
const env={HITL_PASSKEY_ENROLLMENT_ENABLED:'true',HITL_HUMAN_ATTESTATION_REQUIRED:'true',HITL_PASSKEY_RP_ID:'boxvia-hitl-identity-hold-test.andeks.workers.dev',DB:{}};
const run=async(path,method='GET',environment=env)=>handleHitlPasskeyEnrollment(new Request(base+path,{method,headers:method==='POST'?{Origin:new URL(base).origin}:undefined}),environment,new URL(base+path));
test('without Access JWT status remains unauthorized',async()=>assert.equal((await run('status')).status,401));
test('without Access JWT begin remains unauthorized',async()=>assert.equal((await run('begin','POST')).status,401));
test('without Access JWT finish remains unauthorized',async()=>assert.equal((await run('finish','POST')).status,401));
test('disabled feature is unavailable',async()=>assert.equal((await run('status','GET',{...env,HITL_PASSKEY_ENROLLMENT_ENABLED:'false'})).status,503));
test('wrong RP ID is rejected',async()=>assert.equal((await run('status','GET',{...env,HITL_PASSKEY_RP_ID:'invalid.example'})).status,403));
test('passkey routes and owner page are gated in preview Worker',()=>{
 const worker=readFileSync('cloudflare/hitl-preview-worker.js','utf8');
 assert.match(worker,/handleHitlPasskeyEnrollment\(request,env,statusUrl\)/);
 assert.match(worker,/url\.pathname\.startsWith\("\/api\/owner\/hitl\/passkey\/"\)/);
 assert.match(worker,/url\.pathname !== "\/api\/owner\/hitl"/);
 assert.match(worker,/"Content-Security-Policy"/);
 const page=readFileSync('cloudflare/hitl-passkey-owner-page-preview.js','utf8');
 assert.match(page,/navigator\.credentials\.create/);
});
test('registration finish is cryptographically verified and stays PENDING',()=>{
 assert.match(moduleCode,/verifyHitlRegistration/);
 assert.match(moduleCode,/state:\"PENDING\"/);
 assert.doesNotMatch(moduleCode,/state:\"ACTIVE\"/);
});

test('malformed Access JWT is classified without exposing token',async()=>{
 const configured={...env,HITL_ACCESS_ISSUER:'https://broad-bonus-7bf4.cloudflareaccess.com',HITL_ACCESS_AUD:'test-aud',HITL_OWNER_EMAIL:'owner@example.test'};
 const response=await handleHitlPasskeyEnrollment(new Request(base+'status',{headers:{'Cf-Access-Jwt-Assertion':'bad.bad.bad'}}),configured,new URL(base+'status'));
 assert.equal(response.status,503);
 assert.deepEqual(await response.json(),{error:'Identity unavailable',diagnostic:'JWT_DECODE_OR_PARSE'});
});
test('non-object Access JWT is classified and rejected',async()=>{
 const configured={...env,HITL_ACCESS_ISSUER:'https://broad-bonus-7bf4.cloudflareaccess.com',HITL_ACCESS_AUD:'test-aud',HITL_OWNER_EMAIL:'owner@example.test'};
 const token=[Buffer.from('null').toString('base64url'),Buffer.from('{}').toString('base64url'),'abc'].join('.');
 const response=await handleHitlPasskeyEnrollment(new Request(base+'status',{headers:{'Cf-Access-Jwt-Assertion':token}}),configured,new URL(base+'status'));
 assert.equal(response.status,503);
 assert.equal((await response.json()).diagnostic,'JWT_STRUCTURE');
});
test('validly structured but unsigned Access JWT is not accepted',async()=>{
 const configured={...env,HITL_ACCESS_ISSUER:'https://broad-bonus-7bf4.cloudflareaccess.com',HITL_ACCESS_AUD:'test-aud',HITL_OWNER_EMAIL:'owner@example.test'};
 const token=[Buffer.from(JSON.stringify({alg:'none',kid:'test'})).toString('base64url'),Buffer.from('{}').toString('base64url'),'abc'].join('.');
 const response=await handleHitlPasskeyEnrollment(new Request(base+'status',{headers:{'Cf-Access-Jwt-Assertion':token}}),configured,new URL(base+'status'));
 assert.equal(response.status,401);
});

test('pinned Access JWKS is required, expired keys fail closed',async()=>{
 const configured={...env,HITL_ACCESS_ISSUER:'https://broad-bonus-7bf4.cloudflareaccess.com',HITL_ACCESS_AUD:'test-aud',HITL_OWNER_EMAIL:'owner@example.test'};
 const header={alg:'RS256',kid:'test-kid'};
 const payload={iss:configured.HITL_ACCESS_ISSUER,aud:['test-aud'],exp:Math.floor(Date.now()/1000)+3600,iat:Math.floor(Date.now()/1000),email:'owner@example.test',sub:'test-owner'};
 const token=[header,payload].map(x=>Buffer.from(JSON.stringify(x)).toString('base64url')).concat(['AQ']).join('.');
 const check=async jwks=>{
   const response=await handleHitlPasskeyEnrollment(new Request(base+'status',{headers:{'Cf-Access-Jwt-Assertion':token}}),{...configured,HITL_ACCESS_JWKS_PUBLIC:jwks},new URL(base+'status'));
   return {status:response.status,body:await response.json()};
 };
 const missing=await check(undefined);
 assert.equal(missing.status,503);assert.equal(missing.body.diagnostic,'JWKS_CONFIG');
 const stale=await check(JSON.stringify({keys:[],fetched_at:Math.floor(Date.now()/1000)-172801}));
 assert.equal(stale.status,503);assert.equal(stale.body.diagnostic,'JWKS_STALE_OR_INVALID');
 const unknown=await check(JSON.stringify({keys:[],fetched_at:Math.floor(Date.now()/1000)}));
 assert.equal(unknown.status,401);
});

test('passkey authentication remains gated and cannot activate HITL',async()=>{
 assert.equal((await run('login/begin','POST')).status,401);
 assert.equal((await run('login/finish','POST')).status,401);
 const code=readFileSync('cloudflare/hitl-passkey-authentication-preview.js','utf8');
 assert.match(code,/verifyWebAuthnAssertion/);
 assert.match(code,/hitl_passkey_login_challenges/);
 assert.match(code,/state='PENDING'/);
 assert.match(code,/hitlAuthorization:false/);
 assert.doesNotMatch(code,/SET state='ACTIVE'/);
 const page=readFileSync('cloudflare/hitl-passkey-owner-page-preview.js','utf8');
 assert.match(page,/navigator.credentials.get/);
});

test('activation request is signed, audit-only, and never activates credential',()=>{
 const login=readFileSync('cloudflare/hitl-passkey-authentication-preview.js','utf8');
 const schema=readFileSync('cloudflare/hitl-passkey-lifecycle-preview.sql','utf8');
 const page=readFileSync('cloudflare/hitl-passkey-owner-page-preview.js','utf8');
 assert.match(login,/verifyWebAuthnAssertion/);
 assert.match(login,/body.requestActivation===true/);
 assert.match(login,/ACTIVATION_REQUESTED/);
 assert.match(login,/await env.DB.batch\(operations\)/);
 assert.match(login,/credentialState:"PENDING"/);
 assert.match(login,/hitlAuthorization:false/);
 assert.doesNotMatch(login,/SET state='ACTIVE'/);
 assert.match(schema,/immutable_lifecycle/);
 assert.match(schema,/INDEPENDENT_APPROVER/);
 assert.match(page,/Запросить активацию/);
 assert.match(page,/confirm\(/);
});
