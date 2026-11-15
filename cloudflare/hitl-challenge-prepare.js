// Server-side HITL challenge preparation. No HTTP route or human approval.
// Deliberately narrow: trusted server supplies case, history and owner credential.
// Caller must authenticate owner independently; this module only prepares a challenge.
import {createBoundChallenge} from "./hitl-decision-binding.js";
import {encodeBase64url} from "./hitl-webauthn-verify.js";
const hex=bytes=>Array.from(bytes,b=>b.toString(16).padStart(2,"0")).join("");
const sha=async value=>hex(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value))));
export async function prepareHitlChallenge({db,caseId,gate,decision,history,credentialId,ttlMs=120000}) {
  if (!db || !Number.isSafeInteger(caseId) || caseId<1 || !["H3","H4","H5"].includes(gate) ||
      !decision || decision.caseId!==caseId || decision.gate!==gate ||
      typeof credentialId!=="string" || credentialId.length<1 || credentialId.length>512) throw new Error("invalid_request");
  const record=await db.prepare("SELECT id,status FROM hitl_cases WHERE id=?").bind(caseId).first();
  if (!record || record.status!=="HOLD") throw new Error("case_unavailable");
  const credential=await db.prepare("SELECT credential_id,state FROM hitl_authenticators WHERE credential_id=?").bind(credentialId).first();
  if (!credential || credential.state!=="ACTIVE") throw new Error("credential_unavailable");
  const actual=await db.prepare("SELECT id,gate,decision,evidence_ref,note,actor,created_at FROM hitl_events WHERE case_id=? ORDER BY id ASC").bind(caseId).all();
  // Never trust client-provided event history.
  if (history!==undefined) throw new Error("history_must_be_server_derived");
  const challenge=await createBoundChallenge(decision,actual.results||[],ttlMs);
  const id=encodeBase64url(crypto.getRandomValues(new Uint8Array(24)));
  const expiresAt=Math.floor(challenge.expiresAtMs/1000);
  await db.prepare(`INSERT INTO hitl_auth_challenges
    (id,case_id,gate,decision,payload_sha256,chain_head_sha256,credential_id,challenge_sha256,expires_at)
    VALUES (?,?,?,'PASS',?,?,?,?,?)`).bind(id,caseId,gate,challenge.payloadSha256,
    challenge.chainHeadSha256,credentialId,challenge.challengeSha256,expiresAt).run();
  // No decision PASS, verified intent or proof is created here.
  return {challengeId:id,challenge:challenge.challenge,expiresAtMs:challenge.expiresAtMs,
    payloadSha256:challenge.payloadSha256};
}
