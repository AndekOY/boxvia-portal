import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {webcrypto} from 'node:crypto';
const url=(code)=>'data:text/javascript;base64,'+Buffer.from(code).toString('base64');
const verifier=url(readFileSync('cloudflare/hitl-webauthn-verify.js','utf8'));
const binding=url(readFileSync('cloudflare/hitl-decision-binding.js','utf8').replace('./hitl-webauthn-verify.js',verifier));
const moduleCode=readFileSync('cloudflare/hitl-challenge-prepare.js','utf8')
 .replace('./hitl-decision-binding.js',binding).replace('./hitl-webauthn-verify.js',verifier);
const {prepareHitlChallenge}=await import(url(moduleCode));
const {eventChainHead}=await import(binding);
const history=[];
const statements=[];
const db={prepare(sql){return {bind(...args){return {
 async first(){if(sql.includes('FROM hitl_cases'))return {id:9,status:'HOLD'};if(sql.includes('FROM hitl_authenticators'))return {credential_id:args[0],state:'ACTIVE'};throw Error('unexpected first');},
 async all(){return {results:history};},
 async run(){statements.push({sql,args});return {success:true};}
};}}}};
const decision={caseId:9,gate:'H3',decision:'PASS',evidenceRef:'synthetic/review',reviewDigest:'a'.repeat(64),objectVersion:'v1',chainHead:await eventChainHead(history)};
test('server-derived challenge persisted without approval event',async()=>{
 const result=await prepareHitlChallenge({db,caseId:9,gate:'H3',decision,credentialId:'synthetic-key'});
 assert.ok(result.challenge.length>=40);
 assert.equal(statements.length,1);
 assert.match(statements[0].sql,/INSERT INTO hitl_auth_challenges/);
 assert.equal(statements[0].args[1],9);
 assert.equal(statements[0].args[2],'H3');
});
test('reject client-provided history',async()=>assert.rejects(()=>prepareHitlChallenge({db,caseId:9,gate:'H3',decision,credentialId:'synthetic-key',history:[]}),/history_must_be_server_derived/));
test('reject decision for another case',async()=>assert.rejects(()=>prepareHitlChallenge({db,caseId:9,gate:'H3',decision:{...decision,caseId:10},credentialId:'synthetic-key'}),/invalid_request/));
test('reject stale chain head',async()=>assert.rejects(()=>prepareHitlChallenge({db,caseId:9,gate:'H3',decision:{...decision,chainHead:'b'.repeat(64)},credentialId:'synthetic-key'}),/stale_chain_head/));
test('reject nonhuman gate',async()=>assert.rejects(()=>prepareHitlChallenge({db,caseId:9,gate:'H2',decision:{...decision,gate:'H2'},credentialId:'synthetic-key'}),/invalid_request/));
