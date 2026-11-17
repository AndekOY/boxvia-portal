import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync('cloudflare/hitl-passkey-owner-activation-preview.js','utf8');
test('owner activation finish validates activationId rather than unrelated loginId',()=>{
 assert.match(source,/typeof body\?\.activationId!=='string'\|\|body\.activationId\.length>128/);
 assert.doesNotMatch(source,/typeof body\?\.loginId/);
 assert.match(source,/body\.confirmActivation!==true/);
 assert.match(source,/challenge\.purpose!=='OWNER_ACTIVATE_MINIMAX_V1'/);
 assert.match(source,/state='PENDING' AND sign_count=\?/);
});
