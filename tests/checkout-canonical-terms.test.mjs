import test from "node:test";
import assert from "node:assert/strict";
import {getCheckoutEligibility} from "../cloudflare/checkout-eligibility-db.mjs";

const id="fe2c77c4-1abd-4ab9-ae1e-c57f0b583a34";
const digest="a".repeat(64);
const order={orderId:id,serviceCode:"one-question-review",amountMinor:5000,currency:"USD",status:"pending"};
const evidence={
 service_code:"one-question-review",amount_minor:5000,currency:"USD",
 scope_digest:digest,terms_digest:digest,deliverable:"A report",deadline:"24h",
 quote_id:null,offer_version:"v1",offer_digest:digest,offer_accepted_at:"2026-11-21T10:00:00Z",
 confidentiality_version:"v1",confidentiality_digest:digest,confidentiality_accepted_at:"2026-11-21T10:00:00Z"
};
function dbWith(source,accepted=evidence){
 return {prepare(sql){return {bind(...args){return {async first(){
  if(sql.includes("FROM order_terms_acceptances"))return accepted;
  if(sql.includes("FROM order_document_sources")){assert.deepEqual(args,[id,digest]);return source;}
  throw new Error("Unexpected DB query: "+sql);
 }}}}}};
}
test("server checkout gate fails closed without accepted consent",async()=>{
 assert.deepEqual(await getCheckoutEligibility(dbWith(null,null),order),{eligible:false,reason:"consent_missing"});
});
test("server checkout gate rejects missing canonical terms",async()=>{
 assert.deepEqual(await getCheckoutEligibility(dbWith(null),order),{eligible:false,reason:"canonical_terms_missing"});
});
test("server checkout gate rejects empty canonical terms and version",async()=>{
 for(const source of [{scope_text:" ",terms_version:"v1"},{scope_text:"Scope",terms_version:" "}])
  assert.deepEqual(await getCheckoutEligibility(dbWith(source),order),{eligible:false,reason:"canonical_terms_missing"});
});
