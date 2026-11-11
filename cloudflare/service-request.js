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

  if (data?.public_material_confirmation !== "yes" || data?.terms_acknowledgement !== "yes") {
    return json({ error: "Please confirm both required statements." }, 400);
  }

  const service = services.get(data?.service);
  const email = typeof data?.email === "string" ? data.email.trim() : "";
  const token = data?.["cf-turnstile-response"];
  if (!service || email.length > 254 || !/^[^\s@,<>]+@[^\s@,<>]+\.[^\s@,<>]+$/.test(email) ||
      typeof token !== "string" || !token || token.length > 2048) {
    return json({ error: "Please check your email address and complete the security check." }, 400);
  }

  const [title, fields] = service;
  const fieldsData = {};
  for (const [name, label, max, required] of fields) {
    const value = typeof data[name] === "string" ? data[name].trim() : "";
    if ((required && !value) || value.length > max) {
      return json({ error: "Please check the required fields and text lengths." }, 400);
    }
    if (value) fieldsData[name] = value;
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
    fieldsData.review_format = reviewFormat;
  }

  const unavailable = () => json({ error: "The form is temporarily unavailable, so please try again or contact BoxVia." }, 503);
  if (!env.TURNSTILE_SECRET_KEY || !env.DB) {
    return unavailable();
  }

  try {
    const verify = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: new URLSearchParams({ secret: env.TURNSTILE_SECRET_KEY, response: token })
    });
    if (!verify.ok) return unavailable();
    const result = await verify.json();
    if (result.success !== true || result.hostname !== url.hostname || result.action !== "service-request") {
      return json({ error: "Please complete the security check again." }, 400);
    }

    // Store the validated request in D1 for manual owner review. Never email or log its content.
    const stored = await env.DB.prepare(
      "INSERT INTO service_requests (service_code, service_title, customer_email, request_json, status) VALUES (?, ?, ?, ?, 'new')"
    ).bind(data.service, title, email, JSON.stringify(fieldsData)).run();
    if (!stored.success || !stored.meta?.last_row_id) return unavailable();
    return json({ received: true, request_id: stored.meta.last_row_id }, 201);
  } catch {
    return unavailable();
  }
}
