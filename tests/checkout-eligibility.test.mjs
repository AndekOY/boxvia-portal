import test from "node:test";
import assert from "node:assert/strict";
import { evaluateCheckoutEligibility as check } from "../cloudflare/checkout-eligibility.mjs";
const h="a".repeat(64),t="b".repeat(64),d="c".repeat(64);
const base=(code,amount,quote=null)=>({
 serviceCode:code,
 finalTerms:{serviceCode:code,scopeDigest:h,termsDigest:t,deliverable:"Written assessment",deadline:"3 business days",status:"confirmed",amountMinor:amount,currency:"USD"},
 offerAcceptance:{accepted:true,documentDigest:d,documentVersion:"v1",acceptedAt:"2026-11-21T10:00:00Z",termsDigest:t},
 confidentialityAcceptance:{accepted:true,documentDigest:d,documentVersion:"v1",acceptedAt:"2026-11-21T10:00:00Z",termsDigest:t},
 acceptedQuote:quote
});
test("both fixed $50 services require offer and confidentiality consent",()=>{
 for(const code of ["one-question-review","ai-governance-review"]){
  const x=base(code,5000);
  assert.equal(check(x).eligible,true);
  assert.equal(check({...x,offerAcceptance:null}).eligible,false);
  assert.equal(check({...x,confidentialityAcceptance:null}).eligible,false);
  assert.equal(check({...x,finalTerms:{...x.finalTerms,status:"proposed"}}).eligible,false);
  assert.equal(check({...x,finalTerms:{...x.finalTerms,amountMinor:1}}).eligible,false);
 }
});
test("all four from-price services require server accepted quote and same consent",()=>{
 for(const [code,minimum] of [["pre-decision-review",20000],["technical-pilot",25000],["faar-stage-1",25000],["ai-governance-gap-assessment",30000]]){
  const quote={serviceCode:code,amountMinor:minimum+10000,currency:"USD",status:"accepted",scopeDigest:h};
  const x=base(code,minimum+10000,quote);
  assert.equal(check(x).eligible,true);
  assert.equal(check({...x,acceptedQuote:null}).eligible,false);
  assert.equal(check({...x,offerAcceptance:{...x.offerAcceptance,accepted:false}}).eligible,false);
  assert.equal(check({...x,confidentialityAcceptance:{...x.confidentialityAcceptance,termsDigest:"x"}}).eligible,false);
  assert.equal(check({...x,acceptedQuote:{...quote,scopeDigest:"e".repeat(64)}}).eligible,false);
 }
});
