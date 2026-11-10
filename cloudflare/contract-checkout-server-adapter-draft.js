// Draft-only trusted server adapter. NOT imported by worker.js.
// Converts a verified claim capability and a server-controlled contract catalog
// into an immutable accepted-checkout archive. No PayPal capture or email sending.
import { archiveCheckoutAcceptanceDraft } from "./contract-checkout-archive-bridge-draft.js";
const hex = bytes => [...new Uint8Array(bytes)].map(x => x.toString(16).padStart(2, "0")).join("");
const digest = async value => hex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)));
const tokenPattern = /^[a-f0-9]{64}$/;
const sessionPattern = /^[A-Za-z0-9_-]{6,100}$/;
export async function verifyClaimCapabilityDraft(db, claimId, accessToken) {
  if (!db?.prepare || !Number.isSafeInteger(claimId) || claimId < 1 ||
      typeof accessToken !== "string" || !tokenPattern.test(accessToken)) return false;
  const row = await db.prepare("SELECT token_hash FROM claim_access WHERE claim_id = ?")
    .bind(claimId).first();
  if (typeof row?.token_hash !== "string" || !tokenPattern.test(row.token_hash)) return false;
  const actual = await digest(accessToken);
  // Compare all bytes rather than short-circuiting on the first mismatch.
  let difference = 0;
  for (let i = 0; i < 64; i++) difference |= actual.charCodeAt(i) ^ row.token_hash.charCodeAt(i);
  return difference === 0;
}
export async function acceptCheckoutOnServerDraft({
  db, claimId, accessToken, checkoutSessionId, consent, catalog, now = () => new Date().toISOString()
}) {
  if (!db?.prepare || !sessionPattern.test(checkoutSessionId || "")) {
    throw new TypeError("Invalid server checkout context");
  }
  // Catalog must come from trusted server code or immutable versioned server storage.
  // Never use a browser-supplied catalog or client-supplied price/annex hashes.
  if (!catalog || typeof catalog !== "object" || catalog.productId !== "check-a-claim" ||
      catalog.totalPrice !== "20.00" || catalog.currency !== "USD") {
    throw new Error("Unsupported trusted checkout catalog");
  }
  if (!await verifyClaimCapabilityDraft(db, claimId, accessToken)) {
    throw new Error("Claim capability not verified");
  }
  const claim = await db.prepare("SELECT id, customer_email FROM claims WHERE id = ?")
    .bind(claimId).first();
  if (!claim || claim.id !== claimId) throw new Error("Claim not found");
  const acceptedAt = now();
  if (Number.isNaN(Date.parse(acceptedAt))) throw new Error("Invalid server timestamp");
  const rawSnapshot = {
    ...catalog, orderId: checkoutSessionId,
    customerEmail: claim.customer_email, acceptedAt
  };
  return archiveCheckoutAcceptanceDraft({
    db, claimId, accessToken, checkoutSessionId, rawSnapshot, consent,
    now: () => acceptedAt, verifyClaimCapability: verifyClaimCapabilityDraft
  });
}
// Production wiring needs a server-issued one-time checkout session tied to claimId,
// transactional consumption and server-persisted immutable catalog/annex bytes.
// This adapter is intentionally NOT an HTTP handler.
