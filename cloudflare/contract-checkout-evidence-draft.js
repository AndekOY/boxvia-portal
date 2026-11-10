// Draft-only server-side acceptance event builder. Not exposed as an HTTP route.
// A verified claim capability is required; payment status is NOT acceptance.
import { validateContractSnapshot } from "./contract-confirmation.js";
const hex = bytes => [...new Uint8Array(bytes)].map(b => b.toString(16).padStart(2, "0")).join("");
const digest = async text => hex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)));
const validId = s => typeof s === "string" && /^[A-Za-z0-9_-]{6,100}$/.test(s);
const allowedDocuments = ["terms", "schedule", "withdrawal"];
export async function buildVerifiedCheckoutAcceptanceDraft({
  db, claimId, accessToken, checkoutSessionId, rawSnapshot, consent,
  verifyClaimCapability, now = () => new Date().toISOString()
}) {
  if (!db?.prepare || !Number.isSafeInteger(claimId) || claimId < 1 ||
      typeof verifyClaimCapability !== "function" || !validId(checkoutSessionId)) {
    throw new TypeError("Trusted checkout context required");
  }
  // Capability verifier must be a trusted server function, never client-provided.
  if (await verifyClaimCapability(db, claimId, accessToken) !== true) {
    throw new Error("Claim capability not verified");
  }
  const claim = await db.prepare("SELECT id, customer_email FROM claims WHERE id = ?").bind(claimId).first();
  if (!claim || !claim.customer_email) throw new Error("Claim not found");
  if (consent?.affirmative !== true || consent?.termsAccepted !== true ||
      consent?.scheduleAccepted !== true || consent?.withdrawalNoticeAcknowledged !== true ||
      consent?.privacyNoticeAcknowledged !== true) {
    throw new Error("Affirmative checkout acknowledgements required");
  }
  if(typeof consent.earlyPerformanceRequested !== "boolean" ||
      typeof consent.earlyPerformanceConsequencesAcknowledged !== "boolean" ||
      consent.earlyPerformanceRequested !== consent.earlyPerformanceConsequencesAcknowledged ||
      consent.earlyPerformanceTextVersion !== "BXC-EARLY-001-v0.1") {
    throw new Error("Invalid optional early performance choice");
  }
  const snapshot = validateContractSnapshot(rawSnapshot, { allowUnicode: true });
  if(Boolean(snapshot.earlyPerformanceRequest) !== consent.earlyPerformanceRequested ||
      (snapshot.earlyPerformanceRequest && (snapshot.earlyPerformanceRequest.textVersion !== consent.earlyPerformanceTextVersion || snapshot.earlyPerformanceRequest.requestedAt !== snapshot.acceptedAt))) {
    throw new Error("Early performance evidence mismatch");
  }
  if (snapshot.customerEmail !== claim.customer_email ||
      snapshot.productId !== "check-a-claim" ||
      snapshot.orderId !== checkoutSessionId) {
    throw new Error("Checkout and claim identity mismatch");
  }
  if (snapshot.acceptedDocuments.length !== allowedDocuments.length ||
      allowedDocuments.some(id => !snapshot.acceptedDocuments.some(doc => doc.id === id))) {
    throw new Error("Incomplete accepted document set");
  }
  const acceptedAt = now();
  if (Number.isNaN(Date.parse(acceptedAt)) || snapshot.acceptedAt !== acceptedAt) {
    throw new Error("Server acceptance time mismatch");
  }
  // Only a trusted server constructs this event. The hash proves content integrity,
  // not user identity or nonrepudiation by itself.
  const event = {
    version: "BXC-CHECKOUT-EVENT-001",
    checkoutSessionId,
    claimId,
    orderId: snapshot.orderId,
    customerEmail: snapshot.customerEmail,
    acceptedAt,
    affirmative: true,
    termsAccepted: true,
    scheduleAccepted: true,
    withdrawalNoticeAcknowledged: true,
    privacyNoticeAcknowledged: true,
    earlyPerformanceRequested:consent.earlyPerformanceRequested,
    earlyPerformanceConsequencesAcknowledged:consent.earlyPerformanceConsequencesAcknowledged,
    earlyPerformanceTextVersion:consent.earlyPerformanceTextVersion,
    documents: snapshot.acceptedDocuments
  };
  return { snapshot, evidence: {
    verified: true, source: "server_checkout", checkoutSessionId,
    orderId: snapshot.orderId, customerEmail: snapshot.customerEmail,
    acceptedAt, acceptanceEventSha256: await digest(JSON.stringify(event))
  }, event };
}
