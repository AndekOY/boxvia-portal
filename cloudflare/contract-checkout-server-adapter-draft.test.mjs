import assert from "node:assert/strict";
import { verifyClaimCapabilityDraft, acceptCheckoutOnServerDraft } from "./contract-checkout-server-adapter-draft.js";
const token = "a".repeat(64);
const digest = async text => [...new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)))].map(x=>x.toString(16).padStart(2,"0")).join("");
const rows = new Map();
const db = { prepare(sql) { return { bind(...p) { return {
  async first() {
    if (sql.includes("FROM claim_access")) return { token_hash: await digest(token) };
    if (sql.includes("FROM claims")) return { id: 42, customer_email: "customer@example.test" };
    return rows.get(p[0]) || null;
  },
  async run() {
    if (!sql.includes("INSERT OR IGNORE INTO contract_acceptance_archive")) throw Error("Unexpected SQL");
    if (!rows.has(p[0])) rows.set(p[0], { snapshot_json:p[1], snapshot_sha256:p[2],
      acceptance_evidence_json:p[3], acceptance_evidence_sha256:p[4] });
    return { success:true };
  }
}; } }; } };
assert.equal(await verifyClaimCapabilityDraft(db,42,token),true);
assert.equal(await verifyClaimCapabilityDraft(db,42,"b".repeat(64)),false);
assert.equal(await verifyClaimCapabilityDraft(db,42,"invalid"),false);
const catalog = {
  productId:"check-a-claim", productVersion:"v1", exactScope:"Review one public claim",
  termsVersion:"v1", scheduleVersion:"v1", providerName:"BoxVia",
  providerAddress:"Poland", providerContact:"contact@example.test",
  totalPrice:"20.00", currency:"USD", taxDisclosure:"Tax included",
  deliveryRule:"Within 24 hours", reportLanguage:"English", deliveryChannel:"Email",
  acceptedDocuments:["terms","schedule","withdrawal"].map(id=>({id,version:"v1",sha256:"a".repeat(64)}))
};
const consent = { affirmative:true, termsAccepted:true, scheduleAccepted:true,
  withdrawalNoticeAcknowledged:true, privacyNoticeAcknowledged:true };
const input = {db,claimId:42,accessToken:token,checkoutSessionId:"BXCORDER123",
  catalog,consent,now:()=>"2026-11-10T12:00:00.000Z"};
const first = await acceptCheckoutOnServerDraft(input);
assert.equal(first.status,"accepted_archived");
assert.equal((await acceptCheckoutOnServerDraft(input)).snapshotSha256,first.snapshotSha256);
await assert.rejects(acceptCheckoutOnServerDraft({...input,accessToken:"b".repeat(64)}),/capability not verified/);
await assert.rejects(acceptCheckoutOnServerDraft({...input,catalog:{...catalog,totalPrice:"1.00"}}),/Unsupported trusted checkout catalog/);
await assert.rejects(acceptCheckoutOnServerDraft({...input,consent:{...consent,affirmative:false}}),/acknowledgements/);
await assert.rejects(acceptCheckoutOnServerDraft({...input,catalog:{...catalog,exactScope:"Altered scope"}}),/Immutable checkout acceptance conflict/);
assert.equal(rows.size,1);
console.log("Trusted checkout adapter draft tests passed");
