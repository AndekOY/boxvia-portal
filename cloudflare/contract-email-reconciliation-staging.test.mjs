import assert from "node:assert/strict";
import { reconcileProviderAcceptedStaging } from "./contract-email-reconciliation-staging.js";
const rows = new Map([["BXC-TEST-001", {
  order_id: "BXC-TEST-001", email_status: "sending", resend_message_id: null
}]]);
const db = { prepare(sql) {
  let params = [];
  return {
    bind(...args) { params = args; return this; },
    async first() { return { ...rows.get(params[0]) }; },
    async run() {
      const [message, order] = params, row = rows.get(order);
      if (row?.email_status !== "sending" || row.resend_message_id) return { meta: { changes: 0 } };
      row.email_status = "provider_accepted";
      row.resend_message_id = message;
      return { meta: { changes: 1 } };
    }
  };
}};
const orderId = "BXC-TEST-001", resendMessageId = "mail_12345678";
const evidence = { verified: true, source: "resend_authenticated", orderId,
  resendMessageId, checkedAt: "2026-11-10T12:00:00Z",
  reference: "operator-verified-record-001" };
await assert.rejects(reconcileProviderAcceptedStaging({ db, orderId, resendMessageId,
  evidence: { ...evidence, verified: false } }), /evidence/);
await assert.rejects(reconcileProviderAcceptedStaging({ db, orderId, resendMessageId,
  evidence: { ...evidence, source: "unverified_webhook" } }), /evidence/);
await assert.rejects(reconcileProviderAcceptedStaging({ db, orderId, resendMessageId,
  evidence: { ...evidence, resendMessageId: "mail_other" } }), /evidence/);
assert.equal(rows.get(orderId).email_status, "sending");
assert.equal((await reconcileProviderAcceptedStaging({ db, orderId, resendMessageId, evidence })).status,
  "provider_accepted");
assert.equal((await reconcileProviderAcceptedStaging({ db, orderId, resendMessageId, evidence })).status,
  "already_reconciled");
await assert.rejects(reconcileProviderAcceptedStaging({ db, orderId,
  resendMessageId: "mail_different", evidence: { ...evidence, resendMessageId: "mail_different" }
}), /conflict/);
console.log("Manual Resend reconciliation staging tests passed");
