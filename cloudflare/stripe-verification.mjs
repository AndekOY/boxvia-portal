// Stripe Test Mode webhook signature verification (not routed or enabled).
// Signature verification authenticates event transport; it does NOT itself mark an order paid.
const encoder = new TextEncoder();
const decodeHex = value => {
  if (!/^[a-f0-9]{64}$/i.test(value)) return null;
  return Uint8Array.from(value.match(/../g), v => parseInt(v, 16));
};
const equalBytes = (a, b) => {
  if (!(a instanceof Uint8Array) || !(b instanceof Uint8Array) || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
};

export async function verifyStripeSignature(rawBody, signatureHeader, webhookSecret, nowSeconds = Math.floor(Date.now() / 1000)) {
  if (typeof rawBody !== "string" || encoder.encode(rawBody).byteLength > 65536 ||
      typeof signatureHeader !== "string" || signatureHeader.length > 4096 ||
      typeof webhookSecret !== "string" || !webhookSecret.startsWith("whsec_") ||
      !Number.isSafeInteger(nowSeconds)) return null;

  const pieces = signatureHeader.split(",").map(s => s.trim());
  const timestamps = pieces.filter(p => /^t=\d+$/.test(p));
  if (timestamps.length !== 1) return null;
  const timestamp = Number(timestamps[0].slice(2));
  if (!Number.isSafeInteger(timestamp) || Math.abs(nowSeconds - timestamp) > 300) return null;
  const candidates = pieces.filter(p => /^v1=[a-fA-F0-9]{64}$/.test(p));
  if (!candidates.length) return null;

  const key = await crypto.subtle.importKey("raw", encoder.encode(webhookSecret), {
    name: "HMAC", hash: "SHA-256"
  }, false, ["sign"]);
  const expected = new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(timestamp + "." + rawBody)));
  if (!candidates.some(p => equalBytes(decodeHex(p.slice(3)), expected))) return null;

  let event;
  try { event = JSON.parse(rawBody); } catch { return null; }
  if (!event || typeof event !== "object" || Array.isArray(event) ||
      typeof event.id !== "string" || !/^evt_[A-Za-z0-9]{8,128}$/.test(event.id) ||
      typeof event.type !== "string" || event.type.length > 128 ||
      !event.data || typeof event.data !== "object") return null;
  return event;
}

export function inspectStripeCheckoutSession(event, expectedOrder) {
  if (!event || event.livemode !== false || event.type !== "checkout.session.completed" ||
      !expectedOrder || expectedOrder.currency !== "USD" ||
      !Number.isSafeInteger(expectedOrder.amountMinor)) return null;
  const session = event.data?.object;
  if (!session || session.livemode !== false || session.object !== "checkout.session" ||
      session.payment_status !== "paid" ||
      session.mode !== "payment" ||
      session.client_reference_id !== expectedOrder.id ||
      session.metadata?.order_id !== expectedOrder.id ||
      session.amount_total !== expectedOrder.amountMinor ||
      session.currency !== "usd" ||
      typeof session.id !== "string" || !/^cs_test_[A-Za-z0-9_]{8,128}$/.test(session.id) ||
      typeof session.payment_intent !== "string" || !/^pi_[A-Za-z0-9]{8,128}$/.test(session.payment_intent)) return null;
  return Object.freeze({
    provider: "stripe",
    status: "completed",
    providerOrderId: session.id,
    providerPaymentId: session.payment_intent,
    amountMinor: session.amount_total,
    currency: "USD",
    orderId: expectedOrder.id,
    eventId: event.id
  });
}
