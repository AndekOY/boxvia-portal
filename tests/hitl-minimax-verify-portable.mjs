// Offline replay from an exported private evidence package; no D1 or network required.
// Usage: node tests/hitl-minimax-verify-portable.mjs <private-package.json> <expected-sha256>
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {mkdtempSync,copyFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const [path,expected]=process.argv.slice(2);
if(!path||!(/^[a-f0-9]{64}$/.test(expected||'')))throw Error('package_and_expected_sha256_required');
const raw=fs.readFileSync(path);
const digest=createHash('sha256').update(raw).digest('hex');
if(digest!==expected)throw Error('package_digest_mismatch');
const data=JSON.parse(raw.toString('utf8'));
if(data.format!=='BOXVIA-HITL-MINIMAX-EVIDENCE-v1'||!data.proof||!data.bundle||!data.challengeRecord||!data.snapshotRow)throw Error('invalid_package_format');
if(JSON.stringify(data)!==raw.toString('utf8'))throw Error('noncanonical_json_bytes');
const dir=mkdtempSync(join(tmpdir(),'hitl-offline-'));
try {
 for(const name of ['hitl-minimax-proof-verify','hitl-minimax-canonical','hitl-webauthn-verify'])copyFileSync('cloudflare/'+name+'.js',join(dir,name+'.mjs'));
 const verifier=fs.readFileSync(join(dir,'hitl-minimax-proof-verify.mjs'),'utf8').replace('./hitl-webauthn-verify.js','./hitl-webauthn-verify.mjs').replace('./hitl-minimax-canonical.js','./hitl-minimax-canonical.mjs');
 fs.writeFileSync(join(dir,'hitl-minimax-proof-verify.mjs'),verifier);
 const {verifyMinimaxProofBundle}=await import(pathToFileURL(join(dir,'hitl-minimax-proof-verify.mjs')).href);
 const {proof,bundle,challengeRecord,snapshotRow:row}=data;
 const snapshot={caseId:row.case_id,decisionId:row.decision_id,version:row.version,gate:row.gate,payloadSha256:row.payload_sha256,chainHeadSha256:row.chain_head_sha256};
 const result=await verifyMinimaxProofBundle({proof,bundle,challengeRecord,snapshot});
 if(!result.webAuthnSignatureVerified||result.recordProvenanceVerified!==false||result.legacyGateAuthorized!==false)throw Error('unexpected_verification_boundary');
 console.log('PASS offline digest and WebAuthn replay; independent record provenance UNESTABLISHED; legacy gates HOLD');
}finally{rmSync(dir,{recursive:true,force:true})}
