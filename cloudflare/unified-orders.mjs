// Unified orders domain logic. Intentionally not mounted on any HTTP route.
// No provider API calls or payment acceptance until isolated sandbox validation.
import { resolveOrderPrice } from "./service-catalog.mjs";

export const ORDER_TRANSITIONS = Object.freeze({
  pending: Object.freeze(["checkout", "cancelled", "expired"]),
  checkout: Object.freeze(["paid", "pending", "cancelled", "expired", "manual_review"]),
  paid: Object.freeze(["fulfillment_ready", "manual_review", "refunded", "disputed"]),
  fulfillment_ready: Object.freeze(["in_progress", "manual_review", "refunded", "disputed"]),
  in_progress: Object.freeze(["delivered", "manual_review", "refunded", "disputed"]),
  delivered: Object.freeze(["refunded", "disputed"]),
  cancelled: Object.freeze([]),
  expired: Object.freeze([]),
  manual_review: Object.freeze(["refunded", "disputed"]),
  refunded: Object.freeze([]),
  disputed: Object.freeze(["refunded", "manual_review"])
});

export function canTransitionOrder(from, to) {
  return typeof from === "string" && typeof to === "string" &&
    Object.hasOwn(ORDER_TRANSITIONS, from) && ORDER_TRANSITIONS[from].includes(to);
}

export function buildPendingOrder({ serviceCode, serviceRequestId, orderId, capabilityHash, acceptedQuote = null }) {
  if (!Number.isSafeInteger(serviceRequestId) || serviceRequestId <= 0) throw new Error("Invalid service request");
  if (typeof orderId !== "string" || !/^[a-f0-9-]{36}$/i.test(orderId)) throw new Error("Invalid order identifier");
  if (typeof capabilityHash !== "string" || !/^[a-f0-9]{64}$/i.test(capabilityHash)) throw new Error("Invalid capability hash");
  const { amountMinor, currency } = resolveOrderPrice(serviceCode, acceptedQuote);
  return Object.freeze({
    id: orderId,
    serviceRequestId,
    serviceCode,
    amountMinor,
    currency,
    quoteId: acceptedQuote?.id ?? null,
    capabilityHash,
    status: "pending"
  });
}

export function verifyProviderPayment(expected, payment) {
  if (!expected || !payment ||
      !["paypal", "stripe"].includes(payment.provider) ||
      payment.status !== "completed" ||
      typeof payment.providerOrderId !== "string" ||
      !/^[A-Za-z0-9_-]{8,128}$/.test(payment.providerOrderId) ||
      typeof payment.providerPaymentId !== "string" ||
      !/^[A-Za-z0-9_-]{8,128}$/.test(payment.providerPaymentId) ||
      !Number.isSafeInteger(payment.amountMinor) ||
      payment.amountMinor !== expected.amountMinor ||
      payment.currency !== expected.currency ||
      payment.orderId !== expected.id) return false;
  // Caller MUST obtain payment from a verified provider API response or signed webhook,
  // then atomically enforce order state, uniqueness and fulfillment outbox in D1.
  return true;
}
