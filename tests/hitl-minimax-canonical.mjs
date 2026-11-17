import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const code=readFileSync('cloudflare/hitl-minimax-canonical.js','utf8');
const {canonicalDecision,decisionDigest}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
const s={caseId:'case-1',decisionId:'decision-1',version:1,gate:'H3',payloadSha256:'a'.repeat(64),chainHeadSha256:'b'.repeat(64)};
test('canonical binding is deterministic and rejects injected fields',async()=>{
 const d=await decisionDigest(s,'APPROVE');
 assert.match(d,/^[a-f0-9]{64}$/);
 assert.equal(d,await decisionDigest({...s,irrelevant:'ignored'},'APPROVE'));
 assert.equal(canonicalDecision(s,'APPROVE'),canonicalDecision({...s},'APPROVE'));
});
test('different action, version, payload, chain or gate gives a different digest',async()=>{
 const base=await decisionDigest(s,'APPROVE');
 for(const [changed,action] of [[s,'REJECT'],[{...s,version:2},'APPROVE'],[{...s,payloadSha256:'c'.repeat(64)},'APPROVE'],[{...s,chainHeadSha256:'c'.repeat(64)},'APPROVE'],[{...s,gate:'H4'},'APPROVE']])
 assert.notEqual(await decisionDigest(changed,action),base);
});
test('rejects malformed or ambiguous snapshots',async()=>{
 for(const v of [{...s,version:0},{...s,caseId:'bad/id'},{...s,payloadSha256:'x'}, {...s,gate:'H6'}, {...s,version:'1'}])
 await assert.rejects(decisionDigest(v,'APPROVE'),/invalid_decision_snapshot/);
 await assert.rejects(decisionDigest(s,'PASS'),/invalid_decision_snapshot/);
});
