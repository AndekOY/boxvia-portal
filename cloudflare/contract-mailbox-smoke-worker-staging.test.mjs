import assert from "node:assert/strict";
import worker from "./contract-mailbox-smoke-worker-staging.js";
const env = { BXC_MAIL_SMOKE_ENABLED: "true", BXC_MAIL_SMOKE_RECIPIENT: "andek.oy@gmail.com",
  BXC_MAIL_SMOKE_TOKEN: "x".repeat(40), RESEND_API_KEY: "mock-key", CONTRACT_FROM: "verified@example.test" };
const base = "https://smoke.example.test/internal/mailbox-smoke";
const request = (path = base, method = "POST", token = env.BXC_MAIL_SMOKE_TOKEN,
  body = '{"testId":"BXC-MAIL-TEST-20261110A"}') =>
  new Request(path, { method, headers: { authorization: "Bearer " + token,
    "content-type": "application/json" }, ...(method === "POST" ? { body } : {}) });
const originalFetch = globalThis.fetch;
let sent = 0;
globalThis.fetch = async () => { sent++; return { ok: true, async json() { return { id: "mock-id" }; } }; };
try {
  assert.equal((await worker.fetch(request(base, "GET"), env)).status, 404);
  assert.equal((await worker.fetch(request(base, "POST", "bad"), env)).status, 401);
  assert.equal((await worker.fetch(request(base, "POST", env.BXC_MAIL_SMOKE_TOKEN, "{}"), env)).status, 400);
  assert.equal((await worker.fetch(request(base), { ...env, BXC_MAIL_SMOKE_ENABLED: "false" })).status, 503);
  assert.equal(sent, 0);
  const result = await worker.fetch(request(), env);
  assert.equal(result.status, 200);
  assert.equal((await result.json()).status, "provider_accepted");
  assert.equal(sent, 1);
  globalThis.fetch = async () => { sent++; throw new Error("lost response"); };
  const unknown = await worker.fetch(request(), env);
  assert.equal(unknown.status, 502);
  assert.equal((await unknown.json()).status, "uncertain");
  assert.equal(sent, 2);
  console.log("Dedicated staging mailbox Worker gate tests passed");
} finally { globalThis.fetch = originalFetch; }
