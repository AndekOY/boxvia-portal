import assert from "node:assert/strict";
import {fetchAuthenticatedPayPalOrderDraft} from "./contract-paypal-provider-draft.js";
import {reconcileLinkedPayPalIncidentDraft} from "./contract-paypal-incident-draft.js";
const calls=[],env={PAYPAL_ENV:"sandbox",PAYPAL_CLIENT_ID:"client",PAYPAL_CLIENT_SECRET:"secret"};
const orderId="PAYPAL-ORDER-123",session="BXC_"+"a".repeat(64),hash="b".repeat(64);
const fetchImpl=async(url,options)=>{calls.push({url,options});return{
 ok:true,async json(){return url.endsWith("/token")?{access_token:"test-token"}:
 {id:orderId,status:"CREATED",purchase_units:[{custom_id:"42",amount:{currency_code:"USD",value:"20.00"}}]};}
};};
const result=await fetchAuthenticatedPayPalOrderDraft(env,orderId,{fetchImpl});
assert.equal(result.id,orderId);
assert.equal(calls.length,2);
assert.equal(calls[1].options.headers.Authorization,"Bearer test-token");
assert.ok(calls[1].url.startsWith("https://api-m.sandbox.paypal.com/"));
await assert.rejects(fetchAuthenticatedPayPalOrderDraft(env,"../bad",{fetchImpl}),/not configured/);
let link=true,updated=0;
const db={prepare(sql){return{bind(...p){return{
 async first(){
 if(sql.includes("FROM contract_paypal_create_attempts"))return{claim_id:42,snapshot_sha256:hash,status:"reserved",paypal_order_id:null};
 if(sql.includes("FROM contract_checkout_sessions"))return{claim_id:42,status:"accepted",snapshot_sha256:hash};
 if(sql.includes("FROM contract_paypal_order_links"))return link?{checkout_session_id:session,claim_id:42,snapshot_sha256:hash}:null;
 throw Error("Unexpected SQL");
 },
 async run(){updated++;return{success:true,meta:{changes:1}};}
};}};}};
const fetchPayPalOrder=async()=>result;
const input={db,env,checkoutSessionId:session,candidatePayPalOrderId:orderId,fetchPayPalOrder};
link=false;
assert.equal((await reconcileLinkedPayPalIncidentDraft(input)).closed,false);
assert.equal(updated,0);
link=true;
assert.equal((await reconcileLinkedPayPalIncidentDraft(input)).closed,true);
assert.equal(updated,1);
const completed={...result,status:"COMPLETED"};
assert.equal((await reconcileLinkedPayPalIncidentDraft({...input,fetchPayPalOrder:async()=>completed})).closed,false);
assert.equal(updated,1);
console.log("Authenticated PayPal read and conservative incident closure tests passed");
