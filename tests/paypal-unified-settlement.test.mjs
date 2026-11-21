import test from "node:test";
import assert from "node:assert/strict";
import {webcrypto} from "node:crypto";
import {settleVerifiedUnifiedPayPalCapture} from "../cloudflare/paypal-unified-settlement.mjs";
globalThis.crypto??=webcrypto;
const orderId="fe2c77c4-1abd-4ab9-ae1e-c57f0b583a34",attemptId="89c35f1e-8a3d-47aa-a2c8-0ac837ed24e1";
const expected={orderId,attemptId,providerOrderId:"PAYPALTEST123",amountMinor:5000,currency:"USD"};
function capture(){return {id:expected.providerOrderId,status:"COMPLETED",purchase_units:[{
 reference_id:attemptId,custom_id:orderId,amount:{currency_code:"USD",value:"50.00"},
 payments:{captures:[{id:"CAPTURE12345",status:"COMPLETED",amount:{currency_code:"USD",value:"50.00"}}]}
}]};}
class DB {
 constructor(){this.order={id:orderId,amount_minor:5000,currency:"USD",status:"checkout"};this.attempt={id:attemptId,order_id:orderId,provider_order_id:expected.providerOrderId,provider_payment_id:null,amount_minor:5000,currency:"USD",status:"pending"};this.outbox=new Set();this.batches=0;}
 prepare(sql){const db=this;return {sql,args:[],bind(...args){this.args=args;return this;},async first(){
  if(sql.includes("FROM service_orders"))return db.order;
  if(sql.includes("FROM payment_attempts"))return db.attempt;
  throw Error("Unexpected SELECT "+sql);
 }};}
 async batch(statements){this.batches++;const results=[];
  for(const s of statements){let changes=0;
   if(s.sql.startsWith("UPDATE service_orders")){
    if(this.order.status==="checkout"&&this.attempt.status==="pending"&&!this.attempt.provider_payment_id){this.order.status="paid";changes=1;}
   }else if(s.sql.startsWith("UPDATE payment_attempts")){
    if(this.order.status==="paid"&&this.attempt.status==="pending"&&!this.attempt.provider_payment_id){this.attempt.status="verified";this.attempt.provider_payment_id=s.args[0];changes=1;}
   }else if(s.sql.startsWith("INSERT OR IGNORE INTO fulfillment_outbox")){
    if(this.order.status==="paid"&&this.attempt.status==="verified"&&!this.outbox.has(orderId)){this.outbox.add(orderId);changes=1;}
   }else throw Error("Unexpected SQL "+s.sql);
   results.push({success:true,meta:{changes}});
  }return results;
 }
}
test("verified PayPal capture marks order paid once and queues one fulfillment",async()=>{
 const db=new DB();
 assert.equal((await settleVerifiedUnifiedPayPalCapture(db,capture(),expected)).outcome,"paid");
 assert.equal(db.order.status,"paid");
 assert.equal(db.attempt.provider_payment_id,"CAPTURE12345");
 assert.equal(db.outbox.size,1);
 assert.equal((await settleVerifiedUnifiedPayPalCapture(db,capture(),expected)).outcome,"already_processed");
 assert.equal(db.batches,1);
});
test("unmatched attempt and altered provider amount never settle",async()=>{
 const db=new DB();
 db.attempt.provider_order_id="OTHER12345";
 assert.equal((await settleVerifiedUnifiedPayPalCapture(db,capture(),expected)).outcome,"unmatched_attempt");
 db.attempt.provider_order_id=expected.providerOrderId;
 const altered=capture();altered.purchase_units[0].payments.captures[0].amount.value="20.00";
 assert.equal((await settleVerifiedUnifiedPayPalCapture(db,altered,expected)).outcome,"rejected");
 assert.equal(db.batches,0);
});
test("second distinct capture on paid order requires manual review",async()=>{
 const db=new DB();await settleVerifiedUnifiedPayPalCapture(db,capture(),expected);
 const other=capture();other.purchase_units[0].payments.captures[0].id="CAPTURE99999";
 assert.equal((await settleVerifiedUnifiedPayPalCapture(db,other,expected)).outcome,"manual_review");
 assert.equal(db.outbox.size,1);
});
