import test from "node:test";
import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import { settleVerifiedStripeEvent } from "../cloudflare/stripe-settlement.mjs";
globalThis.crypto ??= webcrypto;
const orderId="6a7bb765-5fb8-4a65-95be-8458e1bc7654";
const sessionId="cs_test_123456789";
const paymentId="pi_123456789";
const event={
  id:"evt_123456789",livemode:false,type:"checkout.session.completed",
  data:{object:{
    object:"checkout.session",livemode:false,id:sessionId,mode:"payment",payment_status:"paid",
    client_reference_id:orderId,metadata:{order_id:orderId},
    amount_total:5000,currency:"usd",payment_intent:paymentId
  }}
};
class DB {
  constructor() {this.order={id:orderId,amount_minor:5000,currency:"USD",status:"checkout"};this.attempt={id:"attempt-1",order_id:orderId,provider_order_id:sessionId,amount_minor:5000,currency:"USD",status:"pending"};this.events=new Set();this.outbox=new Set();}
  prepare(sql) {
    const db=this;
    return {
      sql, args:[],
      bind(...values){this.args=values;return this;},
      async first(){
        if(sql.includes("FROM service_orders"))return db.order;
        if(sql.includes("FROM payment_attempts"))return db.attempt;
        throw new Error("unexpected query");
      }
    };
  }
  async batch(statements){
    const result=[];
    for(const s of statements){
      let changes=0;
      if(s.sql.startsWith("INSERT OR IGNORE INTO payment_events")){
        if(!this.events.has(s.args[0])){this.events.add(s.args[0]);changes=1;}
      } else if(s.sql.startsWith("UPDATE service_orders")){
        if(this.order.status==="checkout"){this.order.status="paid";changes=1;}
      } else if(s.sql.startsWith("UPDATE payment_attempts")){
        if(this.order.status==="paid"){this.attempt.status="verified";changes=1;}
      } else if(s.sql.startsWith("INSERT OR IGNORE INTO fulfillment_outbox")){
        if(this.order.status==="paid"&&this.attempt.status==="verified"&&!this.outbox.has(orderId)){this.outbox.add(orderId);changes=1;}
      } else if(s.sql.startsWith("UPDATE payment_events"))changes=1;
      else throw new Error("unexpected SQL");
      result.push({success:true,meta:{changes}});
    }
    return result;
  }
}
test("verified matching Stripe session marks order paid once and queues one fulfillment",async()=>{
  const db=new DB();
  const first=await settleVerifiedStripeEvent(db,event);
  assert.equal(first.outcome,"paid");
  assert.equal(db.order.status,"paid");
  assert.equal(db.attempt.status,"verified");
  assert.equal(db.outbox.size,1);
  const second=await settleVerifiedStripeEvent(db,event);
  assert.equal(second.outcome,"already_processed_or_manual_review");
  assert.equal(db.outbox.size,1);
  assert.equal(db.events.size,1);
});
test("reject amount manipulation and absent checkout attempt",async()=>{
  const db=new DB();
  assert.equal((await settleVerifiedStripeEvent(db,{...event,data:{object:{...event.data.object,amount_total:2000}}})).outcome,"rejected");
  assert.equal(db.order.status,"checkout");
  db.attempt=null;
  assert.equal((await settleVerifiedStripeEvent(db,event)).outcome,"unmatched_attempt");
});
test("unverified event type does not write to D1",async()=>{
  const db=new DB();
  assert.equal((await settleVerifiedStripeEvent(db,{...event,type:"payment_intent.created"})).outcome,"ignored");
  assert.equal(db.events.size,0);
});
