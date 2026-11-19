// Isolated BoxVia unified-orders sandbox Worker.
// No production routes, payment endpoints, customer data, or static asset exposure.
const json = (data, status = 200) => Response.json(data, {
  status,
  headers: {
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
    "Access-Control-Allow-Origin": "null"
  }
});
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
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
