// Draft-only trusted checkout -> acceptance archive bridge.
// No public route, PayPal capture, payment mutation or email dispatch.
import { buildVerifiedCheckoutAcceptanceDraft } from "./contract-checkout-evidence-draft.js";
import { archiveAcceptedCheckoutDraft, readAcceptedCheckoutDraft } from "./contract-checkout-acceptance-draft.js";
export async function archiveCheckoutAcceptanceDraft({
  db, claimId, accessToken, checkoutSessionId, rawSnapshot, consent,
  verifyClaimCapability, now
}) {
  const prepared = await buildVerifiedCheckoutAcceptanceDraft({
    db, claimId, accessToken, checkoutSessionId, rawSnapshot, consent,
    verifyClaimCapability, now
  });
  const archived = await archiveAcceptedCheckoutDraft({
    db, rawSnapshot: prepared.snapshot, evidence: prepared.evidence, allowUnicode: true
  });
  // Verify the full accepted contract can be reconstructed before returning.
  const readback = await readAcceptedCheckoutDraft(db, archived.orderId);
  if (readback.snapshotSha256 !== archived.snapshotSha256 ||
      readback.evidence.acceptanceEventSha256 !== prepared.evidence.acceptanceEventSha256) {
    throw new Error("Accepted checkout archive readback mismatch");
  }
  return { status: "accepted_archived", orderId: archived.orderId,
    snapshotSha256: archived.snapshotSha256,
    acceptanceEventSha256: prepared.evidence.acceptanceEventSha256 };
}
