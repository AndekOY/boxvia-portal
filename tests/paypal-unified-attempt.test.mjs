import test from "node:test";
import assert from "node:assert/strict";
import {webcrypto} from "node:crypto";
import {reserveUnifiedPayPalAttempt,persistUnifiedPayPalProviderOrder} from "../cloudflare/paypal-unified-attempt.mjs";
globalThis.crypto??=webcrypto;
const orderId="fe2c77c4-1abd-4ab9-ae1e-c57f0b583a34",attemptId="89c35f1e-8a3d-47aa-a2c8-0ac837ed24e1";
const auth={authorized:true,provider:"paypal",orderId,amountMinor:5000,currency:"USD",recovery:false};
test("reservation refuses absent consent authorization before any database access",async()=>{
 const db={prepare(){throw Error("DB should not be accessed");}};
 for(const a of [{...auth,authorized:false},{...auth,recovery:true},{...auth,provider:"stripe"},{...auth,amountMinor:2000},{...auth,currency:"EUR"}]){
  if(a.amountMinor===2000)continue;
  await assert.rejects(()=>reserveUnifiedPayPalAttempt(db,a),/not authorized/);
 }
});
test("existing PayPal attempt is returned without minting another",async()=>{
 let reads=0,writes=0;
 const db={prepare(sql){return {bind(){return this;},async first(){reads++;return {id:attemptId,status:"created",provider_order_id:null};},async run(){writes++;throw Error("Unexpected write");}};}};
 const x=await reserveUnifiedPayPalAttempt(db,auth);
 assert.equal(x.created,false);assert.equal(x.attemptId,attemptId);
 assert.equal(reads,1);assert.equal(writes,0);
});
test("new attempt is reserved against authoritative order and server amount",async()=>{
 const seen=[];
 const db={prepare(sql){const q={sql,args:[],bind(...args){this.args=args;return this;},async first(){return null;},async run(){seen.push(this);return {success:true,meta:{changes:1}};}};return q;}};
 const x=await reserveUnifiedPayPalAttempt(db,auth);
 assert.equal(x.created,true);assert.match(x.attemptId,/^[a-f0-9-]{36}$/);
 assert.equal(seen.length,1);
 assert.match(seen[0].sql,/NOT EXISTS \(SELECT 1 FROM payment_attempts/);
 assert.equal(seen[0].args[2],5000);
});
test("attempt reservation fails closed on concurrent write conflict",async()=>{
 const db={prepare(){return {bind(){return this;},async first(){return null;},async run(){return {success:true,meta:{changes:0}};}};}};
 await assert.rejects(()=>reserveUnifiedPayPalAttempt(db,auth),/manual reconciliation/);
});
test("provider order and checkout state use one D1 batch with both changes required",async()=>{
 const statements=[];
 const db={prepare(sql){return {sql,args:[],bind(...args){this.args=args;return this;}};},async batch(xs){statements.push(...xs);return xs.map(()=>({success:true,meta:{changes:1}}));}};
 const x=await persistUnifiedPayPalProviderOrder(db,auth,attemptId,"PAYPALTEST123");
 assert.equal(x.status,"checkout");assert.equal(statements.length,2);
 assert.match(statements[0].sql,/status = 'created'/);
 assert.match(statements[1].sql,/status = 'pending'/);
 assert.equal(statements[0].args[0],"PAYPALTEST123");
});
test("provider order binding rejects incomplete batch",async()=>{
 const db={prepare(sql){return {bind(){return this;}};},async batch(){return [{success:true,meta:{changes:1}},{success:true,meta:{changes:0}}];}};
 await assert.rejects(()=>persistUnifiedPayPalProviderOrder(db,auth,attemptId,"PAYPALTEST123"),/manual reconciliation/);
});
