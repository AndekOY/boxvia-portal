// Dedicated staging-only Worker entrypoint. Never import into production worker.js.
// Deploy to a distinct Worker name with no public routes or custom domains.
// Requires BXC_MAIL_SMOKE_TOKEN secret, RESEND_API_KEY secret, CONTRACT_FROM,
// BXC_MAIL_SMOKE_ENABLED=true, BXC_MAIL_SMOKE_RECIPIENT allowlist.
import { sendControlledMailboxTest } from "./contract-test-send-staging.js";
const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
});
const TEST_ID = /^BXC-MAIL-TEST-[A-Za-z0-9_-]{8,48}$/;
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method !== "POST" || url.pathname !== "/internal/mailbox-smoke") {
      return json({ error: "not_found" }, 404);
    }
    if (env.BXC_MAIL_SMOKE_ENABLED !== "true" ||
        env.BXC_MAIL_SMOKE_RECIPIENT !== "andek.oy@gmail.com" ||
        !env.BXC_MAIL_SMOKE_TOKEN || env.BXC_MAIL_SMOKE_TOKEN.length < 32) {
      return json({ error: "disabled" }, 503);
    }
    const authorization = request.headers.get("authorization");
    if (authorization !== "Bearer " + env.BXC_MAIL_SMOKE_TOKEN) {
      return json({ error: "unauthorized" }, 401);
    }
    if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") {
      return json({ error: "invalid_content_type" }, 415);
    }
    let payload;
    try {
      const raw = await request.text();
      if (raw.length > 512) return json({ error: "payload_too_large" }, 413);
      payload = JSON.parse(raw);
    } catch { return json({ error: "invalid_json" }, 400); }
    if (!payload || Object.keys(payload).length !== 1 || !TEST_ID.test(payload.testId || "")) {
      return json({ error: "invalid_test_id" }, 400);
    }
    // Explicit one-shot operator invocation; no background tasks or retries.
    try {
      const result = await sendControlledMailboxTest({ env, testId: payload.testId });
      return json(result);
    } catch {
      // Avoid leaking provider details and credentials to the caller.
      // Uncertain delivery MUST be reconciled before a second invocation.
      return json({ status: "uncertain", instruction: "Check Resend records; do not retry automatically" }, 502);
    }
  }
};
