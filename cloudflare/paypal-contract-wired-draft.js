// Draft-only PayPal integration. Do NOT import into production worker.js.
import { reservePayPalCreateDraft, markPayPalAttemptLinkedDraft } from "./contract-paypal-create-attempt-draft.js";
import { preflightPayPalCreateDraft, persistCreatedPayPalOrderDraft, preflightPayPalCaptureDraft } from "./contract-paypal-boundary-draft.js";
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
  const statusOnly = url.pathname === "/api/claim-status";
  // Reading a claim status requires its capability, but never needs PayPal credentials.
  if (!env.DB || (!statusOnly && !enabled(env))) return reply({ error: "Payment integration not enabled" }, 503);
  if (!statusOnly && env.PAYPAL_ENV !== "sandbox" && env.PAYPAL_ENV !== "live") {
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
    if (claim.payment_status === "paid" && url.pathname === "/api/paypal/create-order") return reply({ error: "Already paid" }, 409);
    if (url.pathname === "/api/paypal/create-order") {
      const contractGate = await preflightPayPalCreateDraft({
        db: env.DB, claimId, accessToken: body.access_token,
        checkoutSessionId: body.checkout_session_id
      });
      const previous = await env.DB.prepare(
        "SELECT paypal_order_id, status FROM paypal_orders WHERE claim_id = ? AND status IN ('CREATED','APPROVED') ORDER BY id DESC LIMIT 1"
      ).bind(claimId).first();
      if (previous) {
        if (contractGate.existingPayPalOrderId !== previous.paypal_order_id) {
          return reply({ error: "Existing PayPal order lacks accepted contract linkage" }, 409);
        }
        const existing = await paypal(env, "/v2/checkout/orders/" + previous.paypal_order_id, "GET");
        const approval = existing.links?.find(link => link.rel === "payer-action" || link.rel === "approve")?.href;
        if (approval && /^https:\/\/(www\.)?(sandbox\.)?paypal\.com\//.test(approval)) {
          return reply({ order_id: previous.paypal_order_id, approval_url: approval });
        }
        return reply({ error: "Existing order requires reconciliation" }, 409);
      }
      if (contractGate.existingPayPalOrderId) {
        return reply({ error: "Linked PayPal order requires reconciliation" }, 409);
      }
      const reservation = await reservePayPalCreateDraft({ db: env.DB, preflight: contractGate });
      const order = await paypal(env, "/v2/checkout/orders", "POST", {
        intent: "CAPTURE",
        payment_source: { paypal: { experience_context: {
          return_url: url.origin + "/checkout/?request=" + claimId + "&checkout_session_id=" + encodeURIComponent(contractGate.checkoutSessionId) + "&paypal_return=1",
          cancel_url: url.origin + "/checkout/?request=" + claimId + "&checkout_session_id=" + encodeURIComponent(contractGate.checkoutSessionId) + "&paypal_cancel=1",
          user_action: "PAY_NOW"
        } } },
        purchase_units: [{ custom_id: String(claimId), description: "BoxVia Check a Claim",
          amount: { currency_code: "USD", value: "20.00" } }]
      }, reservation.requestId);
      if (!idPattern.test(order.id || "") || !["CREATED", "PAYER_ACTION_REQUIRED"].includes(order.status)) {
        throw new Error("Unexpected PayPal order");
      }
      await persistCreatedPayPalOrderDraft({ db: env.DB, preflight: contractGate, paypalOrderId: order.id });
      await markPayPalAttemptLinkedDraft({ db: env.DB, reservation, paypalOrderId: order.id });
      const approval = order.links?.find(link => link.rel === "payer-action" || link.rel === "approve")?.href;
      if (!approval || !/^https:\/\/(www\.)?(sandbox\.)?paypal\.com\//.test(approval)) {
        throw new Error("Missing trusted PayPal approval URL");
      }
      return reply({ order_id: order.id, approval_url: approval }, 201);
    }
    if (url.pathname === "/api/paypal/capture-order") {
      const orderId = body.order_id;
      if (typeof orderId !== "string" || !idPattern.test(orderId)) return reply({ error: "Invalid order" }, 400);
      await preflightPayPalCaptureDraft({
        db: env.DB, claimId, accessToken: body.access_token,
        checkoutSessionId: body.checkout_session_id, paypalOrderId: orderId
      });
      const record = await env.DB.prepare(
        "SELECT id, status FROM paypal_orders WHERE claim_id = ? AND paypal_order_id = ?"
      ).bind(claimId, orderId).first();
      if (!record) return reply({ error: "Order not found" }, 404);
      // Idempotent capture request. Re-read the authoritative order from PayPal afterward.
      if (record.status !== "COMPLETED" && claim.payment_status !== "paid") {
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
          "UPDATE claims SET payment_status = 'paid' WHERE id = ? AND payment_status IN ('pending', 'paid') AND EXISTS (SELECT 1 FROM paypal_orders WHERE id = ? AND claim_id = ? AND paypal_order_id = ? AND status = 'COMPLETED' AND capture_id = ?)"
        ).bind(claimId, record.id, claimId, orderId, captureId)
      ]);
      if (!batch.every(x => x.success)) {
        throw new Error("Payment reconciliation requires review");
      }
      const confirmed = await env.DB.prepare(
        "SELECT payment_status FROM claims WHERE id = ?"
      ).bind(claimId).first();
      if (confirmed?.payment_status !== "paid") {
        throw new Error("Payment reconciliation not confirmed");
      }
      // Queue the notification only after the verified payment is committed.
      // A missing outbox must not undo a captured payment.
      try {
        await env.DB.prepare(
          "INSERT OR IGNORE INTO notification_outbox (claim_id, event_type, status) VALUES (?, 'claim_paid', 'pending')"
        ).bind(claimId).run();
      } catch (error) {
        console.error("Paid claim notification enqueue failed", error);
      }
      return reply({ ok: true, claim_id: claimId, payment_status: "paid" });
    }
    return reply({ error: "Unknown endpoint" }, 404);
  } catch (error) {
    console.error("PayPal payment processing failed", error);
    return reply({ error: "Payment operation unavailable; contact support if charged" }, 503);
  }
}
