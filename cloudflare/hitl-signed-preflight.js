// MINIMAX: verify a WebAuthn assertion against DB-stored challenge metadata.
// This is a preflight only. No HITL event, proof or verified intent is written.
// The raw challenge comes from the assertion clientDataJSON; its hash must match D1.
import {decodeBase64url,verifyWebAuthnAssertion} from "./hitl-webauthn-verify.js";
import {decisionDigest,eventChainHead} from "./hitl-decision-binding.js";
const enc=new TextEncoder();
const hex=bytes=>Array.from(bytes,b=>b.toString(16).padStart(2,"0")).join("");
const sha=async s=>hex(new Uint8Array(await crypto.subtle.digest("SHA-256",enc.encode(s))));
export async function verifyHitlSignedPreflight({db,challengeId,decision,assertion,origin,rpId}) {
  if (!db || typeof challengeId!=="string" || !/^[A-Za-z0-9_-]{16,128}$/.test(challengeId) ||
      !decision || !assertion || typeof origin!=="string" || typeof rpId!=="string") throw new Error("invalid_preflight");
  const c=await db.prepare("SELECT id,case_id,gate,payload_sha256,chain_head_sha256,credential_id,challenge_sha256,expires_at,state FROM hitl_auth_challenges WHERE id=?").bind(challengeId).first();
  if (!c || c.state!=="PENDING" || !Number.isSafeInteger(c.expires_at) || c.expires_at<=Math.floor(Date.now()/1000)) throw new Error("challenge_unavailable");
  if (decision.caseId!==c.case_id || decision.gate!==c.gate || await decisionDigest(decision)!==c.payload_sha256) throw new Error("decision_mismatch");
  const record=await db.prepare("SELECT status FROM hitl_cases WHERE id=?").bind(c.case_id).first();
  if (!record || record.status!=="HOLD") throw new Error("case_unavailable");
  const history=await db.prepare("SELECT id,gate,decision,evidence_ref,note,actor,created_at FROM hitl_events WHERE case_id=? ORDER BY id ASC").bind(c.case_id).all();
  const head=await eventChainHead(history.results||[]);
  if (head!==c.chain_head_sha256 || decision.chainHead!==head) throw new Error("stale_chain_head");
  const credential=await db.prepare("SELECT credential_id,state,rp_id,sign_count,public_key_spki FROM hitl_authenticators WHERE credential_id=?").bind(c.credential_id).first();
  if (!credential || !credential.public_key_spki) throw new Error("credential_unavailable");
  const client=JSON.parse(new TextDecoder("utf-8",{fatal:true}).decode(decodeBase64url(assertion.response?.clientDataJSON)));
  if (typeof client.challenge!=="string" || await sha(client.challenge)!==c.challenge_sha256) throw new Error("challenge_mismatch");
  const verified=await verifyWebAuthnAssertion({assertion,expected:{origin,rpId,challenge:client.challenge,expiresAtMs:c.expires_at*1000},
    credential:{credentialId:credential.credential_id,state:credential.state,rpId:credential.rp_id,signCount:credential.sign_count,publicKeySpki:credential.public_key_spki}});
  return {verified:true,caseId:c.case_id,gate:c.gate,challengeId:c.id,credentialId:verified.credentialId,
    signCount:verified.signCount,payloadSha256:c.payload_sha256,chainHeadSha256:head};
}
