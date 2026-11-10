import assert from "node:assert/strict";
import {createCheckoutSessionDraft,claimCheckoutAcceptanceDraft,finalizeCheckoutAcceptanceDraft,hashTrustedCatalogDraft} from "./contract-checkout-session-draft.js";
const sessions = new Map(), archive = new Map();
const db = {prepare(sql){return {bind(...p){return {
 async first(){if(sql.includes("FROM claims")) return {id:42,customer_email:"customer@example.test",payment_status:"pending"};return null},
 async run(){
 if(sql.includes("INSERT INTO contract_checkout_sessions")){
  if(sessions.has(p[0])) throw Error("Duplicate session");
  sessions.set(p[0],{claimId:p[1],email:p[2],catalog:p[3],expiresAt:p[4],status:"open"});return {success:true};
 }
 if(sql.includes("status = 'consuming'")){
  const s=sessions.get(p[0]);if(!s||s.claimId!==p[1]||s.email!==p[2]||s.catalog!==p[3]||s.status!=="open"||s.expiresAt<=p[4])return {meta:{changes:0}};
  s.status="consuming";return {meta:{changes:1}};
 }
 if(sql.includes("status = 'accepted'")){
  const s=sessions.get(p[1]);if(!s||s.claimId!==p[2]||s.status!=="consuming"||archive.get(p[3])!==p[4])return {meta:{changes:0}};
  s.status="accepted";s.snapshot=p[0];return {meta:{changes:1}};
 }
 throw Error("Unexpected SQL: "+sql);
 }
};}};}};
const catalogHash=await hashTrustedCatalogDraft({productId:"check-a-claim",version:"v1"});
const created=await createCheckoutSessionDraft({db,claimId:42,accessToken:"ok",verifyClaimCapability:async(_db,_id,t)=>t==="ok",contractCatalogSha256:catalogHash,nowMs:Date.parse("2026-11-10T12:00:00Z"),randomBytes:()=>new Uint8Array(32).fill(7)});
assert.match(created.sessionId,/^BXC_[a-f0-9]{64}$/);
await assert.rejects(createCheckoutSessionDraft({db,claimId:42,accessToken:"bad",verifyClaimCapability:async()=>false,contractCatalogSha256:catalogHash,randomBytes:()=>new Uint8Array(32)}),/capability/);
const args={db,sessionId:created.sessionId,claimId:42,customerEmail:"customer@example.test",contractCatalogSha256:catalogHash,nowIso:"2026-11-10T12:01:00Z"};
await assert.rejects(claimCheckoutAcceptanceDraft({...args,customerEmail:"wrong@example.test"}),/unavailable/);
assert.equal((await claimCheckoutAcceptanceDraft(args)).status,"consuming");
await assert.rejects(claimCheckoutAcceptanceDraft(args),/consumed/);
const hash="f".repeat(64);
await assert.rejects(finalizeCheckoutAcceptanceDraft({db,sessionId:created.sessionId,claimId:42,snapshotSha256:hash}),/requires archived/);
archive.set(created.sessionId,hash);
assert.equal((await finalizeCheckoutAcceptanceDraft({db,sessionId:created.sessionId,claimId:42,snapshotSha256:hash})).status,"accepted");
await assert.rejects(finalizeCheckoutAcceptanceDraft({db,sessionId:created.sessionId,claimId:42,snapshotSha256:hash}),/requires archived/);
console.log("One-time checkout session draft tests passed");
