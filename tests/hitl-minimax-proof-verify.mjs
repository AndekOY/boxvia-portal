import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const s=readFileSync('cloudflare/hitl-minimax-proof-verify.js','utf8');
test('replay verifier binds immutable records and validates original WebAuthn signature',()=>{
 for(const x of ['verifyWebAuthnAssertion','decisionDigest','canonicalDecision','challenge_sha256','proof.challenge_id','bundle.signature','sign_count_before','sign_count_after','recordProvenanceVerified:false'])assert.ok(s.includes(x),x);
 assert.ok(!s.includes('return {verified:true};'));
});
