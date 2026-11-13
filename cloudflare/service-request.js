const services = new Map([
  ["one-question-review", ["One Question Review", [
    ["question","What business question should we review?",1200,true],
    ["context","What is the context for this question?",1200,false],
    ["materials","What materials are available?",1200,false]
  ]]],
  ["ai-governance-review", ["Focused AI Governance Review", [
    ["question","What question should we review?",1200,true],
    ["control","Which AI policy, approval role or control does it concern?",1200,true],
    ["materials","What materials are available?",1200,false]
  ]]],
  ["technical-pilot", ["Technical Pilot", [
    ["system","System or framework name",200,true],
    ["version","Version or commit, if known",160,false],
    ["scenario","What single scenario should we run?",1200,true],
    ["expected","What behavior do you expect to observe?",1200,true],
    ["materials","What materials are available?",1200,false]
  ]]],
  ["pre-decision-review", ["Independent Pre-Decision Review", [
    ["decision","What decision are you about to make?",1200,true],
    ["options","Which options or assumptions should we examine?",1200,false],
    ["materials","What evidence is available?",1200,false]
  ]]],
  ["ai-governance-gap-assessment", ["AI Governance & Compliance Gap Assessment", [
    ["system","Which AI system or process should we assess?",1200,true],
    ["requirements","Which requirements should we compare the controls against?",1200,true],
    ["materials","What controls and evidence can you describe?",1200,false]
  ]]],
  ["faar-stage-1", ["FAAR Stage 1", [
    ["project","What project are you planning?",1200,true],
    ["workstreams","Which activities or services are you considering?",1200,false],
    ["uncertainties","What remains unclear about the project?",1200,false],
    ["materials","What project materials are available?",1200,false]
  ]]]
]);

const json = (data, status = 200) => Response.json(data, {
  status,
  headers: { "Cache-Control": "no-store" }
});

async function readSubmission(request) {
  if (!request.body) return null;
  const reader = request.body.getReader();
  const buffer = new Uint8Array(24576);
  let length = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (length + value.length > buffer.length) {
      await reader.cancel();
      return null;
    }
    buffer.set(value, length);
    length += value.length;
  }
  return JSON.parse(new TextDecoder().decode(buffer.subarray(0, length)));
}

