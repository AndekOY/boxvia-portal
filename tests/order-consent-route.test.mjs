import test from "node:test";
import assert from "node:assert/strict";
import {handleOrderConsent} from "../cloudflare/order-consent-route.mjs";
const origin="https://boxvia-orders-sandbox.andeks.workers.dev";
function req(data,originHeader=origin){return new Request(origin+"/api/orders/consent",{method:"POST",headers:{Origin:originHeader,"Content-Type":"application/json"},body:JSON.stringify(data)});}
const valid={orderId:"00000000-0000-4000-8000-000000000000",capability:"a".repeat(64),termsDigest:"b".repeat(64),offerAccepted:true,confidentialityAccepted:true};
test("no acceptance without two independent affirmative choices",async()=>{
 for(const key of ["offerAccepted","confidentialityAccepted"]){
  const input={...valid,[key]:false};
  const response=await handleOrderConsent(req(input),{DB:{prepare(){throw Error("must not access DB")}}});
  assert.equal(response.status,400);
 }
});
test("cross-origin consent is rejected before D1 access",async()=>{
 const response=await handleOrderConsent(req(valid,"https://evil.invalid"),{DB:{prepare(){throw Error("must not access DB")}}});
 assert.equal(response.status,403);
});
test("unauthenticated consent never persists",async()=>{
 let reads=0;
 const response=await handleOrderConsent(req(valid),{DB:{prepare(sql){assert.match(sql,/^SELECT /);reads++;return {bind(){return {async first(){return null;}}}};}}});
 assert.equal(response.status,404);
 assert.equal(reads,1);
});
test("terms digest cannot be omitted",async()=>{
 const response=await handleOrderConsent(req({...valid,termsDigest:null}),{DB:{prepare(){throw Error("must not access DB")}}});
 assert.equal(response.status,400);
});
