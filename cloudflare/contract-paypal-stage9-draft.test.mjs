// Draft-only Stage 9.5: isolated, no-network PayPal create reservation checks.
// Run: node cloudflare/contract-paypal-stage9-draft.test.mjs
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { reservePayPalCreateDraft, markPayPalAttemptLinkedDraft } from "./contract-paypal-create-attempt-draft.js";

const digest = value => createHash("sha256").update(value).digest("hex");
const sessionId = "BXC_STAGE9_FIXTURE_001";
const claimId = 9001;
const snapshot = { orderId: sessionId, customerEmail: "stage9@example.invalid", acceptedAt: "2026-11-10T16:00:00.000Z", fixture: true };
const snapshotJson = JSON.stringify(snapshot);
const evidence = { source: "server_checkout", checkoutSessionId: sessionId, orderId: sessionId, customerEmail: snapshot.customerEmail, acceptedAt: snapshot.acceptedAt, fixture: true };
const evidenceJson = JSON.stringify(evidence);
const archive = { snapshot_json: snapshotJson, snapshot_sha256: digest(snapshotJson), acceptance_evidence_json: evidenceJson, acceptance_evidence_sha256: digest(evidenceJson) };
assert.equal(digest(archive.snapshot_json), archive.snapshot_sha256);
assert.equal(digest(archive.acceptance_evidence_json), archive.acceptance_evidence_sha256);
const session = { session_id: sessionId, claim_id: claimId, status: "accepted", snapshot_sha256: archive.snapshot_sha256 };
const attempts = new Map();
const links = new Map();
const db = {
  prepare(sql) {
    return {
      bind(...params) {
        return {
          async run() {
            if (sql.startsWith("INSERT OR IGNORE INTO contract_paypal_create_attempts")) {
              const [id, cid, requestId, hash, sid, scid, shash] = params;
              if (attempts.has(id) || id !== sid || cid !== scid || hash !== shash ||
                  session.session_id !== sid || session.claim_id !== scid ||
                  session.status !== "accepted" || session.snapshot_sha256 !== shash)
                return { success: true, meta: { changes: 0 } };
              if ([...attempts.values()].some(a => a.request_id === requestId))
                return { success: true, meta: { changes: 0 } };
              attempts.set(id, { claim_id: cid, request_id: requestId, snapshot_sha256: hash, status: "reserved", paypal_order_id: null });
              return { success: true, meta: { changes: 1 } };
            }
            if (sql.startsWith("UPDATE contract_paypal_create_attempts SET status = 'linked'")) {
              const [orderId, sid, cid, requestId, hash, linkSid, linkCid, linkOrderId, linkHash] = params;
              const a = attempts.get(sid);
              const link = links.get(linkSid);
              if (!a || a.status !== "reserved" || a.paypal_order_id !== null ||
                  a.claim_id !== cid || a.request_id !== requestId || a.snapshot_sha256 !== hash ||
                  !link || link.claim_id !== linkCid || link.paypal_order_id !== linkOrderId ||
                  link.snapshot_sha256 !== linkHash || orderId !== linkOrderId)
                return { meta: { changes: 0 } };
              a.status = "linked";
              a.paypal_order_id = orderId;
              return { meta: { changes: 1 } };
            }
            throw new Error("Unexpected SQL: " + sql);
          },
          async first() {
            if (sql.startsWith("SELECT claim_id,request_id,snapshot_sha256,status,paypal_order_id"))
              return attempts.get(params[0]) ?? null;
            throw new Error("Unexpected SQL: " + sql);
          }
        };
      }
    };
  }
};
const preflight = { checkoutSessionId: sessionId, claimId, snapshotSha256: archive.snapshot_sha256 };
const reservation = await reservePayPalCreateDraft({ db, preflight });
assert.equal(attempts.get(sessionId).status, "reserved");
assert.equal(reservation.requestId, "bxc-" + sessionId);
await assert.rejects(reservePayPalCreateDraft({ db, preflight }), /reconciliation/);
assert.equal(attempts.size, 1, "Duplicate reservation must not create a second attempt");
await assert.rejects(markPayPalAttemptLinkedDraft({ db, reservation, paypalOrderId: "TESTORDER0001" }), /reconciliation/);
assert.equal(attempts.get(sessionId).status, "reserved", "No link means HOLD");
links.set(sessionId, { claim_id: claimId, paypal_order_id: "TESTORDER0001", snapshot_sha256: archive.snapshot_sha256 });
const linked = await markPayPalAttemptLinkedDraft({ db, reservation, paypalOrderId: "TESTORDER0001" });
assert.equal(linked.status, "linked");
assert.equal(attempts.get(sessionId).status, "linked");
await assert.rejects(markPayPalAttemptLinkedDraft({ db, reservation, paypalOrderId: "TESTORDER0001" }), /reconciliation/);
await assert.rejects(reservePayPalCreateDraft({ db, preflight }), /reconciliation/);
assert.equal(attempts.size, 1);
console.log("Stage 9.5 PASS: verified fixture digests; reservation; duplicate blocked; missing link HOLD; linked; replay blocked.");
console.log("Scope: mocked D1 only; no PayPal API, no real acceptance, no Cloudflare D1 writes.");
