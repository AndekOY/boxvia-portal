import test from "node:test";
import assert from "node:assert/strict";
import {recordAcceptedTerms} from "../cloudflare/order-terms-recording.mjs";

const digest="a".repeat(64);
const orderId="synthetic-terms-order";
const services=["one-question-review","ai-governance-review"];
function evidence(serviceCode){
 return {
  finalTerms:{serviceCode,amountMinor:5000,currency:"USD",scopeDigest:digest,termsDigest:digest,deliverable:"Independent report",deadline:"24 hours",status:"confirmed"},
  offerAcceptance:{accepted:true,documentVersion:"v1",documentDigest:digest,acceptedAt:"2026-11-21T10:00:00Z",termsDigest:digest},
  confidentialityAcceptance:{accepted:true,documentVersion:"v1",documentDigest:digest,acceptedAt:"2026-11-21T10:01:00Z",termsDigest:digest}
 };
}
function mockDb({changes=1}={}){
 const state={writes:0,sql:"",args:[]};
 const db={prepare(sql){state.sql=sql;return {bind(...args){state.args=args;return {async run(){state.writes++;return {success:true,meta:{changes}};}};}};}};
 return {db,state};
}
for(const serviceCode of services){
 const order={orderId,serviceCode,amountMinor:5000,currency:"USD",status:"pending"};
 test(serviceCode+": both affirmative acceptances persist once with server price and pending-order constraint",async()=>{
  const {db,state}=mockDb();
  assert.deepEqual(await recordAcceptedTerms(db,order,evidence(serviceCode)),{recorded:true});
  assert.equal(state.writes,1);
  assert.match(state.sql,/INSERT OR IGNORE INTO order_terms_acceptances/);
  assert.match(state.sql,/status = 'pending'/);
  assert.deepEqual(state.args.slice(0,4),[orderId,serviceCode,5000,"USD"]);
  assert.deepEqual(state.args.slice(-4),[orderId,serviceCode,5000,"USD"]);
 });
 test(serviceCode+": missing or negative consent never writes",async()=>{
  for(const key of ["offerAcceptance","confidentialityAcceptance"]){
   const {db,state}=mockDb();
   const input=evidence(serviceCode);
   input[key].accepted=false;
   await assert.rejects(recordAcceptedTerms(db,order,input),/Explicit acceptance required/);
   assert.equal(state.writes,0);
  }
 });
 test(serviceCode+": altered price, service, status or digest never writes",async()=>{
  for(const [candidate,input] of [
   [{...order,amountMinor:4999},evidence(serviceCode)],
   [order,{...evidence(serviceCode),finalTerms:{...evidence(serviceCode).finalTerms,serviceCode:"other"}}],
   [{...order,status:"paid"},evidence(serviceCode)],
   [order,{...evidence(serviceCode),offerAcceptance:{...evidence(serviceCode).offerAcceptance,termsDigest:"b".repeat(64)}}]
  ]){
   const {db,state}=mockDb();
   await assert.rejects(recordAcceptedTerms(db,candidate,input));
   assert.equal(state.writes,0);
  }
 });
 test(serviceCode+": duplicate consent cannot be recorded again",async()=>{
  const {db,state}=mockDb({changes:0});
  await assert.rejects(recordAcceptedTerms(db,order,evidence(serviceCode)),/already recorded or order unavailable/);
  assert.equal(state.writes,1);
 });
}
