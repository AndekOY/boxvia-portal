// Run from repository root: node --experimental-default-type=module --test cloudflare/tests/bxc-four-document-integrity.test.mjs
// No network, email, PayPal, production DB or real customer data.
import test from "node:test";
import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import { validateContractSnapshot } from "../contract-confirmation.js";
import { buildVerifiedCheckoutAcceptanceDraft } from "../contract-checkout-evidence-draft.js";
import { prepareDurableConfirmationDraft } from "../contract-confirmation-dispatch-gate-draft.js";
import { acceptOneTimeCheckoutDraft } from "../contract-checkout-orchestrator-draft.js";
globalThis.crypto ??= webcrypto;
const sha=async s=>Buffer.from(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s))).toString("hex");
const bodies={terms:"Synthetic terms",schedule:"Synthetic schedule",withdrawal:"Synthetic withdrawal notice",privacy:"Synthetic privacy notice"};
const ids=Object.keys(bodies);
const timestamp="2026-11-11T08:00:00.000Z",session="BXC_TEST_000001";
const db={prepare(sql){return {bind(){return {async first(){if(sql.includes("FROM claims"))return {id:1,customer_email:"synthetic@example.invalid"};throw Error("Unexpected SQL: "+sql)}}}}}};
async function fixture(){
 const acceptedDocuments=await Promise.all(ids.map(async id=>({id,version:"v0.1-test",sha256:await sha(bodies[id])})));
 const snapshot={orderId:session,acceptedAt:timestamp,productId:"check-a-claim",productVersion:"v0.1-test",exactScope:"Synthetic public claim",termsVersion:"v0.1-test",scheduleVersion:"v0.1-test",customerEmail:"synthetic@example.invalid",providerName:"Synthetic BoxVia",providerAddress:"Synthetic address",providerContact:"synthetic@example.invalid",totalPrice:"20.00",currency:"USD",taxDisclosure:"Synthetic tax disclosure",deliveryRule:"Only after lawful start",reportLanguage:"English",deliveryChannel:"Email",acceptedDocuments,earlyPerformanceRequest:null};
 const consent={affirmative:true,termsAccepted:true,scheduleAccepted:true,withdrawalNoticeAcknowledged:true,privacyNoticeAcknowledged:true,earlyPerformanceRequested:false,earlyPerformanceConsequencesAcknowledged:false,earlyPerformanceTextVersion:"BXC-EARLY-001-v0.1"};
 return {snapshot,consent};
}
const build=async (snapshot,consent)=>buildVerifiedCheckoutAcceptanceDraft({db,claimId:1,accessToken:"synthetic",checkoutSessionId:session,rawSnapshot:snapshot,consent,verifyClaimCapability:async()=>true,now:()=>timestamp});
test("four immutable documents: acceptance evidence passes",async()=>{const {snapshot,consent}=await fixture();const r=await build(snapshot,consent);assert.equal(r.event.documents.length,4);assert.equal(r.event.earlyPerformanceRequested,false)});
test("missing privacy reference: acceptance fails",async()=>{const {snapshot,consent}=await fixture();snapshot.acceptedDocuments.pop();await assert.rejects(build(snapshot,consent),/Incomplete accepted document set/)});
test("duplicate privacy reference: snapshot fails",async()=>{const {snapshot}=await fixture();snapshot.acceptedDocuments.push({...snapshot.acceptedDocuments.at(-1)});assert.throws(()=>validateContractSnapshot(snapshot),/Invalid or duplicate/)});
test("mismatched early performance controls: acceptance fails",async()=>{const {snapshot,consent}=await fixture();consent.earlyPerformanceRequested=true;await assert.rejects(build(snapshot,consent),/Invalid optional early performance choice/)});
test("positive early performance requires matching server timestamp",async()=>{const {snapshot,consent}=await fixture();consent.earlyPerformanceRequested=true;consent.earlyPerformanceConsequencesAcknowledged=true;snapshot.earlyPerformanceRequest={textVersion:consent.earlyPerformanceTextVersion,requestedAt:timestamp};assert.equal((await build(snapshot,consent)).event.earlyPerformanceRequested,true);snapshot.earlyPerformanceRequest.requestedAt="2026-11-11T07:00:00.000Z";await assert.rejects(build(snapshot,consent),/Early performance evidence mismatch/)});
test("four complete attachment bodies verified; altered privacy rejected",async()=>{
 const {snapshot}=await fixture();
 // Read-only stub for accepted archive: matches production SELECT shape and integrity digests.
 const {snapshotSha256}=await import("../contract-confirmation.js");
 const canonical=JSON.stringify(validateContractSnapshot(snapshot,{allowUnicode:true}));
 const evidence=JSON.stringify({source:"server_checkout",checkoutSessionId:session,acceptanceEventSha256:"a".repeat(64),acceptedAt:timestamp,orderId:session,customerEmail:snapshot.customerEmail});
 const row={snapshot_json:canonical,snapshot_sha256:await snapshotSha256(JSON.parse(canonical)),acceptance_evidence_json:evidence,acceptance_evidence_sha256:await sha(evidence)};
 const archiveDb={prepare(sql){return {bind(){return {async first(){assert.match(sql,/contract_acceptance_archive/);return row}}}}}};
 const ok=await prepareDurableConfirmationDraft({db:archiveDb,orderId:session,documentBytesById:bodies});assert.equal(ok.attachments.length,4);
 await assert.rejects(prepareDurableConfirmationDraft({db:archiveDb,orderId:session,documentBytesById:{...bodies,privacy:"Tampered"}}),/Document bytes differ/);
 await assert.rejects(prepareDurableConfirmationDraft({db:archiveDb,orderId:session,documentBytesById:{...bodies,privacy:undefined}}),/Missing complete immutable document/);
});

