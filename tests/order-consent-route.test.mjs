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

test("valid dual consent records once and passes the database-backed eligibility gate",async()=>{
 const scopeText="Canonical scope for synthetic One Question Review";
 const digest=Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(scopeText))),x=>x.toString(16).padStart(2,"0")).join("");
 const orderId=valid.orderId;
 const source={scope_text:scopeText,terms_digest:digest,terms_version:"sandbox-v1",
  offer_text:"Synthetic commercial offer, test only",offer_version:"offer-v1",
  confidentiality_text:"Synthetic confidentiality terms, test only",confidentiality_version:"conf-v1",
  deliverable:"Synthetic report",deadline:"Within 24 hours"};
 const hash=Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(valid.capability))),x=>x.toString(16).padStart(2,"0")).join("");
 let accepted=null,insertions=0;
 const db={prepare(sql){
  return {bind(...args){return {
   async first(){
    if(sql.includes("FROM service_orders WHERE id = ?")&&sql.includes("capability_hash"))
     return {id:orderId,service_code:"one-question-review",amount_minor:5000,currency:"USD",status:"pending",capability_hash:hash};
    if(sql.includes("FROM order_document_sources WHERE order_id = ? AND terms_digest = ?"))
     return source;
    if(sql.includes("FROM order_document_sources WHERE order_id = ?"))return source;
    if(sql.includes("FROM order_terms_acceptances WHERE order_id = ?"))return accepted;
    throw Error("Unexpected query "+sql);
   },
   async run(){
    assert.match(sql,/^INSERT OR IGNORE INTO order_terms_acceptances/);
    insertions++;
    if(accepted)return {success:true,meta:{changes:0}};
    accepted={service_code:args[1],amount_minor:args[2],currency:args[3],scope_digest:args[4],
      terms_digest:args[5],deliverable:args[6],deadline:args[7],quote_id:args[8],
      offer_version:args[9],offer_digest:args[10],offer_accepted_at:args[11],
      confidentiality_version:args[12],confidentiality_digest:args[13],
      confidentiality_accepted_at:args[14]};
    return {success:true,meta:{changes:1}};
   }
  }}};
 }};
 const env={DB:db};
 const first=await handleOrderConsent(req({...valid,termsDigest:digest}),env);
 assert.equal(first.status,201);
 assert.deepEqual(await first.json(),{recorded:true,eligible:true});
 assert.equal(insertions,1);
 assert.equal(accepted.offer_accepted_at,accepted.confidentiality_accepted_at);
 assert.ok(Number.isFinite(Date.parse(accepted.offer_accepted_at)));
 const second=await handleOrderConsent(req({...valid,termsDigest:digest}),env);
 assert.equal(second.status,503);
 assert.equal(insertions,2);
});
test("tampered canonical source fails before recording consent",async()=>{
 const digest="b".repeat(64);
 const hash=Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(valid.capability))),x=>x.toString(16).padStart(2,"0")).join("");
 let inserts=0;
 const db={prepare(sql){return {bind(){return {
  async first(){
   if(sql.includes("capability_hash"))return {id:valid.orderId,service_code:"one-question-review",amount_minor:5000,currency:"USD",status:"pending",capability_hash:hash};
   if(sql.includes("FROM order_document_sources"))return {terms_digest:digest,terms_version:"v1",scope_text:"tampered",offer_text:"offer",offer_version:"v1",confidentiality_text:"conf",confidentiality_version:"v1",deliverable:"report",deadline:"24h"};
   throw Error("Unexpected read");
  },
  async run(){inserts++;throw Error("must not write");}
 }}}}};
 const result=await handleOrderConsent(req(valid),{DB:db});
 assert.equal(result.status,409);
 assert.equal(inserts,0);
});
