// Preview-only signed commit coordinator. NOT routed to HTTP and NOT production enabled.
// Caller must independently authenticate owner and ensure real verified enrollment.
// The SQLite v4 guard/consumption triggers are mandatory.
import {verifyHitlSignedPreflight} from "./hitl-signed-preflight.js";
import {decodeBase64url} from "./hitl-webauthn-verify.js";
const enc=new TextEncoder();
const hex=b=>Array.from(b,x=>x.toString(16).padStart(2,"0")).join("");
const sha=async s=>hex(new Uint8Array(await crypto.subtle.digest("SHA-256",enc.encode(s))));
export async function commitHitlSignedPreview({db,challengeId,decision,assertion,origin,rpId}) {
  if (!db || typeof db.batch!=="function") throw new Error("atomic_batch_required");
  const verified=await verifyHitlSignedPreflight({db,challengeId,decision,assertion,origin,rpId});
  // The snapshot ID and counter are checked AGAIN inside the SQLite INSERT trigger.
  const latest=await db.prepare("SELECT COALESCE(MAX(id),0) AS last_id FROM hitl_events WHERE case_id=?").bind(verified.caseId).first();
  if (!latest || !Number.isSafeInteger(latest.last_id)) throw new Error("snapshot_unavailable");
  const caseRow=await db.prepare("SELECT assessor FROM hitl_cases WHERE id=? AND status='HOLD'").bind(verified.caseId).first();
  if (!caseRow || typeof caseRow.assessor!=="string") throw new Error("case_unavailable");
  const assertionSha=await sha(JSON.stringify(assertion));
  const intentId=crypto.randomUUID();
  const intent=db.prepare(`INSERT INTO hitl_verified_commit_intents
    (id,challenge_id,case_id,gate,payload_sha256,assertion_sha256,credential_id,evidence_ref,expected_last_event_id,verified_sign_count)
    VALUES(?,?,?,?,?,?,?,?,?,?)`).bind(intentId,challengeId,verified.caseId,verified.gate,
    verified.payloadSha256,assertionSha,verified.credentialId,decision.evidenceRef.trim(),latest.last_id,verified.signCount);
  const event=db.prepare(`INSERT INTO hitl_events
    (case_id,gate,decision,evidence_ref,note,actor,signed_intent_id)
    VALUES(?,?,'PASS',?,NULL,?,?)`).bind(verified.caseId,verified.gate,decision.evidenceRef.trim(),caseRow.assessor,intentId);
  // D1 batch is a transaction: failure of event guard rolls back intent creation.
  // Triggers atomically consume challenge, append proof, update sign counter.
  const result=await db.batch([intent,event]);
  if (!Array.isArray(result)||result.length!==2||result.some(r=>r.success!==true)) throw new Error("atomic_commit_unconfirmed");
  return {committed:true,caseId:verified.caseId,gate:verified.gate,intentId};
}
