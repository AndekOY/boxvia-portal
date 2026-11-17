// Server-side Minimax binding. Never trust client-supplied decision hashes.
import {decisionDigest} from './hitl-minimax-canonical.js';
const id=/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const sha=/^[a-f0-9]{64}$/;
export async function prepareBoundDecision(db, {caseId,decisionId,version,gate,action}) {
  if(!id.test(caseId)||!id.test(decisionId)||!Number.isSafeInteger(version)||version<1||
     !['H1','H2','H3','H4','H5'].includes(gate)||!['APPROVE','REJECT'].includes(action))
    throw new Error('invalid_decision_reference');
  const row=await db.prepare(
    'SELECT case_id,decision_id,version,gate,payload_sha256,chain_head_sha256 FROM hitl_minimax_snapshots WHERE case_id=? AND decision_id=? AND version=? AND gate=? AND state=?'
  ).bind(caseId,decisionId,version,gate,'READY').first();
  if(!row||!sha.test(row.payload_sha256)||!sha.test(row.chain_head_sha256))
    throw new Error('snapshot_not_ready');
  const snapshot={caseId:row.case_id,decisionId:row.decision_id,version:row.version,
    gate:row.gate,payloadSha256:row.payload_sha256,chainHeadSha256:row.chain_head_sha256};
  return {snapshot,action,snapshotSha256:await decisionDigest(snapshot,action)};
}
