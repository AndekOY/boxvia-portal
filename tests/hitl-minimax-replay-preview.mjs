// CI-only replay of a specific proof from isolated Preview D1.
// Inputs are private Wrangler JSON result files. Never log key material or assertion bytes.
import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
import {mkdtempSync,copyFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const dir=mkdtempSync(join(tmpdir(),'hitl-proof-'));
try {
 for(const name of ['hitl-minimax-proof-verify','hitl-minimax-canonical','hitl-webauthn-verify'])copyFileSync('cloudflare/'+name+'.js',join(dir,name+'.mjs'));
 const verifier=fs.readFileSync(join(dir,'hitl-minimax-proof-verify.mjs'),'utf8')
   .replace('./hitl-webauthn-verify.js','./hitl-webauthn-verify.mjs')
   .replace('./hitl-minimax-canonical.js','./hitl-minimax-canonical.mjs');
 fs.writeFileSync(join(dir,'hitl-minimax-proof-verify.mjs'),verifier);
 const {verifyMinimaxProofBundle}=await import(pathToFileURL(join(dir,'hitl-minimax-proof-verify.mjs')).href);
 const load=path=>{const data=JSON.parse(fs.readFileSync(path,'utf8'));const rows=data.flatMap(x=>x.results||[]);if(rows.length!==1)throw Error('expected_exactly_one_record');return rows[0]};
 const [proof,bundle,challengeRecord,row]=process.argv.slice(2).map(load);
 const snapshot={caseId:row.case_id,decisionId:row.decision_id,version:row.version,gate:row.gate,payloadSha256:row.payload_sha256,chainHeadSha256:row.chain_head_sha256};
 const result=await verifyMinimaxProofBundle({proof,bundle,challengeRecord,snapshot});
 if(result.proofId!==process.env.HITL_EXPECTED_PROOF_ID||!result.webAuthnSignatureVerified||result.recordProvenanceVerified!==false)throw Error('unexpected_replay_result');
 console.log('PASS independent cryptographic replay of designated Preview proof; D1 record provenance remains outside this verification');
 const tampered={...bundle,signature:bundle.signature.slice(0,-1)+(bundle.signature.endsWith('A')?'B':'A')};
 let denied=false;try{await verifyMinimaxProofBundle({proof,bundle:tampered,challengeRecord,snapshot})}catch{denied=true}
 if(!denied)throw Error('tampered_signature_accepted');
 console.log('PASS modified signature rejected');
 // Negative controls for decision and server-side challenge binding.
 for(const [label,changed] of [
  ['decision action',{proof:{...proof,action:proof.action==='APPROVE'?'REJECT':'APPROVE'}}],
  ['snapshot payload',{snapshot:{...snapshot,payloadSha256:'0'.repeat(64)}}],
  ['challenge binding',{challengeRecord:{...challengeRecord,challenge_sha256:'0'.repeat(64)}}]
 ]) {
  let rejected=false;
  try {await verifyMinimaxProofBundle({proof,bundle,challengeRecord,snapshot,...changed})}catch{rejected=true}
  if(!rejected)throw Error('tampered_'+label.replaceAll(' ','_')+'_accepted');
  console.log('PASS tampered '+label+' rejected');
 }
 // D1 is the source of the records. This does not establish independent provenance
 // or prove that the snapshot payload hashes correspond to actual source artifacts.

} finally {rmSync(dir,{recursive:true,force:true})}
