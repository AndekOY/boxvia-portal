// Draft-only staging probe. No checkout, payments, migrations, or outbound network.
export default {
  async fetch(request, env) {
    if (env.BXC_SANDBOX_ONLY !== "true" || env.PAYPAL_ENV !== "sandbox" ||
        env.PAYPAL_CHECKOUT_ENABLED !== "false") {
      return Response.json({status:"blocked",reason:"sandbox_guard"}, {status:503});
    }
    const path = new URL(request.url).pathname;
    if (request.method !== "GET" || path !== "/__bxc_sandbox_health") {
      return Response.json({status:"not_found"}, {status:404});
    }
    return Response.json({status:"sandbox_probe_only",payments_enabled:false,
      d1_bound:!!env.DB,provider_network_used:false}, {
      headers:{"Cache-Control":"no-store"}
    });
  }
};
