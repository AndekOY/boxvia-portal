// Draft-only: mock-provider reconciliation after uncertain PayPal Create.
// Run: node cloudflare/contract-paypal-reconciliation-stage9-draft.test.mjs
import assert from "node:assert/strict";
import { inspectUncertainPayPalCreateDraft } from "./contract-paypal-reconciliation-draft.js";
const sid="BXC_STAGE9_FIXTURE_001", orderId="TESTORDER0001", hash="a".repeat(64);
const attempt={claim_id:9001,request_id:"bxc-"+sid,snapshot_sha256:hash,status:"reserved",paypal_order_id:null};
const session={claim_id:9001,status:"accepted",snapshot_sha256:hash};
let link=null, calls=0;
const db={prepare(sql){return{bind(...p){return{async first(){
 if(sql.includes("FROM contract_paypal_create_attempts"))return attempt;
 if(sql.includes("FROM contract_checkout_sessions"))return session;
 if(sql.includes("FROM contract_paypal_order_links"))return link;
 throw Error("Unexpected SQL "+sql);
}}}}}};
const order={id:orderId,status:"CREATED",purchase_units:[{custom_id:"9001",amount:{currency_code:"USD",value:"20.00"}}]};
const fetchPayPalOrder=async id=>{calls++;assert.equal(id,orderId);return structuredClone(order);};
const inspect=()=>inspectUncertainPayPalCreateDraft({db,checkoutSessionId:sid,candidatePayPalOrderId:orderId,fetchPayPalOrder});
let result=await inspect();
assert.equal(result.status,"review_required");assert.equal(result.linked,false);
assert.equal(attempt.status,"reserved");assert.equal(attempt.paypal_order_id,null);
assert.equal(calls,1);
order.purchase_units[0].amount.value="21.00";
await assert.rejects(inspect(),/amount or claim mismatch/);
order.purchase_units[0].amount.value="20.00";
order.purchase_units[0].custom_id="9002";
await assert.rejects(inspect(),/amount or claim mismatch/);
order.purchase_units[0].custom_id="9001";
link={checkout_session_id:"OTHER_SESSION",claim_id:9001,snapshot_sha256:hash};
await assert.rejects(inspect(),/link conflict/);
link={checkout_session_id:sid,claim_id:9001,snapshot_sha256:hash};
result=await inspect();assert.equal(result.linked,true);
assert.equal(result.status,"review_required");
assert.equal(attempt.status,"reserved");
console.log("Stage 9.5 mock provider PASS: uncertain order HOLD; amount/claim mismatch rejected; conflicting link rejected; valid link read-only; no payment mutation.");
