import test from "node:test";
import assert from "node:assert/strict";
import {evaluateIndependentActivation as check} from "../cloudflare/hitl-passkey-independent-approval-preview.js";
const good=()=>({
 request:{id:"request-1",action:"ACTIVATION_REQUESTED",from_state:"PENDING",to_state:"PENDING",credential_id:"cred-1",owner_id:"owner-1"},
 credential:{credential_id:"cred-1",owner_id:"owner-1",state:"PENDING"},
 owner:{id:"owner-1",email:"owner@example.test"},
 approver:{id:"approver-2",email:"approver@example.test",verified:true,role:"INDEPENDENT_APPROVER"},
 evidence:{requestId:"request-1",credentialId:"cred-1",reference:"evidence:review-1",explicitDecision:"APPROVE"}
});
test("independent review is advisory only",()=>{const x=check(good());assert.equal(x.decision,"REVIEW_READY");assert.equal(x.mayActivate,false);assert.equal(x.hitlAuthorization,false)});
for(const [name,mutate,reason] of [
 ["missing request",x=>{x.request=null},"NO_VALID_REQUEST"],
 ["credential mismatch",x=>{x.credential.credential_id="other"},"CREDENTIAL_MISMATCH"],
 ["revoked credential",x=>{x.credential.state="REVOKED"},"CREDENTIAL_MISMATCH"],
 ["owner mismatch",x=>{x.owner.id="other"},"OWNER_MISMATCH"],
 ["unverified approver",x=>{x.approver.verified=false},"APPROVER_UNVERIFIED"],
 ["owner self approval",x=>{x.approver.id="owner-1"},"SELF_APPROVAL"],
 ["same email different id",x=>{x.approver.email="OWNER@example.test"},"SELF_APPROVAL"],
 ["missing evidence",x=>{x.evidence.reference=""},"EVIDENCE_MISMATCH"],
 ["wrong request binding",x=>{x.evidence.requestId="other"},"EVIDENCE_MISMATCH"],
 ["wrong credential binding",x=>{x.evidence.credentialId="other"},"EVIDENCE_MISMATCH"],
 ["no explicit approval",x=>{x.evidence.explicitDecision="DENY"},"EVIDENCE_MISMATCH"]
])test("fail closed: "+name,()=>{const x=good();mutate(x);const y=check(x);assert.equal(y.decision,"HOLD");assert.equal(y.reason,reason);assert.equal(y.mayActivate,false)});
