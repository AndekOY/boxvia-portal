import test from "node:test";
import assert from "node:assert/strict";
import { handleServiceRequest } from "../cloudflare/service-request.js";

const origin = "https://boxvia.andeks.workers.dev";
const url = new URL(origin + "/api/service-request");
const body = () => ({
  service: "technical-pilot",
  email: "test@example.org",
  system: "Synthetic runtime",
  scenario: "Verify one deterministic scenario",
  expected: "One bounded observation",
  review_format: "not-sure",
  public_material_confirmation: "yes",
  terms_acknowledgement: "yes",
  "cf-turnstile-response": "test-token",
  request_key: "123e4567-e89b-42d3-a456-426614174000"
});
function request(data, headers = {}) {
  return new Request(url, {
    method: "POST",
    headers: { Origin: origin, "Content-Type": "application/json", ...headers },
    body: JSON.stringify(data)
  });
}
function db(state) {
  state.keys ||= new Map();
  return { prepare(sql) {
    if (sql.startsWith("INSERT OR IGNORE INTO service_requests")) {
      return { bind(...values) {
        return { async run() {
          const key = values[4], digest = values[5];
          if (state.keys.has(key)) return { success: true, meta: { changes: 0 } };
          state.rows.push(values);
          state.keys.set(key, { id: state.rows.length, request_digest: digest });
          return { success: true, meta: { changes: 1, last_row_id: state.rows.length } };
        } };
      } };
    }
    if (sql.startsWith("SELECT id, request_digest FROM service_requests")) {
      return { bind(key) { return { async first() { return state.keys.get(key) || null; } }; } };
    }
    throw new Error("Unexpected SQL: " + sql);
  } };
}
async function withTurnstile(verify, run) {
  const original = globalThis.fetch;
  globalThis.fetch = async () => Response.json(verify);
  try { await run(); } finally { globalThis.fetch = original; }
}
test("valid service request is stored once and returns ID", async () => {
  const state = { rows: [] };
  await withTurnstile({ success: true, hostname: url.hostname, action: "service-request" }, async () => {
    const response = await handleServiceRequest(request(body()), { DB: db(state), TURNSTILE_SECRET_KEY: "test-secret" }, url);
    assert.equal(response.status, 201);
    assert.deepEqual(await response.json(), { received: true, id: 1 });
    assert.equal(state.rows[0][0], "technical-pilot");
    assert.equal(state.rows[0][1], "Technical Pilot");
    assert.equal(state.rows[0][2], "test@example.org");
    assert.match(JSON.parse(state.rows[0][3]).summary, /Synthetic runtime/);
    assert.doesNotMatch(state.rows[0][3], /test-token/);
  });
});
test("missing acknowledgement fails before persistence", async () => {
  const state = { rows: [] };
  const input = body(); delete input.terms_acknowledgement;
  const response = await handleServiceRequest(request(input), { DB: db(state), TURNSTILE_SECRET_KEY: "test-secret" }, url);
  assert.equal(response.status, 400);
  assert.equal(state.rows.length, 0);
});
test("invalid origin fails", async () => {
  const response = await handleServiceRequest(request(body(), { Origin: "https://example.org" }), {}, url);
  assert.equal(response.status, 403);
});
test("invalid Turnstile action fails before persistence", async () => {
  const state = { rows: [] };
  await withTurnstile({ success: true, hostname: url.hostname, action: "other" }, async () => {
    const response = await handleServiceRequest(request(body()), { DB: db(state), TURNSTILE_SECRET_KEY: "test-secret" }, url);
    assert.equal(response.status, 400);
    assert.equal(state.rows.length, 0);
  });
});
test("missing D1 fails closed", async () => {
  const response = await handleServiceRequest(request(body()), { TURNSTILE_SECRET_KEY: "test-secret" }, url);
  assert.equal(response.status, 503);
});

