import assert from "node:assert/strict";
import {reconcileOrphanPayPalOrderDraft} from "./contract-paypal-orphan-recovery-draft.js";
const session="BXC_"+"a".repeat(64),orderId="PAYPAL-123456",hash="b".repeat(64);
const provider={id:orderId,status:"CREATED",purchase_units:[{custom_id:"42",amount:{currency_code:"USD",value:"20.00"}}]};
function fixture({other=false,terminal=false,linked=false,existing=false}={}){
 let batches=0;
 const db={
  prepare(sql){return{bind(...p){return{async first(){
   if(sql.includes("FROM contract_paypal_create_attempts"))return{claim_id:42,request_id:"bxc-"+session,snapshot_sha256:hash,status:"reserved",paypal_order_id:null};
   if(sql.includes("FROM contract_checkout_sessions"))return{claim_id:42,status:"accepted",snapshot_sha256:hash};
   if(sql.includes("FROM contract_paypal_order_links"))return linked?{checkout_session_id:session,claim_id:42,snapshot_sha256:hash}:null;
   if(sql.includes("FROM paypal_orders WHERE claim_id"))return other?{paypal_order_id:"OTHER-123456"}:null;
   if(sql.includes("FROM paypal_orders WHERE paypal_order_id"))return existing?{claim_id:42,amount:"20.00",currency:"USD"}:null;
   throw Error("Unexpected SQL "+sql);
  },sql,p};}};},
  async batch(statements){batches++;assert.equal(statements.length,3);return statements.map(()=>({success:true,meta:{changes:1}}));}
 };
 return {db,provider:{...provider,status:terminal?"COMPLETED":"CREATED"},get batches(){return batches}};
}
const ok=fixture();
assert.equal((await reconcileOrphanPayPalOrderDraft({db:ok.db,checkoutSessionId:session,candidatePayPalOrderId:orderId,fetchPayPalOrder:async()=>ok.provider})).status,"linked");
assert.equal(ok.batches,1);
for(const options of [{other:true},{terminal:true},{linked:true},{existing:true}]){
 const f=fixture(options);
 await assert.rejects(reconcileOrphanPayPalOrderDraft({db:f.db,checkoutSessionId:session,candidatePayPalOrderId:orderId,fetchPayPalOrder:async()=>f.provider}));
 assert.equal(f.batches,0);
}
const mismatch=fixture();
await assert.rejects(reconcileOrphanPayPalOrderDraft({db:mismatch.db,checkoutSessionId:session,candidatePayPalOrderId:orderId,fetchPayPalOrder:async()=>({...provider,purchase_units:[{custom_id:"42",amount:{currency_code:"USD",value:"21.00"}}]})}),/amount or claim mismatch/);
assert.equal(mismatch.batches,0);
console.log("Orphan PayPal recovery draft tests passed");