export async function handleServiceRequest(request, env, url) {
  if (request.headers.get("Origin") !== url.origin) return json({ error: "Request origin rejected." }, 403);
  if (request.headers.get("Content-Type")?.split(";")[0].trim().toLowerCase() !== "application/json") {
    return json({ error: "Please submit from the service form." }, 415);
  }

  let data;
  try {
    data = await readSubmission(request);
  } catch {
    return json({ error: "Please check your request and try again." }, 400);
  }

  const service = services.get(data?.service);
  const email = typeof data?.email === "string" ? data.email.trim() : "";
  const token = data?.["cf-turnstile-response"];
  const requestKey = data?.request_key;
  if (typeof requestKey !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestKey)) {
    return json({ error: "Please reload the form and try again." }, 400);
  }
  if (!service || email.length > 254 || !/^[^\s@,<>]+@[^\s@,<>]+\.[^\s@,<>]+$/.test(email) ||
      typeof token !== "string" || !token || token.length > 2048) {
    return json({ error: "Please check your email address and complete the security check." }, 400);
  }

  if (data.public_material_confirmation !== "yes" || data.terms_acknowledgement !== "yes") {
    return json({ error: "Please confirm the required statements." }, 400);
  }

  const [title, fields] = service;
  const lines = ["Service: " + title, "Customer email: " + email];
  for (const [name, label, max, required] of fields) {
    const value = typeof data[name] === "string" ? data[name].trim() : "";
    if ((required && !value) || value.length > max) {
      return json({ error: "Please check the required fields and text lengths." }, 400);
    }
    if (value) lines.push(label + "\n" + value);
  }

  if (data.service === "technical-pilot") {
    const reviewFormat = typeof data.review_format === "string" ? data.review_format : "not-sure";
    const labels = {
      "evidence-review": "Evidence Review - existing records",
      "scenario-pilot": "Scenario Pilot - test execution and evidence",
      "not-sure": "Not sure - scope to be determined"
    };
    if (!Object.prototype.hasOwnProperty.call(labels, reviewFormat)) {
      return json({ error: "Please select a valid review format." }, 400);
    }
    lines.push("Requested review format: " + labels[reviewFormat]);
  }

  const unavailable = () => json({ error: "The form is temporarily unavailable, so please try again or contact BoxVia." }, 503);
  if (!env.TURNSTILE_SECRET_KEY || !env.DB) {
    console.error("service_request_config_missing", { turnstile_secret: Boolean(env.TURNSTILE_SECRET_KEY), d1_binding: Boolean(env.DB) });
    return unavailable();
  }

  try {
    const verify = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", "Accept": "application/json" },
      body: new URLSearchParams({ secret: env.TURNSTILE_SECRET_KEY, response: token })
    });
    if (!verify.ok) {
      // Siteverify can return structured diagnostic codes even for non-2xx HTTP responses.
      // Never log the submitted response token, secret, or raw response body.
      let errorCodes = [];
      try {
        const diagnostic = await verify.json();
        if (Array.isArray(diagnostic?.["error-codes"])) {
          errorCodes = diagnostic["error-codes"]
            .filter(code => typeof code === "string" && /^[a-z0-9-]{1,64}$/.test(code))
            .slice(0, 5);
        }
      } catch {
        // Non-JSON error responses must not prevent safe diagnostics.
      }
      const failureKind = errorCodes.includes("invalid-input-secret")
        ? "invalid_secret"
        : errorCodes.includes("missing-input-secret")
          ? "missing_secret"
          : errorCodes.length ? "siteverify_rejected" : "upstream_http_failure";
      console.error("service_request_turnstile_transport_error", {
        failure_kind: failureKind,
        status: verify.status,
        content_type: (verify.headers.get("content-type") || "").slice(0, 80),
        cf_ray_present: Boolean(verify.headers.get("cf-ray")),
        error_codes: errorCodes
      });
      return unavailable();
    }
    const result = await verify.json();
    if (result.success !== true || result.hostname !== url.hostname || result.action !== "service-request") {
      console.warn("service_request_turnstile_rejected", { verified: result.success === true, hostname_matches: result.hostname === url.hostname, action_matches: result.action === "service-request", error_codes: Array.isArray(result["error-codes"]) ? result["error-codes"].filter(code => /^[a-z0-9-]{1,64}$/.test(code)).slice(0, 5) : [] });
      return json({ error: "Please complete the security check again." }, 400);
    }

    // Persist the complete request in D1. No third-party mail dependency.
    // The owner notification endpoint exposes only id and service code.
    // A unique D1 index on request_key provides atomic concurrent deduplication.
    // Bind a digest to the request key to reject accidental key reuse with changed data.
    // The Turnstile token is deliberately excluded from the digest.
    const payload = JSON.stringify({ service: data.service, email, summary: lines.join("\n\n") });
    const digestBytes = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(payload)));
    const requestDigest = Array.from(digestBytes, byte => byte.toString(16).padStart(2, "0")).join("");
    const stored = await env.DB.prepare(
      "INSERT OR IGNORE INTO service_requests (service_code, service_title, customer_email, request_json, status, request_key, request_digest) VALUES (?, ?, ?, ?, 'new', ?, ?)"
    ).bind(data.service, title, email, JSON.stringify({ summary: lines.join("\n\n") }), requestKey, requestDigest).run();
    if (!stored.success) {
      console.error("service_request_d1_insert_unconfirmed");
      return unavailable();
    }
    const record = await env.DB.prepare(
      "SELECT id, request_digest FROM service_requests WHERE request_key = ?"
    ).bind(requestKey).first();
    if (!Number.isSafeInteger(record?.id) || record.id <= 0) {
      console.error("service_request_d1_key_lookup_failed");
      return unavailable();
    }
    if (record.request_digest !== requestDigest) {
      return json({ error: "This request identifier was already used for different details. Please start a new request." }, 409);
    }
    return json({ received: true, id: record.id }, stored.meta?.changes === 1 ? 201 : 200);
  } catch (error) {
    console.error("service_request_processing_exception", { category: error instanceof TypeError ? "type_error" : "runtime_error" });
    return unavailable();
  }
}