const cases = [
  ["one-question-review", { question: "What is the commercial boundary?" }],
  ["ai-governance-review", { question: "Which approval is required?", control: "Approval policy" }],
  ["technical-pilot", { system: "Synthetic runtime", scenario: "Run a deterministic case", expected: "One result" }],
  ["pre-decision-review", { decision: "Whether to adopt the system" }],
  ["ai-governance-gap-assessment", { system: "Synthetic AI service", requirements: "One stated requirement" }],
  ["faar-stage-1", { project: "Synthetic cross-border project" }]
];
for (const [service, fields] of cases) {
  test("D1 accepts " + service, async () => {
    const state = { rows: [] };
    await withTurnstile({ success: true, hostname: url.hostname, action: "service-request" }, async () => {
      const response = await handleServiceRequest(request({ ...body(), ...fields, service }), {
        DB: db(state), TURNSTILE_SECRET_KEY: "test-secret"
      }, url);
      assert.equal(response.status, 201);
      assert.equal(state.rows.length, 1);
      assert.equal(state.rows[0][0], service);
    });
  });
}
test("D1 write failure does not report successful receipt", async () => {
  const broken = { prepare() { return { bind() { return { async run() { throw new Error("D1 unavailable"); } }; } }; } };
  await withTurnstile({ success: true, hostname: url.hostname, action: "service-request" }, async () => {
    const response = await handleServiceRequest(request(body()), { DB: broken, TURNSTILE_SECRET_KEY: "test-secret" }, url);
    assert.equal(response.status, 503);
  });
});

test("Turnstile invalid-input-secret fails closed without D1 write", async () => {
  const state = { rows: [] };
  const original = globalThis.fetch;
  globalThis.fetch = async () => Response.json(
    { success: false, "error-codes": ["invalid-input-secret"] }, { status: 400 }
  );
  try {
    const response = await handleServiceRequest(request(body()), {
      DB: db(state), TURNSTILE_SECRET_KEY: "synthetic-invalid-secret"
    }, url);
    assert.equal(response.status, 503);
    assert.equal(state.rows.length, 0);
  } finally { globalThis.fetch = original; }
});
test("Turnstile expired token fails closed without D1 write", async () => {
  const state = { rows: [] };
  await withTurnstile({ success: false, "error-codes": ["timeout-or-duplicate"] }, async () => {
    const response = await handleServiceRequest(request(body()), {
      DB: db(state), TURNSTILE_SECRET_KEY: "synthetic-secret"
    }, url);
    assert.equal(response.status, 400);
    assert.equal(state.rows.length, 0);
  });
});
test("Turnstile valid response for wrong Preview hostname cannot write to D1", async () => {
  const state = { rows: [] };
  await withTurnstile({
    success: true, hostname: "boxvia.andeks.workers.dev", action: "service-request"
  }, async () => {
    const previewUrl = new URL("https://boxvia-service-preview.andeks.workers.dev/api/service-request");
    const previewRequest = new Request(previewUrl, { method: "POST", headers: { Origin: previewUrl.origin, "Content-Type": "application/json" }, body: JSON.stringify(body()) });
    const response = await handleServiceRequest(previewRequest, {
      DB: db(state), TURNSTILE_SECRET_KEY: "synthetic-secret"
    }, previewUrl);
    assert.equal(response.status, 400);
    assert.equal(state.rows.length, 0);
  });
});

