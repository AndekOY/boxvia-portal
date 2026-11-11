import assert from "node:assert/strict";
import test from "node:test";
import { handleServiceRequest } from "./service-request.js";
import sandbox from "./service-request-sandbox-worker.js";

const endpoint = "https://boxvia-service-request-sandbox.example/api/service-request";
const base = {
  service: "technical-pilot",
  email: "example@example.org",
  system: "Synthetic agent",
  scenario: "Test a synthetic state transition",
  expected: "Unauthorized execution is rejected",
  public_material_confirmation: "yes",
  terms_acknowledgement: "yes",
  "cf-turnstile-response": "synthetic-token"
};
function request(body, origin = new URL(endpoint).origin) {
  return new Request(endpoint, { method: "POST", headers: {
    Origin: origin, "Content-Type": "application/json"
  }, body: JSON.stringify(body) });
}
test("rejects missing legal confirmation before D1 or Turnstile", async () => {
  const response = await handleServiceRequest(request({ ...base, terms_acknowledgement: "" }), {}, new URL(endpoint));
  assert.equal(response.status, 400);
});
test("rejects foreign origin", async () => {
  const response = await handleServiceRequest(request(base, "https://evil.example"), {}, new URL(endpoint));
  assert.equal(response.status, 403);
});
test("fails closed without configured Turnstile and D1", async () => {
  const response = await handleServiceRequest(request(base), {}, new URL(endpoint));
  assert.equal(response.status, 503);
});
test("stores verified request without sending email", async () => {
  const originalFetch = globalThis.fetch;
  const saved = [];
  globalThis.fetch = async (url) => {
    assert.equal(url, "https://challenges.cloudflare.com/turnstile/v0/siteverify");
    return Response.json({ success: true, hostname: new URL(endpoint).hostname, action: "service-request" });
  };
  try {
    const env = {
      TURNSTILE_SECRET_KEY: "synthetic-secret",
      DB: { prepare(sql) {
        assert.match(sql, /INSERT INTO service_requests/);
        return { bind(...values) {
          saved.push(values);
          return { async run() { return { success: true, meta: { last_row_id: 42 } }; } };
        } };
      } }
    };
    const response = await handleServiceRequest(request(base), env, new URL(endpoint));
    assert.equal(response.status, 201);
    assert.deepEqual(await response.json(), { received: true, request_id: 42 });
    assert.equal(saved.length, 1);
    assert.equal(saved[0][0], "technical-pilot");
    assert.equal(saved[0][2], "example@example.org");
  } finally { globalThis.fetch = originalFetch; }
});
test("sandbox exposes no PayPal or email API", async () => {
  for (const path of ["/api/paypal/create-order", "/api/paypal/capture-order", "/api/email/send"]) {
    const response = await sandbox.fetch(new Request(new URL(path, endpoint)), {});
    assert.equal(response.status, 404);
  }
});
