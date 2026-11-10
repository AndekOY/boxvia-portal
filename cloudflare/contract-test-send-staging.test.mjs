import assert from "node:assert/strict";
import { sendControlledMailboxTest } from "./contract-test-send-staging.js";
const testId = "BXC-MAIL-TEST-20261110A";
const env = { BXC_MAIL_SMOKE_ENABLED: "true",
  BXC_MAIL_SMOKE_RECIPIENT: "andek.oy@gmail.com",
  RESEND_API_KEY: "mock-only", CONTRACT_FROM: "verified@example.test" };
const originalFetch = globalThis.fetch;
let calls = 0;
globalThis.fetch = async (url, options) => {
  calls++;
  assert.equal(url, "https://api.resend.com/emails");
  const payload = JSON.parse(options.body);
  assert.deepEqual(payload.to, ["andek.oy@gmail.com"]);
  assert.match(payload.subject, /NO CONTRACT/);
  assert.equal(options.headers["Idempotency-Key"], "bxc-mail-smoke-" + testId);
  return { ok: true, async json() { return { id: "mock-resend-id" }; } };
};
try {
  await assert.rejects(sendControlledMailboxTest({ env: { ...env, BXC_MAIL_SMOKE_ENABLED: "false" }, testId }), /gate closed/);
  await assert.rejects(sendControlledMailboxTest({ env, testId, recipient: "other@example.com" }), /gate closed/);
  await assert.rejects(sendControlledMailboxTest({ env, testId: "invalid" }), /gate closed/);
  assert.equal(calls, 0);
  const receipt = await sendControlledMailboxTest({ env, testId });
  assert.equal(receipt.status, "provider_accepted");
  assert.equal(receipt.resendMessageId, "mock-resend-id");
  assert.equal(calls, 1);
  globalThis.fetch = async () => { throw new Error("Simulated lost response"); };
  await assert.rejects(sendControlledMailboxTest({ env, testId }), /Simulated lost response/);
  // No automatic retries are performed inside the function.
  console.log("Controlled Resend mailbox smoke-test mocks passed");
} finally { globalThis.fetch = originalFetch; }
