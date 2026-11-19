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
