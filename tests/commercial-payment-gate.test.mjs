import test from "node:test";
import assert from "node:assert/strict";
import {authorizeCommercialPayment} from "../cloudflare/commercial-payment-gate.mjs";
const id="fe2c77c4-1abd-4ab9-ae1e-c57f0b583a34";
const order={orderId:id,serviceCode:"one-question-review",amountMinor:5000,currency:"USD",status:"pending"};
const digest="a".repeat(64);
const accepted={service_code:order.serviceCode,amount_minor:5000,currency:"USD",scope_digest:digest,terms_digest:digest,deliverable:"Report",deadline:"24 hours",quote_id:null,offer_version:"v1",offer_digest:digest,offer_accepted_at:"2026-11-21T10:00:00Z",confidentiality_version:"v1",confidentiality_digest:digest,confidentiality_accepted_at:"2026-11-21T10:00:00Z"};
function db(consent=accepted,source={scope_text:"Confirmed synthetic scope",terms_version:"v1"}){
 return {prepare(sql){return {bind(){return {async first(){
  if(sql.includes("FROM order_terms_acceptances"))return consent;
  if(sql.includes("FROM order_document_sources"))return source;
  throw Error("Unexpected SQL: "+sql);
 }}}}}};
}
test("provider-neutral authorization returns server price for both providers",async()=>{
 for(const provider of ["stripe","paypal"]){
  assert.deepEqual(await authorizeCommercialPayment(db(),order,provider),{authorized:true,provider,orderId:id,amountMinor:5000,currency:"USD",recovery:false});
 }
});
test("both providers fail closed on missing consent and canonical source",async()=>{
 for(const provider of ["stripe","paypal"]){
  assert.deepEqual(await authorizeCommercialPayment(db(null),order,provider),{authorized:false,reason:"consent_missing"});
  assert.deepEqual(await authorizeCommercialPayment(db(accepted,null),order,provider),{authorized:false,reason:"canonical_terms_missing"});
 }
});
test("unsupported providers and invalid order state cannot open checkout",async()=>{
 assert.deepEqual(await authorizeCommercialPayment(db(),order,"other"),{authorized:false,reason:"unsupported_provider"});
 assert.deepEqual(await authorizeCommercialPayment(db(),{...order,status:"paid"},"paypal"),{authorized:false,reason:"invalid_order_status"});
 assert.deepEqual(await authorizeCommercialPayment(db(),{...order,status:"checkout"},"stripe"),{authorized:false,reason:"invalid_order_status"});
 assert.equal((await authorizeCommercialPayment(db(),{...order,status:"checkout"},"stripe",{recovery:true})).authorized,true);
});

test("both fixed-price services require independent canonical consent for Stripe and PayPal",async()=>{
 for(const serviceCode of ["one-question-review","ai-governance-review"]){
  const candidate={...order,serviceCode};
  const matching={...accepted,service_code:serviceCode};
  for(const provider of ["stripe","paypal"]){
   assert.deepEqual(await authorizeCommercialPayment(db(matching),candidate,provider),{
    authorized:true,provider,orderId:id,amountMinor:5000,currency:"USD",recovery:false
   });
   for(const [label,consent,source] of [
    ["missing consent",null,{scope_text:"Scope",terms_version:"v1"}],
    ["wrong service",{...matching,service_code:"one-question-review"===serviceCode?"ai-governance-review":"one-question-review"},{scope_text:"Scope",terms_version:"v1"}],
    ["wrong price",{...matching,amount_minor:4999},{scope_text:"Scope",terms_version:"v1"}],
    ["missing source",matching,null],
    ["blank source",matching,{scope_text:" ",terms_version:"v1"}],
    ["blank version",matching,{scope_text:"Scope",terms_version:" "}],
    ["offer timestamp absent",{...matching,offer_accepted_at:null},{scope_text:"Scope",terms_version:"v1"}],
    ["confidentiality timestamp absent",{...matching,confidentiality_accepted_at:null},{scope_text:"Scope",terms_version:"v1"}]
   ]){
    const result=await authorizeCommercialPayment(db(consent,source),candidate,provider);
    assert.equal(result.authorized,false,serviceCode+" "+provider+" "+label);
   }
  }
 }
});
