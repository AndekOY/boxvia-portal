// Sandbox-only Stripe settlement persistence. Not mounted to a webhook route.
// D1 batch executes statements transactionally; the order row is the single-payment latch.
// Caller must first verify Stripe's signed raw event and match a stored checkout attempt.
import { inspectStripeCheckoutSession } from "./stripe-verification.mjs";

export async function settleVerifiedStripeEvent(db, event) {
  if (!db || !event || event.type !== "checkout.session.completed") {
    return { outcome: "ignored" };
  }
  const session = event.data?.object;
  const orderId = session?.client_reference_id;
  if (typeof orderId !== "string" || !/^[a-f0-9-]{36}$/i.test(orderId)) {
    return { outcome: "rejected" };
  }
  const order = await db.prepare(
    "SELECT id,amount_minor,currency,status FROM service_orders WHERE id = ?"
  ).bind(orderId).first();
  if (!order) return { outcome: "unknown_order" };
  const verified = inspectStripeCheckoutSession(event, {
    id: order.id, amountMinor: order.amount_minor, currency: order.currency
  });
  if (!verified) return { outcome: "rejected" };

  // A Checkout Session must already have been created and persisted by our server.
  // A valid Stripe signature alone does not authorize arbitrary new payment attempts.
  const attempt = await db.prepare(
    "SELECT id,order_id,provider_order_id,amount_minor,currency,status FROM payment_attempts WHERE provider = 'stripe' AND provider_order_id = ?"
  ).bind(verified.providerOrderId).first();
  if (!attempt || attempt.order_id !== order.id ||
      attempt.amount_minor !== order.amount_minor ||
      attempt.currency !== order.currency ||
      !["created", "pending", "verified"].includes(attempt.status)) {
    return { outcome: "unmatched_attempt" };
  }

  const eventDigest = await crypto.subtle.digest(
    "SHA-256", new TextEncoder().encode(JSON.stringify(event))
  );
  const digest = [...new Uint8Array(eventDigest)].map(x => x.toString(16).padStart(2, "0")).join("");
  // The conditional order UPDATE is the paid-once latch. In a D1 transactional
  // batch, a replay cannot create another fulfillment row.
  const statements = [
    db.prepare(
      "INSERT OR IGNORE INTO payment_events (provider,event_id,event_type,payload_digest) VALUES ('stripe',?,?,?)"
    ).bind(event.id, event.type, digest),
    db.prepare(
      "UPDATE service_orders SET status = 'paid', paid_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status = 'checkout' AND amount_minor = ? AND currency = 'USD' AND EXISTS (SELECT 1 FROM payment_attempts WHERE id = ? AND provider = 'stripe' AND provider_order_id = ? AND amount_minor = ? AND currency = 'USD' AND status IN ('created','pending','verified'))"
    ).bind(order.id, order.amount_minor, attempt.id, verified.providerOrderId, order.amount_minor),
    db.prepare(
      "UPDATE payment_attempts SET status = 'verified', provider_payment_id = ?, verified_at = CURRENT_TIMESTAMP WHERE id = ? AND provider = 'stripe' AND provider_order_id = ? AND status IN ('created','pending','verified') AND EXISTS (SELECT 1 FROM service_orders WHERE id = ? AND status = 'paid')"
    ).bind(verified.providerPaymentId, attempt.id, verified.providerOrderId, order.id),
    db.prepare(
      "INSERT OR IGNORE INTO fulfillment_outbox (id,order_id,status) SELECT ?,id,'pending' FROM service_orders WHERE id = ? AND status = 'paid' AND EXISTS (SELECT 1 FROM payment_attempts WHERE id = ? AND provider = 'stripe' AND provider_payment_id = ? AND status = 'verified')"
    ).bind(crypto.randomUUID(), order.id, attempt.id, verified.providerPaymentId),
    db.prepare(
      "UPDATE payment_events SET processed_at = CURRENT_TIMESTAMP WHERE provider = 'stripe' AND event_id = ?"
    ).bind(event.id)
  ];
  const results = await db.batch(statements);
  if (!Array.isArray(results) || results.length !== statements.length ||
      results.some(r => r?.success !== true)) {
    throw new Error("Settlement transaction not confirmed");
  }
  // A second successful provider charge for an already-paid order requires
  // separate reconciliation. Never infer success merely from event deduplication.
  const changed = results[1]?.meta?.changes === 1;
  return { outcome: changed ? "paid" : "already_processed_or_manual_review", orderId: order.id };
}
