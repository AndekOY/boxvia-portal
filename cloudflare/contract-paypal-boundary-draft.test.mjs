import assert from "node:assert/strict";
import {preflightPayPalCreateDraft,persistCreatedPayPalOrderDraft,preflightPayPalCaptureDraft} from "./contract-paypal-boundary-draft.js";
import {validateContractSnapshot,snapshotSha256} from "./contract-confirmation.js";
const token="a".repeat(64), sessionId="BXC_"+"b".repeat(64), paypalOrderId="PAYPAL-ORDER-123";
const sha=async s=>[...new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s)))].map(x=>x.toString(16).padStart(2,"0")).join("");
const snapshot=validateContractSnapshot({orderId:sessionId,acceptedAt:"2026-11-10T12:00:00.000Z",productId:"check-a-claim",productVersion:"v1",exactScope:"Review one public claim",termsVersion:"v1",scheduleVersion:"v1",customerEmail:"customer@example.test",providerName:"BoxVia",providerAddress:"Poland",providerContact:"contact@example.test",totalPrice:"20.00",currency:"USD",taxDisclosure:"Tax included",deliveryRule:"Within 24 hours",reportLanguage:"English",deliveryChannel:"Email",acceptedDocuments:["terms","schedule","withdrawal"].map(id=>({id,version:"v1",sha256:"a".repeat(64)}))},{allowUnicode:true});
const snapshotHash=await snapshotSha256(snapshot), evidence=JSON.stringify({checkoutSessionId:sessionId,orderId:sessionId});
const archive={snapshot_json:JSON.stringify(snapshot),snapshot_sha256:snapshotHash,acceptance_evidence_json:evidence,acceptance_evidence_sha256:await sha(evidence)};
let link=null,order=null,sessionStatus="accepted";
const db={
 prepare(sql){return{bind(...p){return{async first(){
  if(sql.includes("FROM claim_access"))return{token_hash:await sha(token)};
  if(sql.includes("FROM contract_checkout_sessions"))return{claim_id:42,customer_email:"customer@example.test",status:sessionStatus,snapshot_sha256:snapshotHash};
  if(sql.includes("FROM claims"))return{id:42,customer_email:"customer@example.test",payment_status:"pending"};
  if(sql.includes("FROM contract_acceptance_archive"))return archive;
  if(sql.includes("FROM contract_paypal_order_links"))return link;
  if(sql.includes("FROM paypal_orders p JOIN"))return order&&link?{claim_id:42,paypal_order_id:order.paypalOrderId,amount:"20.00",currency:"USD",checkout_session_id:link.checkout_session_id,snapshot_sha256:link.snapshot_sha256}:null;
  throw Error("Unexpected SELECT: "+sql);
 },sql,p};}};},
 async batch(statements){
  if(link||order)throw Error("Duplicate");
  const p=statements[0].p,q=statements[1].p;
  assert.equal(p[0],42);assert.equal(q[0],sessionId);assert.equal(q[3],snapshotHash);
  order={paypalOrderId:p[1]};link={paypal_order_id:q[2],checkout_session_id:q[0],snapshot_sha256:q[3]};
  return [{success:true,meta:{changes:1}},{success:true,meta:{changes:1}}];
 }
};
const input={db,claimId:42,accessToken:token,checkoutSessionId:sessionId};
const preflight=await preflightPayPalCreateDraft(input);
assert.equal(preflight.existingPayPalOrderId,null);
await persistCreatedPayPalOrderDraft({db,preflight,paypalOrderId});
assert.equal((await preflightPayPalCreateDraft(input)).existingPayPalOrderId,paypalOrderId);
assert.equal((await preflightPayPalCaptureDraft({...input,paypalOrderId})).paypalOrderId,paypalOrderId);
await assert.rejects(preflightPayPalCaptureDraft({...input,paypalOrderId:"OTHER-ORDER-123"}),/linkage mismatch/);
await assert.rejects(preflightPayPalCaptureDraft({...input,accessToken:"c".repeat(64),paypalOrderId}),/capability/);
sessionStatus="consuming";
await assert.rejects(preflightPayPalCreateDraft(input),/Accepted checkout session/);
console.log("PayPal create and capture boundary draft tests passed");
