// Stripe Checkout Test Mode adapter. Not mounted on an HTTP route.
// Caller MUST authenticate the order capability before calling this function.
// This module never reads prices from browser input.
const allowedServices = new Set(["one-question-review", "ai-governance-review"]);
const stripeSessionId = /^cs_test_[A-Za-z0-9_]{8,128}$/;
const orderIdPattern = /^[a-f0-9-]{36}$/i;
const safeRedirect = (origin, path) => {
  const url = new URL(path, origin);
  if (url.origin !== origin || url.protocol !== "https:") throw new Error("Unsafe redirect");
  return url.toString();
};

export function buildStripeCheckoutForm(order, origin) {
  if (!order || !orderIdPattern.test(order.orderId || "") ||
      !allowedServices.has(order.serviceCode) ||
      order.amountMinor !== 5000 || order.currency !== "USD" ||
      order.status !== "pending") throw new Error("Order not eligible for Stripe checkout");
  const success = safeRedirect(origin, "/api/orders/return?provider=stripe&session_id={CHECKOUT_SESSION_ID}");
  const cancel = safeRedirect(origin, "/api/orders/return?provider=stripe&cancelled=1");
  const form = new URLSearchParams();
  form.set("mode", "payment");
  form.set("client_reference_id", order.orderId);
  form.set("metadata[order_id]", order.orderId);
  form.set("line_items[0][price_data][currency]", "usd");
  form.set("line_items[0][price_data][unit_amount]", "5000");
  form.set("line_items[0][price_data][product_data][name]",
    order.serviceCode === "one-question-review" ? "One Question Review" : "Focused AI Governance Review");
  form.set("line_items[0][quantity]", "1");
  form.set("success_url", success);
  form.set("cancel_url", cancel);
  return form;
}

export async function requestStripeTestSession(order, env, origin, attemptId) {
  if (env?.STRIPE_MODE !== "test" || env?.STRIPE_CHECKOUT_TEST_ENABLED !== "true" ||
      typeof env.STRIPE_TEST_SECRET_KEY !== "string" ||
      !env.STRIPE_TEST_SECRET_KEY.startsWith("sk_test_") ||
      !/^[a-f0-9-]{36}$/i.test(attemptId || "")) throw new Error("Stripe Test Mode unavailable");
  const form = buildStripeCheckoutForm(order, origin);
  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + env.STRIPE_TEST_SECRET_KEY,
      "Content-Type": "application/x-www-form-urlencoded",
      "Idempotency-Key": "boxvia-test-" + attemptId
    },
    body: form.toString()
  });
  if (!response.ok) throw new Error("Stripe Test Mode API unavailable");
  const session = await response.json();
  if (session?.livemode !== false || !stripeSessionId.test(session.id || "") ||
      session.mode !== "payment" ||
      session.client_reference_id !== order.orderId ||
      session.amount_total !== 5000 ||
      session.currency !== "usd" ||
      typeof session.url !== "string") throw new Error("Stripe session mismatch");
  const redirect = new URL(session.url);
  if (redirect.protocol !== "https:" ||
      !["checkout.stripe.com", "checkout.stripe.dev"].includes(redirect.hostname)) {
    throw new Error("Untrusted Stripe checkout URL");
  }
  return Object.freeze({ sessionId: session.id, checkoutUrl: redirect.toString() });
}

// Two-stage persistence: reserve a unique attempt before contacting Stripe.
// Persist the returned provider session ID before exposing the checkout URL.
// Failed/ambiguous responses require reconciliation; do not mint another
// attempt automatically because Stripe may have created a session already.
export async function reserveStripeAttempt(db, order) {
  if (!db || order?.status !== "pending" || order.amountMinor !== 5000 ||
      order.currency !== "USD" || !orderIdPattern.test(order.orderId || "")) {
    throw new Error("Invalid pending order");
  }
  const existing = await db.prepare(
    "SELECT id,status,provider_order_id FROM payment_attempts WHERE order_id = ? AND provider = 'stripe' ORDER BY created_at DESC LIMIT 1"
  ).bind(order.orderId).first();
  if (existing) return { created: false, attemptId: existing.id, status: existing.status };
  const id = crypto.randomUUID();
  const result = await db.prepare(
    "INSERT INTO payment_attempts (id,order_id,provider,status,amount_minor,currency) SELECT ?,id,'stripe','created',amount_minor,currency FROM service_orders WHERE id = ? AND status = 'pending' AND amount_minor = 5000 AND currency = 'USD'"
  ).bind(id, order.orderId).run();
  if (!result?.success || result.meta?.changes !== 1) throw new Error("Stripe attempt reservation failed");
  return { created: true, attemptId: id, status: "created" };
}

export async function persistStripeSession(db, attemptId, sessionId, orderId) {
  if (!stripeSessionId.test(sessionId || "") || !orderIdPattern.test(attemptId || "") ||
      !orderIdPattern.test(orderId || "")) throw new Error("Invalid Stripe session binding");
  const statements = [
    db.prepare(
      "UPDATE payment_attempts SET provider_order_id = ?, status = 'pending' WHERE id = ? AND order_id = ? AND provider = 'stripe' AND status = 'created' AND provider_order_id IS NULL"
    ).bind(sessionId, attemptId, orderId),
    db.prepare(
      "UPDATE service_orders SET status = 'checkout', updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status = 'pending' AND EXISTS (SELECT 1 FROM payment_attempts WHERE id = ? AND provider = 'stripe' AND provider_order_id = ? AND status = 'pending')"
    ).bind(orderId, attemptId, sessionId)
  ];
  const result = await db.batch(statements);
  if (!Array.isArray(result) || result.some(x => x?.success !== true) ||
      result[0]?.meta?.changes !== 1 || result[1]?.meta?.changes !== 1) {
    throw new Error("Stripe session persistence not confirmed");
  }
}
