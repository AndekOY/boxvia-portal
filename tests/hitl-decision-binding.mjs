import test from "node:test";
import assert from "node:assert/strict";
import {eventChainHead,canonicalDecision,decisionDigest,createBoundChallenge,checkBoundDecision} from "../cloudflare/hitl-decision-binding.js";
const history=[
 {id:1,gate:"H1",decision:"PASS",evidence_ref:"synthetic/scope",actor:"TEST_ONLY",created_at:"2026-11-15 00:00:00"},
 {id:2,gate:"H2",decision:"PASS",evidence_ref:"synthetic/ai",actor:"TEST_ONLY",created_at:"2026-11-15 00:00:01"}
];
const hash="a".repeat(64);
async function fixture(gate="H3") {
 const chainHead=await eventChainHead(history);
 return {caseId:123,gate,decision:"PASS",evidenceRef:"synthetic/review",reviewDigest:hash,objectVersion:"v0.1",chainHead,...(gate==="H5"?{reportDigest:"b".repeat(64),reportVersion:"v0.1"}:{})};
}
test("canonical decision digest is deterministic",async()=>{
 const d=await fixture();assert.equal(await decisionDigest(d),await decisionDigest({...d}));
 assert.equal(canonicalDecision(d),canonicalDecision({...d}));
});
test("fresh challenge binds case and review",async()=>{
 const d=await fixture(), c=await createBoundChallenge(d,history);
 assert.equal(c.challenge.length,43);
 assert.equal(c.payloadSha256,await decisionDigest(d));
 assert.equal(await checkBoundDecision({decision:d,history,stored:{...c,state:"PENDING"}}),true);
});
test("changed case, review, object version, evidence ref rejected",async()=>{
 const d=await fixture(),c=await createBoundChallenge(d,history);
 for(const delta of [{caseId:124},{reviewDigest:"b".repeat(64)},{objectVersion:"v0.2"},{evidenceRef:"different"}]){
 await assert.rejects(()=>checkBoundDecision({decision:{...d,...delta},history,stored:{...c,state:"PENDING"}}));
 }
});
test("H5 binds report hash and version",async()=>{
 const d=await fixture("H5"),c=await createBoundChallenge(d,history);
 for(const delta of [{reportDigest:"c".repeat(64)},{reportVersion:"v0.2"}])
 await assert.rejects(()=>checkBoundDecision({decision:{...d,...delta},history,stored:{...c,state:"PENDING"}}));
});
test("changed event chain invalidates pending approval",async()=>{
 const d=await fixture(),c=await createBoundChallenge(d,history);
 const changed=[...history,{id:3,gate:"H2",decision:"HOLD",evidence_ref:"synthetic/change",actor:"TEST_ONLY"}];
 await assert.rejects(()=>checkBoundDecision({decision:d,history:changed,stored:{...c,state:"PENDING"}}));
});
test("consumed or expired challenges rejected",async()=>{
 const d=await fixture(),c=await createBoundChallenge(d,history);
 await assert.rejects(()=>checkBoundDecision({decision:d,history,stored:{...c,state:"CONSUMED"}}));
 await assert.rejects(()=>checkBoundDecision({decision:d,history,stored:{...c,state:"PENDING",expiresAtMs:Date.now()-1}}));
});
test("missing H5 report digest and invalid gate rejected",async()=>{
 const d=await fixture("H5");delete d.reportDigest;
 assert.throws(()=>canonicalDecision(d));
 const d2=await fixture();assert.throws(()=>canonicalDecision({...d2,gate:"H2"}));
});
test("stale chain head cannot issue challenge",async()=>{
 const d=await fixture();await assert.rejects(()=>createBoundChallenge({...d,chainHead:"f".repeat(64)},history));
});
