import test from "node:test";
import assert from "node:assert/strict";
import {webcrypto} from "node:crypto";
import {reserveStripeAttempt} from "../cloudflare/stripe-checkout.mjs";
import {reserveUnifiedPayPalAttempt} from "../cloudflare/paypal-unified-attempt.mjs";
globalThis.crypto??=webcrypto;
const orderId="6a7bb765-5fb8-4a65-95be-8458e1bc7654";
const order={orderId,serviceCode:"one-question-review",amountMinor:5000,currency:"USD",status:"pending"};
const auth={authorized:true,provider:"paypal",orderId,amountMinor:5000,currency:"USD",recovery:false};
for(const [existing,call] of [["paypal",db=>reserveStripeAttempt(db,order)],["stripe",db=>reserveUnifiedPayPalAttempt(db,auth)]]){
 test("existing "+existing+" reservation prevents other provider",async()=>{
  let writes=0;
  const db={prepare(){return {bind(){return this;},async first(){return {id:"synthetic",provider:existing,status:"created",provider_order_id:null};},async run(){writes++;return {success:true,meta:{changes:1}};}};}};
  await assert.rejects(()=>call(db),/Other payment provider already reserved/);
  assert.equal(writes,0);
 });
}
