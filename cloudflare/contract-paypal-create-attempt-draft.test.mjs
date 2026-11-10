import assert from "node:assert/strict";
import {reservePayPalCreateDraft,markPayPalAttemptLinkedDraft} from "./contract-paypal-create-attempt-draft.js";
const session="BXC_"+"a".repeat(64),hash="b".repeat(64);
let row=null,linked=false;
const db={prepare(sql){return{bind(...p){return{
 async run(){
  if(sql.startsWith("INSERT OR IGNORE")){
   if(row)return{success:true,meta:{changes:0}};
   row={claim_id:p[1],request_id:p[2],snapshot_sha256:p[3],status:"reserved",paypal_order_id:null};
   return{success:true,meta:{changes:1}};
  }
  if(sql.startsWith("UPDATE contract_paypal_create_attempts")){
   if(!linked||row.status!=="reserved"||p[0]!=="PAYPAL-123456")return{meta:{changes:0}};
   row.status="linked";row.paypal_order_id=p[0];return{meta:{changes:1}};
  }
  throw Error("Unexpected SQL");
 },
 async first(){return row;}
};}};}};
const preflight={checkoutSessionId:session,claimId:42,snapshotSha256:hash};
const reservation=await reservePayPalCreateDraft({db,preflight});
assert.equal(reservation.requestId,"bxc-"+session);
await assert.rejects(reservePayPalCreateDraft({db,preflight}),/requires reconciliation/);
await assert.rejects(markPayPalAttemptLinkedDraft({db,reservation,paypalOrderId:"PAYPAL-123456"}),/requires reconciliation/);
linked=true;
assert.equal((await markPayPalAttemptLinkedDraft({db,reservation,paypalOrderId:"PAYPAL-123456"})).status,"linked");
await assert.rejects(reservePayPalCreateDraft({db,preflight}),/requires reconciliation/);
console.log("PayPal durable create attempt draft tests passed");
