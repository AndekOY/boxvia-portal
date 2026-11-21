// Sandbox-only order persistence. Call only after trusted intake authentication.
// Existing public service request IDs are NOT customer authorization.
import { getServiceDefinition, resolveOrderPrice } from "./service-catalog.mjs";

const hex = bytes => [...new Uint8Array(bytes)].map(b => b.toString(16).padStart(2, "0")).join("");
const sha256 = async value => hex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)));
const tokenPattern = /^[a-f0-9]{64}$/;

export async function createFixedPriceOrder(db, { serviceRequestId, serviceCode }) {
  if (!db || !Number.isSafeInteger(serviceRequestId) || serviceRequestId <= 0) {
    throw new Error("Invalid request");
  }
  const service = getServiceDefinition(serviceCode);
  if (!service || service.quoteRequired) {
    throw new Error("Only fixed-price services are enabled for sandbox orders");
  }
  // The server catalog, never client input, determines the charge amount.
  const price = resolveOrderPrice(serviceCode);
  const request = await db.prepare(
    "SELECT id, service_code FROM service_requests WHERE id = ?"
  ).bind(serviceRequestId).first();
  if (!request || request.service_code !== serviceCode) throw new Error("Service request mismatch");

  // A caller can retrieve the capability ONLY on first creation. An existing
  // order's capability is never disclosed again from its hash.
  const capability = hex(crypto.getRandomValues(new Uint8Array(32)));
  const capabilityHash = await sha256(capability);
  const id = crypto.randomUUID();
  const result = await db.prepare(
    "INSERT OR IGNORE INTO service_orders (id,service_request_id,service_code,amount_minor,currency,capability_hash,status) VALUES (?,?,?,?,?,?,'pending')"
  ).bind(id, serviceRequestId, serviceCode, price.amountMinor, price.currency, capabilityHash).run();
  if (!result?.success) throw new Error("Order persistence failed");
  const created = result.meta?.changes === 1;
  const order = await db.prepare(
    "SELECT id, service_code, amount_minor, currency, status FROM service_orders WHERE service_request_id = ?"
  ).bind(serviceRequestId).first();
  if (!order || order.service_code !== serviceCode || order.amount_minor !== price.amountMinor ||
      order.currency !== price.currency) throw new Error("Order integrity mismatch");
  return Object.freeze({
    created,
    orderId: order.id,
    status: order.status,
    amountMinor: order.amount_minor,
    currency: order.currency,
    ...(created ? { capability } : {})
  });
}

export async function getAuthorizedOrder(db, orderId, capability) {
  if (!db || typeof orderId !== "string" || !/^[a-f0-9-]{36}$/i.test(orderId) ||
      typeof capability !== "string" || !tokenPattern.test(capability)) return null;
  const record = await db.prepare(
    "SELECT id,service_code,amount_minor,currency,status,capability_hash FROM service_orders WHERE id = ?"
  ).bind(orderId).first();
  if (!record || typeof record.capability_hash !== "string" || !tokenPattern.test(record.capability_hash)) return null;
  const provided = await sha256(capability);
  let difference = 0;
  for (let i = 0; i < 64; i++) difference |= provided.charCodeAt(i) ^ record.capability_hash.charCodeAt(i);
  if (difference !== 0) return null;
  return Object.freeze({
    orderId: record.id,
    serviceCode: record.service_code,
    amountMinor: record.amount_minor,
    currency: record.currency,
    status: record.status
  });
}