test("invalid consent is rejected before checkout session consumption",async()=>{
 const {snapshot,consent}=await fixture();
 consent.earlyPerformanceRequested=true;
 let updates=0;
 const accessToken="a".repeat(64);
 const tokenHash=await sha(accessToken);
 const sessionDb={prepare(sql){
  return {bind(){return {
   async first(){
    if(sql.includes("FROM claim_access"))return {token_hash:tokenHash};
    if(sql.includes("FROM claims"))return {id:1,customer_email:"synthetic@example.invalid",payment_status:"pending"};
    throw Error("Unexpected query");
   },
   async run(){updates++;throw Error("Session must not be consumed")}
  }}};
 }};
 await assert.rejects(acceptOneTimeCheckoutDraft({
  db:sessionDb,claimId:1,accessToken,checkoutSessionId:session,consent,
  catalog:{productId:"check-a-claim",totalPrice:"20.00",currency:"USD"}
 }),/Invalid checkout consent/);
 assert.equal(updates,0);
});

test("incomplete trusted catalog is rejected before session consumption",async()=>{
 const {snapshot,consent}=await fixture();
 const accessToken="b".repeat(64),tokenHash=await sha(accessToken);
 let updates=0;
 const sessionDb={prepare(sql){return {bind(){return {
   async first(){
     if(sql.includes("FROM claim_access"))return {token_hash:tokenHash};
     if(sql.includes("FROM claims"))return {id:1,customer_email:"synthetic@example.invalid",payment_status:"pending"};
     throw Error("Unexpected query");
   },
   async run(){updates++;throw Error("Session must not be consumed")}
 }}}}};
 const {orderId,customerEmail,acceptedAt,...catalog}=snapshot;
 catalog.acceptedDocuments=catalog.acceptedDocuments.filter(d=>d.id!=="privacy");
 await assert.rejects(acceptOneTimeCheckoutDraft({
   db:sessionDb,claimId:1,accessToken,checkoutSessionId:session,consent,catalog,now:()=>timestamp
 }),/Incomplete accepted document set/);
 assert.equal(updates,0);
});

test("shared snapshot validator rejects missing Privacy Notice independently of checkout route",async()=>{
 const {snapshot}=await fixture();
 snapshot.acceptedDocuments=snapshot.acceptedDocuments.filter(doc=>doc.id!=="privacy");
 assert.throws(()=>validateContractSnapshot(snapshot),/Incomplete accepted document set/);
});
test("shared snapshot validator rejects substituted legal document ID",async()=>{
 const {snapshot}=await fixture();
 snapshot.acceptedDocuments=snapshot.acceptedDocuments.map(doc=>doc.id==="privacy"?{...doc,id:"marketing"}:doc);
 assert.throws(()=>validateContractSnapshot(snapshot),/Incomplete accepted document set/);
});
