// Draft-only one-shot checkout acceptance coordinator.
// Does NOT implement a distributed D1 transaction across archive + session.
// A failed step leaves the session 'consuming' for manual reconciliation;
// it must never automatically reopen or retry. Not imported by production.
import { claimCheckoutAcceptanceDraft, finalizeCheckoutAcceptanceDraft, hashTrustedCatalogDraft } from "./contract-checkout-session-draft.js";
import { acceptCheckoutOnServerDraft, verifyClaimCapabilityDraft } from "./contract-checkout-server-adapter-draft.js";
import { validateContractSnapshot } from "./contract-confirmation.js";
export async function acceptOneTimeCheckoutDraft({
  db, claimId, accessToken, checkoutSessionId, consent, catalog,
  now = () => new Date().toISOString()
}) {
  if (!db?.prepare || !catalog || typeof catalog !== "object") {
    throw new TypeError("Trusted checkout configuration required");
  }
  if (!await verifyClaimCapabilityDraft(db, claimId, accessToken)) {
    throw new Error("Claim capability not verified");
  }
  const claim = await db.prepare("SELECT id, customer_email, payment_status FROM claims WHERE id = ?")
    .bind(claimId).first();
  if (!claim || claim.id !== claimId || claim.payment_status !== "pending") {
    throw new Error("Claim not eligible");
  }
  // Reject malformed consent before consuming the one-time checkout session.
  // The evidence builder repeats these checks independently during archive creation.
  if(consent?.affirmative !== true || consent?.termsAccepted !== true ||
     consent?.scheduleAccepted !== true || consent?.withdrawalNoticeAcknowledged !== true ||
     consent?.privacyNoticeAcknowledged !== true ||
     typeof consent?.earlyPerformanceRequested !== "boolean" ||
     typeof consent?.earlyPerformanceConsequencesAcknowledged !== "boolean" ||
     consent.earlyPerformanceRequested !== consent.earlyPerformanceConsequencesAcknowledged ||
     consent.earlyPerformanceTextVersion !== "BXC-EARLY-001-v0.1") {
    throw new Error("Invalid checkout consent; session not consumed");
  }
  // Catalog MUST be a trusted server-side, versioned constant with real annex hashes.
  const catalogSha256 = await hashTrustedCatalogDraft(catalog);
  const acceptedAt = now();
  if (Number.isNaN(Date.parse(acceptedAt))) throw new Error("Invalid server timestamp");
  // Preflight the immutable contract catalog before the irreversible session transition.
  // Do not strand a session in 'consuming' because a document is missing or malformed.
  const preflight = validateContractSnapshot({
    ...catalog,orderId:checkoutSessionId,customerEmail:claim.customer_email,acceptedAt,
    earlyPerformanceRequest:consent.earlyPerformanceRequested
      ? {textVersion:consent.earlyPerformanceTextVersion,requestedAt:acceptedAt}
      : null
  },{allowUnicode:true});
  const requiredDocuments = ["terms","schedule","withdrawal","privacy"];
  if(preflight.acceptedDocuments.length !== requiredDocuments.length ||
     requiredDocuments.some(id=>!preflight.acceptedDocuments.some(doc=>doc.id===id))) {
    throw new Error("Incomplete trusted contract catalog; session not consumed");
  }
  await claimCheckoutAcceptanceDraft({
    db, sessionId: checkoutSessionId, claimId,
    customerEmail: claim.customer_email, contractCatalogSha256: catalogSha256,
    nowIso: acceptedAt
  });
  // If this or the next step fails, keep 'consuming'. Reconciliation is required.
  const archived = await acceptCheckoutOnServerDraft({
    db, claimId, accessToken, checkoutSessionId, consent, catalog,
    now: () => acceptedAt
  });
  await finalizeCheckoutAcceptanceDraft({
    db, sessionId: checkoutSessionId, claimId, snapshotSha256: archived.snapshotSha256
  });
  return { status: "accepted", checkoutSessionId,
    snapshotSha256: archived.snapshotSha256,
    acceptanceEventSha256: archived.acceptanceEventSha256 };
}
// PayPal create-order must subsequently require a finalized 'accepted' session
// bound to the claim. Payment verification remains independent of acceptance.
