// HITL-Minimax v1.0. Pure canonicalization; no network, D1 or authorization side effects.
// A digest is a binding to a reviewed snapshot, not by itself a digital signature.
const encoder = new TextEncoder();
const hex = bytes => Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, '0')).join('');
const sha256 = async value => hex(await crypto.subtle.digest('SHA-256', encoder.encode(value)));
const sha = /^[a-f0-9]{64}$/;
const id = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
export function canonicalDecision(snapshot, action) {
  if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot) ||
      !id.test(snapshot.caseId) || !id.test(snapshot.decisionId) ||
      !Number.isSafeInteger(snapshot.version) || snapshot.version < 1 ||
      !['H1','H2','H3','H4','H5'].includes(snapshot.gate) ||
      !sha.test(snapshot.payloadSha256) || !sha.test(snapshot.chainHeadSha256) ||
      !['APPROVE','REJECT'].includes(action)) throw new Error('invalid_decision_snapshot');
  // Fixed key order, fixed scalar types, no caller-controlled extra fields.
  return JSON.stringify({
    protocol:'BOXVIA-HITL-MINIMAX-v1',
    caseId:snapshot.caseId,decisionId:snapshot.decisionId,version:snapshot.version,
    gate:snapshot.gate,payloadSha256:snapshot.payloadSha256,
    chainHeadSha256:snapshot.chainHeadSha256,action
  });
}
export async function decisionDigest(snapshot,action) {
  return sha256(canonicalDecision(snapshot,action));
}
