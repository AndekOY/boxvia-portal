import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const sql=readFileSync('cloudflare/hitl-minimax-proof-bundle-preview.sql','utf8');
const handler=readFileSync('cloudflare/hitl-minimax-attestation-preview.js','utf8');
test('proof bundle preserves inputs for independent signature replay',()=>{
 for(const field of ['canonical_decision','challenge','public_key_spki','client_data_json','authenticator_data','signature','rp_id','origin','sign_count_before','sign_count_after'])assert.match(sql,new RegExp('\\b'+field+'\\b'));
 assert.match(handler,/canonicalDecision\(bound.snapshot,record.action\)/);
 assert.match(handler,/hitl_minimax_proof_bundles/);
 assert.match(handler,/changes.length!==4/);
});
test('proof bundle is immutable and included in same transaction',()=>{
 assert.match(sql,/hitl_minimax_bundle_no_update/);
 assert.match(sql,/hitl_minimax_bundle_no_delete/);
 assert.match(handler,/await env.DB.batch\(\[/);
 assert.match(handler,/return json\(\{verified:true,proofId/);
});
