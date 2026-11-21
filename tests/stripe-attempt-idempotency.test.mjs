import test from "node:test";
import assert from "node:assert/strict";
import {webcrypto} from "node:crypto";
import {reserveStripeAttempt} from "../cloudflare/stripe-checkout.mjs";
globalThis.crypto??=webcrypto;
const order={orderId:"6a7bb765-5fb8-4a65-95be-8458e1bc7654",serviceCode:"one-question-review",amountMinor:5000,currency:"USD",status:"pending"};
test("existing Stripe attempt is reused without another write",async()=>{
 let writes=0;
 const db={prepare(){return {bind(){return this;},async first(){return {id:"existing",provider:"stripe",status:"created",provider_order_id:null};},async run(){writes++;throw Error("unexpected write");}};}};
 const result=await reserveStripeAttempt(db,order);
 assert.equal(result.created,false);
 assert.equal(result.attemptId,"existing");
 assert.equal(writes,0);
});
test("Stripe reservation is atomic and bound to the same order and provider",async()=>{
 let sql,args;
 const db={prepare(query){return {bind(...params){sql=query;args=params;return this;},async first(){return null;},async run(){return {success:true,meta:{changes:1}};}};}};
 const result=await reserveStripeAttempt(db,order);
 assert.equal(result.created,true);
 assert.match(sql,/NOT EXISTS \(SELECT 1 FROM payment_attempts WHERE order_id = \? AND provider = 'stripe'\)/);
 assert.deepEqual(args.slice(1),[order.orderId,order.orderId]);
});
test("concurrent Stripe attempt conflict fails closed without provider call",async()=>{
 const db={prepare(){return {bind(){return this;},async first(){return null;},async run(){return {success:true,meta:{changes:0}};}};}};
 await assert.rejects(()=>reserveStripeAttempt(db,order),/already reserved or unavailable/);
});
