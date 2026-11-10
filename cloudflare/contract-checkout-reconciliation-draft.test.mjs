import assert from "node:assert/strict";
import {validateContractSnapshot} from "./contract-confirmation.js";
import {inspectInterruptedCheckoutDraft,finalizeInterruptedCheckoutDraft} from "./contract-checkout-reconciliation-draft.js";
const id="BXC_"+"a".repeat(64), email="buyer@example.test", hash=async s=>[...new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s)))].map(x=>x.toString(16).padStart(2,"0")).join("");
const snapshot={orderId:id,customerEmail:email,acceptedAt:"2026-11-10T12:00:00.000Z",productId:"check-a-claim",productVersion:"v1",exactScope:"Review one public claim",termsVersion:"v1",scheduleVersion:"v1",providerName:"BoxVia",providerAddress:"Poland",providerContact:"contact@example.test",totalPrice:"20.00",currency:"USD",taxDisclosure:"Tax included",deliveryRule:"Within 24 hours",reportLanguage:"English",deliveryChannel:"Email",acceptedDocuments:["terms","schedule","withdrawal"].map(id=>({id,version:"v1",sha256:"a".repeat(64)}))};
const evidence={source:"server_checkout",checkoutSessionId:id,acceptanceEventSha256:"b".repeat(64),acceptedAt:snapshot.acceptedAt,orderId:id,customerEmail:email};
const snapJson=JSON.stringify(validateContractSnapshot(snapshot)), evidenceJson=JSON.stringify(evidence), digest=await hash(snapJson);
let status="consuming", archived=true, updates=0;
const db={prepare(sql){return{bind(...params){return{
 async first(){
  if(sql.includes("FROM contract_checkout_sessions"))return{claim_id:42,customer_email:email,status,snapshot_sha256:null};
  if(sql.includes("FROM contract_acceptance_archive"))return archived?{snapshot_json:snapJson,snapshot_sha256:digest,acceptance_evidence_json:evidenceJson,acceptance_evidence_sha256:await hash(evidenceJson)}:null;
  throw Error("Unexpected query");
 },
 async run(){
  if(!sql.startsWith("UPDATE contract_checkout_sessions"))throw Error("Unexpected update");
  if(status!=="consuming"||params[0]!==digest)return{meta:{changes:0}};
  updates++;status="accepted";return{meta:{changes:1}};
 }
};}};}};
const inspection=await inspectInterruptedCheckoutDraft({db,checkoutSessionId:id});
assert.equal(inspection.status,"archived_pending_finalization");
assert.equal(inspection.snapshotSha256,digest);
await assert.rejects(finalizeInterruptedCheckoutDraft({db,checkoutSessionId:id,expectedSnapshotSha256:"0".repeat(64)}),/Verified acceptance archive required/);
assert.equal(updates,0);
assert.equal((await finalizeInterruptedCheckoutDraft({db,checkoutSessionId:id,expectedSnapshotSha256:digest})).status,"accepted");
assert.equal(updates,1);
await assert.rejects(finalizeInterruptedCheckoutDraft({db,checkoutSessionId:id,expectedSnapshotSha256:digest}),/No interrupted checkout session/);
status="consuming";archived=false;
assert.equal((await inspectInterruptedCheckoutDraft({db,checkoutSessionId:id})).status,"review_required");
await assert.rejects(finalizeInterruptedCheckoutDraft({db,checkoutSessionId:id,expectedSnapshotSha256:digest}),/Verified acceptance archive required/);
assert.equal(updates,1);
console.log("Interrupted checkout reconciliation draft tests passed");
