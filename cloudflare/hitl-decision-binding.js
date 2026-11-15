// HITL signed decision envelope v0.1: pure deterministic serialization and challenge binding.
// Not an enrollment ceremony and not authorization to release a report.
import {encodeBase64url} from "./hitl-webauthn-verify.js";
const enc=new TextEncoder();
const hex=bytes=>Array.from(bytes,b=>b.toString(16).padStart(2,"0")).join("");
const digest=async data=>hex(new Uint8Array(await crypto.subtle.digest("SHA-256",enc.encode(data))));
const required=(value,max=500)=>typeof value==="string" && value.trim().length>0 && value.length<=max;
const isHash=value=>typeof value==="string" && /^[a-f0-9]{64}$/.test(value);
export function canonicalDecision(input) {
  if (!input || typeof input!=="object" || Array.isArray(input)) throw new Error("invalid_decision");
  const {caseId,gate,decision,evidenceRef,reviewDigest,objectVersion,reportDigest,reportVersion,chainHead}=input;
  if (!Number.isSafeInteger(caseId)||caseId<=0||!["H3","H4","H5"].includes(gate)||decision!=="PASS"||
      !required(evidenceRef)||!required(objectVersion,200)||!isHash(reviewDigest)||!isHash(chainHead)) throw new Error("invalid_decision");
  if (gate==="H5" && (!isHash(reportDigest)||!required(reportVersion,200))) throw new Error("missing_report_binding");
  if (gate!=="H5" && (reportDigest!==undefined||reportVersion!==undefined)) throw new Error("unexpected_report_binding");
  return JSON.stringify({
    protocol:"BOXVIA-HITL-WEBAUTHN-v1",caseId,gate,decision,
    evidenceRef:evidenceRef.trim(),reviewDigest,objectVersion:objectVersion.trim(),
    reportDigest:gate==="H5"?reportDigest:null,reportVersion:gate==="H5"?reportVersion.trim():null,
    chainHead
  });
}
export async function decisionDigest(input) { return digest(canonicalDecision(input)); }
export async function eventChainHead(events) {
  if (!Array.isArray(events)) throw new Error("invalid_history");
  let head=await digest("BOXVIA-HITL-CHAIN-v1");
  for(const event of events) {
    if(!event||!Number.isSafeInteger(event.id)||!["H1","H2","H3","H4","H5"].includes(event.gate)||
       !["PASS","HOLD","STOP"].includes(event.decision)||!required(event.evidence_ref)||
       !required(event.actor)) throw new Error("invalid_history");
    head=await digest(JSON.stringify([head,event.id,event.gate,event.decision,event.evidence_ref,event.note??null,event.actor,event.created_at??null]));
  }
  return head;
}
export async function createBoundChallenge(decision,history,ttlMs=120000) {
  if(!Number.isSafeInteger(ttlMs)||ttlMs<30000||ttlMs>300000) throw new Error("invalid_ttl");
  const head=await eventChainHead(history);
  if(decision.chainHead!==head) throw new Error("stale_chain_head");
  const payloadSha256=await decisionDigest(decision);
  const nonce=new Uint8Array(32);crypto.getRandomValues(nonce);
  const challenge=encodeBase64url(nonce);
  return {challenge,challengeSha256:await digest(challenge),payloadSha256,chainHeadSha256:head,expiresAtMs:Date.now()+ttlMs};
}
export async function checkBoundDecision({decision,history,stored}) {
  if(!stored || stored.state!=="PENDING"||Date.now()>=stored.expiresAtMs) throw new Error("challenge_unavailable");
  const head=await eventChainHead(history);
  if(head!==stored.chainHeadSha256||decision.chainHead!==head) throw new Error("stale_chain_head");
  if(await decisionDigest(decision)!==stored.payloadSha256) throw new Error("decision_changed");
  return true;
}
