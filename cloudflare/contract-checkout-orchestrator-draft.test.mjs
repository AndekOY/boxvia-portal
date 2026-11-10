import assert from "node:assert/strict";
import { acceptOneTimeCheckoutDraft } from "./contract-checkout-orchestrator-draft.js";
import { hashTrustedCatalogDraft } from "./contract-checkout-session-draft.js";
const token="a".repeat(64), sessionId="BXC_"+"b".repeat(64), acceptedAt="2026-11-10T12:00:00.000Z";
const sha=async s=>[...new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s)))].map(x=>x.toString(16).padStart(2,"0")).join("");
const catalog={productId:"check-a-claim",productVersion:"v1",exactScope:"Review one public claim",termsVersion:"v1",scheduleVersion:"v1",providerName:"BoxVia",providerAddress:"Poland",providerContact:"contact@example.test",totalPrice:"20.00",currency:"USD",taxDisclosure:"Tax included",deliveryRule:"Within 24 hours",reportLanguage:"English",deliveryChannel:"Email",acceptedDocuments:["terms","schedule","withdrawal"].map(id=>({id,version:"v1",sha256:"a".repeat(64)}))};
const consent={affirmative:true,termsAccepted:true,scheduleAccepted:true,withdrawalNoticeAcknowledged:true,privacyNoticeAcknowledged:true};
const catalogHash=await hashTrustedCatalogDraft(catalog);
let session={status:"open",catalogHash}, archived=null;
const db={prepare(sql){return{bind(...p){return{
 async first(){
  if(sql.includes("FROM claim_access"))return{token_hash:await sha(token)};
  if(sql.includes("FROM claims"))return{id:42,customer_email:"customer@example.test",payment_status:"pending"};
  if(sql.includes("FROM contract_acceptance_archive"))return archived;
  return null;
 },
 async run(){
  if(sql.startsWith("UPDATE contract_checkout_sessions SET status = 'consuming'")){
   if(session.status!=="open"||p[0]!==sessionId||p[1]!==42||p[2]!=="customer@example.test"||p[3]!==session.catalogHash)return{meta:{changes:0}};
   session.status="consuming";return{meta:{changes:1}};
  }
  if(sql.startsWith("INSERT OR IGNORE INTO contract_acceptance_archive")){
   if(!archived)archived={snapshot_json:p[1],snapshot_sha256:p[2],acceptance_evidence_json:p[3],acceptance_evidence_sha256:p[4]};
   return{success:true};
  }
  if(sql.startsWith("UPDATE contract_checkout_sessions SET status = 'accepted'")){
   if(session.status!=="consuming"||!archived||p[0]!==archived.snapshot_sha256)return{meta:{changes:0}};
   session.status="accepted";return{meta:{changes:1}};
  }
  throw Error("Unexpected SQL: "+sql);
 }
};}};}};
const input={db,claimId:42,accessToken:token,checkoutSessionId:sessionId,consent,catalog,now:()=>acceptedAt};
const result=await acceptOneTimeCheckoutDraft(input);
assert.equal(result.status,"accepted");
assert.equal(session.status,"accepted");
assert.match(result.snapshotSha256,/^[a-f0-9]{64}$/);
await assert.rejects(acceptOneTimeCheckoutDraft(input),/unavailable, expired or consumed/);
session={status:"open",catalogHash};archived=null;
await assert.rejects(acceptOneTimeCheckoutDraft({...input,consent:{...consent,affirmative:false}}),/acknowledgements/);
assert.equal(session.status,"consuming");
await assert.rejects(acceptOneTimeCheckoutDraft(input),/unavailable, expired or consumed/);
console.log("One-time checkout orchestrator draft tests passed");