const previewUrlForDiagnostics = new URL("https://boxvia-service-preview.andeks.workers.dev/api/service-request");
function previewRequestForDiagnostics(data = body()) {
  return new Request(previewUrlForDiagnostics, {
    method: "POST",
    headers: { Origin: previewUrlForDiagnostics.origin, "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
}
async function assertPreview503(response, expectedCode) {
  assert.equal(response.status, 503);
  const result = await response.json();
  assert.equal(result.diagnostic_code, expectedCode);
  assert.equal(result.diagnostic_version, "preview-intake-diag-v2-20261112");
  assert.equal(typeof result.error, "string");
}
test("Preview missing configuration returns classified 503", async () => {
  await assertPreview503(
    await handleServiceRequest(previewRequestForDiagnostics(), {}, previewUrlForDiagnostics),
    "CONFIG_MISSING"
  );
});
test("Preview Siteverify HTTP failure returns classified 503", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => Response.json(
    { success: false, "error-codes": ["invalid-input-secret"] }, { status: 400 }
  );
  try {
    await assertPreview503(
      await handleServiceRequest(previewRequestForDiagnostics(), {
        DB: db({ rows: [] }), TURNSTILE_SECRET_KEY: "synthetic-secret"
      }, previewUrlForDiagnostics),
      "TURNSTILE_SECRET_REJECTED"
    );
  } finally { globalThis.fetch = original; }
});
test("Preview unconfirmed D1 insert returns classified 503", async () => {
  const database = { prepare() { return { bind() { return { async run() {
    return { success: false, meta: {} };
  } }; } }; } };
  await withTurnstile({ success: true, hostname: previewUrlForDiagnostics.hostname, action: "service-request" }, async () => {
    await assertPreview503(
      await handleServiceRequest(previewRequestForDiagnostics(), {
        DB: database, TURNSTILE_SECRET_KEY: "synthetic-secret"
      }, previewUrlForDiagnostics),
      "D1_INSERT_FAILED"
    );
  });
});
test("Preview D1 exception returns classified 503", async () => {
  const database = { prepare() { throw new Error("synthetic D1 exception"); } };
  await withTurnstile({ success: true, hostname: previewUrlForDiagnostics.hostname, action: "service-request" }, async () => {
    await assertPreview503(
      await handleServiceRequest(previewRequestForDiagnostics(), {
        DB: database, TURNSTILE_SECRET_KEY: "synthetic-secret"
      }, previewUrlForDiagnostics),
      "PROCESSING_EXCEPTION"
    );
  });
});
test("Production 503 does not expose Preview diagnostics", async () => {
  const response = await handleServiceRequest(request(body()), {}, url);
  assert.equal(response.status, 503);
  const result = await response.json();
  assert.equal(Object.hasOwn(result, "diagnostic_code"), false);
  assert.equal(Object.hasOwn(result, "diagnostic_version"), false);
});

test("same request UUID and payload creates only one row", async () => {
  const state = { rows: [] }, database = db(state);
  await withTurnstile({ success: true, hostname: url.hostname, action: "service-request" }, async () => {
    const first = await handleServiceRequest(request(body()), { DB: database, TURNSTILE_SECRET_KEY: "synthetic" }, url);
    const second = await handleServiceRequest(request(body()), { DB: database, TURNSTILE_SECRET_KEY: "synthetic" }, url);
    assert.equal(first.status, 201);
    assert.equal(second.status, 200);
    assert.deepEqual(await first.json(), await second.json());
    assert.equal(state.rows.length, 1);
  });
});
test("same request UUID with changed payload is rejected", async () => {
  const state = { rows: [] }, database = db(state);
  await withTurnstile({ success: true, hostname: url.hostname, action: "service-request" }, async () => {
    const first = await handleServiceRequest(request(body()), { DB: database, TURNSTILE_SECRET_KEY: "synthetic" }, url);
    const changed = { ...body(), scenario: "Different scenario" };
    const second = await handleServiceRequest(request(changed), { DB: database, TURNSTILE_SECRET_KEY: "synthetic" }, url);
    assert.equal(first.status, 201);
    assert.equal(second.status, 409);
    assert.equal(state.rows.length, 1);
  });
});
test("missing or malformed request UUID is rejected before Turnstile", async () => {
  const state = { rows: [] };
  const invalid = { ...body(), request_key: "not-a-uuid" };
  const response = await handleServiceRequest(request(invalid), { DB: db(state), TURNSTILE_SECRET_KEY: "synthetic" }, url);
  assert.equal(response.status, 400);
  assert.equal(state.rows.length, 0);
});

test("Preview retries with distinct valid Turnstile tokens preserve the same request ID", async () => {
  const state = { rows: [] }, database = db(state);
  const tokens = [];
  const original = globalThis.fetch;
  globalThis.fetch = async (_endpoint, options) => {
    const params = new URLSearchParams(options.body);
    tokens.push(params.get("response"));
    return Response.json({
      success: true,
      hostname: previewUrlForDiagnostics.hostname,
      action: "service-request"
    });
  };
  try {
    const firstData = { ...body(), "cf-turnstile-response": "valid-token-first" };
    const secondData = { ...body(), "cf-turnstile-response": "valid-token-second" };
    const env = { DB: database, TURNSTILE_SECRET_KEY: "synthetic-secret" };
    const first = await handleServiceRequest(previewRequestForDiagnostics(firstData), env, previewUrlForDiagnostics);
    const second = await handleServiceRequest(previewRequestForDiagnostics(secondData), env, previewUrlForDiagnostics);
    assert.equal(first.status, 201);
    assert.equal(second.status, 200);
    assert.deepEqual(await second.json(), await first.json());
    assert.deepEqual(tokens, ["valid-token-first", "valid-token-second"]);
    assert.equal(state.rows.length, 1);
    assert.equal(state.keys.size, 1);
  } finally {
    globalThis.fetch = original;
  }
});
