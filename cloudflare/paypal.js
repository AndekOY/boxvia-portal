// BoxVia PayPal Orders integration. Closed by default (PAYPAL_CHECKOUT_ENABLED !== "true").
// The browser never receives PayPal credentials. Request IDs alone are NOT authorization.
const reply = (data, status = 200) => Response.json(data, {
  status, headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" }
});
const enabled = env => env.PAYPAL_CHECKOUT_ENABLED === "true" &&
  !!env.DB && !!env.PAYPAL_CLIENT_ID && !!env.PAYPAL_CLIENT_SECRET;
const baseUrl = env => env.PAYPAL_ENV === "live"
  ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
const idPattern = /^[A-Za-z0-9-]{8,64}$/;
const tokenPattern = /^[a-f0-9]{64}$/;
const hex = bytes => [...new Uint8Array(bytes)].map(v => v.toString(16).padStart(2, "0")).join("");
export const generateAccessToken = () => hex(crypto.getRandomValues(new Uint8Array(32)));
const digest = async value => hex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)));
const validClaimId = value => Number.isSafeInteger(value) && value > 0;
const auth = async (env, claimId, token) => {
  if (!validClaimId(claimId) || typeof token !== "string" || !tokenPattern.test(token)) return false;
  const hash = await digest(token);
  const record = await env.DB.prepare("SELECT token_hash FROM claim_access WHERE claim_id = ?").bind(claimId).first();
  return record?.token_hash === hash;
};
export async function saveClaimAccess(env, claimId, token) {
  const hash = await digest(token);
  const result = await env.DB.prepare("INSERT INTO claim_access (claim_id, token_hash) VALUES (?, ?)").bind(claimId, hash).run();
  if (!result.success) throw new Error("Claim access insert failed");
}
const paypalToken = async env => {
  const basic = btoa(env.PAYPAL_CLIENT_ID + ":" + env.PAYPAL_CLIENT_SECRET);
  const res = await fetch(baseUrl(env) + "/v1/oauth2/token", {
    method: "POST", headers: { Authorization: "Basic " + basic,
      "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials"
  });
  if (!res.ok) throw new Error("PayPal OAuth unavailable");
  const data = await res.json();
  if (!data.access_token) throw new Error("PayPal OAuth missing token");
  return data.access_token;
};
const paypal = async (env, path, method, body, requestId) => {
  const accessToken = await paypalToken(env);
  const headers = { Authorization: "Bearer " + accessToken,
    "Content-Type": "application/json", "Accept": "application/json" };
  if (requestId) headers["PayPal-Request-Id"] = requestId;
  const res = await fetch(baseUrl(env) + path, {
    method, headers, ...(body === undefined ? {} : { body: JSON.stringify(body) })
  });
  if (!res.ok) throw new Error("PayPal API request failed: " + res.status);
  return res.json();
};
const verifiedCapture = (order, claimId) => {
  if (order?.status !== "COMPLETED" || !Array.isArray(order.purchase_units) ||
      order.purchase_units.length !== 1) return null;
  const unit = order.purchase_units[0];
  const captures = unit.payments?.captures;
  if (unit.custom_id !== String(claimId) || !Array.isArray(captures) || captures.length !== 1) return null;
  const capture = captures[0];
  if (capture.status !== "COMPLETED" || !idPattern.test(capture.id || "") ||
      capture.amount?.currency_code !== "USD" || capture.amount?.value !== "20.00") return null;
  return capture.id;
};
const readBody = async request => {
  if (!(request.headers.get("Content-Type") || "").toLowerCase().startsWith("application/json")) return null;
  if (Number(request.headers.get("Content-Length") || 0) > 4096) return null;
  try {
    const raw = await request.text();
    if (raw.length > 4096) return null;
    const value = JSON.parse(raw);
    return value && typeof value === "object" && !Array.isArray(value) ? value : null;
  } catch { return null; }
};
export async function handlePayment(request, env, url) {
  if (!enabled(env)) return reply({ error: "Payment integration not enabled" }, 503);
  if (env.PAYPAL_ENV !== "sandbox" && env.PAYPAL_ENV !== "live") {
    return reply({ error: "PayPal environment not configured" }, 503);
  }
  if (request.headers.get("Origin") !== url.origin) return reply({ error: "Forbidden" }, 403);
  const body = await readBody(request);
  const claimId = body?.claim_id;
  if (!await auth(env, claimId, body?.access_token)) return reply({ error: "Not authorized" }, 403);
  try {
    const claim = await env.DB.prepare("SELECT id, payment_status FROM claims WHERE id = ?").bind(claimId).first();
    if (!claim) return reply({ error: "Claim not found" }, 404);
    if (url.pathname === "/api/claim-status") {
      const latest = await env.DB.prepare(
        "SELECT status FROM paypal_orders WHERE claim_id = ? ORDER BY id DESC LIMIT 1"
      ).bind(claimId).first();
      return reply({ claim_id: claimId, payment_status: claim.payment_status,
        order_status: latest?.status || null });
    }
    if (claim.payment_status === "paid") return reply({ error: "Already paid" }, 409);
    if (url.pathname === "/api/paypal/create-order") {
      const previous = await env.DB.prepare(
        "SELECT paypal_order_id, status FROM paypal_orders WHERE claim_id = ? AND status IN ('CREATED','APPROVED') ORDER BY id DESC LIMIT 1"
      ).bind(claimId).first();
      if (previous) return reply({ order_id: previous.paypal_order_id });
      const order = await paypal(env, "/v2/checkout/orders", "POST", {
        intent: "CAPTURE",
        purchase_units: [{ custom_id: String(claimId), description: "BoxVia Check a Claim",
          amount: { currency_code: "USD", value: "20.00" } }]
      }, "boxvia-create-" + claimId);
      if (!idPattern.test(order.id || "") || order.status !== "CREATED") {
        throw new Error("Unexpected PayPal order");
      }
      await env.DB.prepare(
        "INSERT INTO paypal_orders (claim_id, paypal_order_id, amount, currency, status) VALUES (?, ?, '20.00', 'USD', 'CREATED')"
      ).bind(claimId, order.id).run();
      return reply({ order_id: order.id }, 201);
    }
    if (url.pathname === "/api/paypal/capture-order") {
      const orderId = body.order_id;
      if (typeof orderId !== "string" || !idPattern.test(orderId)) return reply({ error: "Invalid order" }, 400);
      const record = await env.DB.prepare(
        "SELECT id, status FROM paypal_orders WHERE claim_id = ? AND paypal_order_id = ?"
      ).bind(claimId, orderId).first();
      if (!record) return reply({ error: "Order not found" }, 404);
      // Idempotent capture request. Re-read the authoritative order from PayPal afterward.
      if (record.status !== "COMPLETED") {
        try {
          await paypal(env, "/v2/checkout/orders/" + orderId + "/capture",
            "POST", {}, "boxvia-capture-" + orderId);
        } catch (error) {
          // An already captured order may reject a retry. Verify PayPal's final state below.
          console.warn("Capture response requires verification", error.message);
        }
      }
      const order = await paypal(env, "/v2/checkout/orders/" + orderId, "GET");
      if (order.id !== orderId) throw new Error("PayPal order ID mismatch");
      const captureId = verifiedCapture(order, claimId);
      if (!captureId) return reply({ error: "Payment not completed or amount mismatch" }, 409);
      // Both statements run atomically; only verified captures can mark a claim paid.
      const batch = await env.DB.batch([
        env.DB.prepare(
          "UPDATE paypal_orders SET status = 'COMPLETED', capture_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND (capture_id IS NULL OR capture_id = ?)"
        ).bind(captureId, record.id, captureId),
        env.DB.prepare(
          "UPDATE claims SET payment_status = 'paid' WHERE id = ? AND payment_status IN ('pending', 'paid')"
        ).bind(claimId)
      ]);
      if (!batch.every(x => x.success) || batch.some(x => x.meta?.changes === 0)) {
        throw new Error("Payment reconciliation requires review");
      }
      return reply({ ok: true, claim_id: claimId, payment_status: "paid" });
    }
    return reply({ error: "Unknown endpoint" }, 404);
  } catch (error) {
    console.error("PayPal payment processing failed", error);
    return reply({ error: "Payment operation unavailable; contact support if charged" }, 503);
  }
}
