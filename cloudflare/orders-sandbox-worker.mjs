import { verifyStripeSignature } from "./stripe-verification.mjs";
import { settleVerifiedStripeEvent } from "./stripe-settlement.mjs";
import { createFixedPriceOrder, getAuthorizedOrder } from "./orders-persistence.mjs";
// Isolated BoxVia unified-orders sandbox Worker.
// No production routes, payment endpoints, customer data, or static asset exposure.
const json = (data, status = 200) => Response.json(data, {
  status,
  headers: {
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer"
  }
});
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const checkoutDisabled = env.UNIFIED_ORDERS_ENABLED === "false" &&
      env.PAYPAL_CHECKOUT_ENABLED === "false" &&
      env.STRIPE_CHECKOUT_ENABLED === "false";
    if (!checkoutDisabled) return json({ error: "Sandbox configuration rejected" }, 503);
    if (url.pathname === "/api/stripe/webhook" && request.method === "POST") {
      // Strictly test-mode only; independently gated from checkout.
      if (env.STRIPE_WEBHOOK_TEST_ENABLED !== "true" ||
          env.STRIPE_MODE !== "test" ||
          typeof env.STRIPE_TEST_WEBHOOK_SECRET !== "string" ||
          !env.DB) return json({ error: "Unavailable" }, 503);
      if (request.headers.get("Content-Type")?.split(";")[0].trim().toLowerCase() !== "application/json") {
        return json({ error: "Invalid content type" }, 415);
      }
      const declared = Number(request.headers.get("Content-Length") || 0);
      if (!Number.isFinite(declared) || declared > 65536) return json({ error: "Too large" }, 413);
      let raw;
      try {
        raw = await request.text();
        if (new TextEncoder().encode(raw).byteLength > 65536) return json({ error: "Too large" }, 413);
      } catch { return json({ error: "Invalid request" }, 400); }
      try {
        const event = await verifyStripeSignature(
          raw, request.headers.get("Stripe-Signature"), env.STRIPE_TEST_WEBHOOK_SECRET
        );
        if (!event) return json({ error: "Invalid signature" }, 400);
        if (event.livemode !== false) return json({ error: "Live events rejected" }, 400);
        if (event.type !== "checkout.session.completed") return json({ received: true, outcome: "ignored" });
        const result = await settleVerifiedStripeEvent(env.DB, event);
        if (result.outcome === "paid" || result.outcome === "already_processed_or_manual_review") {
          return json({ received: true, outcome: result.outcome });
        }
        if (result.outcome === "rejected" || result.outcome === "unmatched_attempt" ||
            result.outcome === "unknown_order") {
          console.warn("stripe_sandbox_unmatched_event", { outcome: result.outcome });
          return json({ received: false, outcome: "requires_review" }, 409);
        }
        return json({ received: true, outcome: "ignored" });
      } catch {
        console.error("stripe_sandbox_webhook_processing_failed");
        return json({ error: "Unavailable" }, 503);
      }
    }
    if (url.pathname === "/api/orders/status" && request.method === "POST") {
      if (!env.DB) return json({ error: "Unavailable" }, 503);
      if (request.headers.get("Origin") !== url.origin ||
          request.headers.get("Content-Type")?.split(";")[0].trim().toLowerCase() !== "application/json") {
        return json({ error: "Rejected" }, 403);
      }
      let input;
      try {
        if (Number(request.headers.get("Content-Length") || 0) > 2048) return json({ error: "Too large" }, 413);
        input = await request.json();
      } catch { return json({ error: "Invalid request" }, 400); }
      try {
        const order = await getAuthorizedOrder(env.DB, input?.orderId, input?.capability);
        return order ? json(order) : json({ error: "Not found" }, 404);
      } catch {
        console.error("orders_sandbox_status_failed");
        return json({ error: "Unavailable" }, 503);
      }
    }
    if (url.pathname === "/api/orders/create" && request.method === "POST") {
      // Owner-only sandbox endpoint; no customer-facing order creation yet.
      if (!env.DB || typeof env.ORDERS_SANDBOX_ADMIN_TOKEN !== "string" ||
          env.ORDERS_SANDBOX_ADMIN_TOKEN.length < 32) return json({ error: "Unavailable" }, 503);
      if (request.headers.get("Origin") !== url.origin ||
          request.headers.get("Content-Type")?.split(";")[0].trim().toLowerCase() !== "application/json") {
        return json({ error: "Rejected" }, 403);
      }
      const supplied = request.headers.get("Authorization") || "";
      const expected = "Bearer " + env.ORDERS_SANDBOX_ADMIN_TOKEN;
      const hash = async x => new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(x)));
      const [a,b] = await Promise.all([hash(supplied),hash(expected)]);
      let diff=0;
      for (let i=0;i<a.length;i++) diff|=a[i]^b[i];
      if (diff!==0 || supplied.length!==expected.length) return json({ error: "Unauthorized" }, 401);
      let input;
      try {
        if (Number(request.headers.get("Content-Length") || 0) > 2048) return json({ error: "Too large" }, 413);
        input=await request.json();
      } catch { return json({ error: "Invalid request" }, 400); }
      try {
        const order=await createFixedPriceOrder(env.DB,{
          serviceRequestId:input?.serviceRequestId,
          serviceCode:input?.serviceCode
        });
        return json(order,order.created ? 201 : 200);
      } catch (error) {
        if (/Invalid request|mismatch|Only the two/.test(error.message)) return json({ error: "Invalid service request" }, 400);
        console.error("orders_sandbox_create_failed");
        return json({ error: "Unavailable" }, 503);
      }
    }
    if (request.method !== "GET" || url.pathname !== "/api/health") {
      return json({ error: "Not found" }, 404);
    }
    if (env.UNIFIED_ORDERS_ENABLED !== "false" ||
        env.PAYPAL_CHECKOUT_ENABLED !== "false" ||
        env.STRIPE_CHECKOUT_ENABLED !== "false") {
      return json({ status: "misconfigured" }, 503);
    }
    if (!env.DB) return json({ status: "database_unavailable" }, 503);
    try {
      await env.DB.prepare("SELECT 1 AS ok").first();
      const schema = await env.DB.prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('service_orders','service_quotes','payment_attempts','payment_events','fulfillment_outbox')"
      ).all();
      const present = new Set((schema.results || []).map(row => row.name));
      const required = ["service_orders","service_quotes","payment_attempts","payment_events","fulfillment_outbox"];
      return json({
        service: "boxvia-orders-sandbox",
        status: required.every(name => present.has(name)) ? "schema_ready" : "schema_pending",
        checkout: "disabled",
        unified_tables_present: required.filter(name => present.has(name)).length
      });
    } catch {
      return json({ status: "database_unavailable" }, 503);
    }
  }
};
