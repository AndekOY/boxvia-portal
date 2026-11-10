// Draft-only PayPal preflight. Not imported by production worker.js.
// Must be called BEFORE any PayPal create-order API call or reuse of an existing order.
import { readAcceptedCheckoutDraft } from "./contract-checkout-acceptance-draft.js";
import { verifyClaimCapabilityDraft } from "./contract-checkout-server-adapter-draft.js";
const sessionPattern = /^[A-Za-z0-9_-]{6,100}$/;
export async function requireAcceptedCheckoutForPayPalDraft({
  db, claimId, accessToken, checkoutSessionId, expectedAmount = "20.00"
}) {
  if (!db?.prepare || !Number.isSafeInteger(claimId) || claimId < 1 ||
      !sessionPattern.test(checkoutSessionId || "") || expectedAmount !== "20.00") {
    throw new TypeError("Invalid PayPal acceptance gate context");
  }
  if (!await verifyClaimCapabilityDraft(db, claimId, accessToken)) {
    throw new Error("Claim capability not verified");
  }
  const session = await db.prepare(
    "SELECT claim_id, customer_email, status, snapshot_sha256 FROM contract_checkout_sessions WHERE session_id = ?"
  ).bind(checkoutSessionId).first();
  if (!session || session.claim_id !== claimId || session.status !== "accepted" ||
      !/^[a-f0-9]{64}$/.test(session.snapshot_sha256 || "")) {
    throw new Error("Accepted checkout session required");
  }
  const claim = await db.prepare(
    "SELECT id, customer_email, payment_status FROM claims WHERE id = ?"
  ).bind(claimId).first();
  if (!claim || claim.id !== claimId || claim.customer_email !== session.customer_email ||
      !["pending", "paid"].includes(claim.payment_status)) {
    throw new Error("Claim and checkout session mismatch");
  }
  const archive = await readAcceptedCheckoutDraft(db, checkoutSessionId);
  if (archive.snapshotSha256 !== session.snapshot_sha256 ||
      archive.snapshot.orderId !== checkoutSessionId ||
      archive.snapshot.customerEmail !== claim.customer_email ||
      archive.snapshot.productId !== "check-a-claim" ||
      archive.snapshot.currency !== "USD" || archive.snapshot.totalPrice !== expectedAmount ||
      archive.evidence.checkoutSessionId !== checkoutSessionId ||
      archive.evidence.orderId !== checkoutSessionId) {
    throw new Error("Accepted contract does not match PayPal order");
  }
  return Object.freeze({ claimId, checkoutSessionId,
    snapshotSha256: archive.snapshotSha256, amount: expectedAmount, currency: "USD" });
}
// Production integration must enforce this gate for BOTH PayPal create and capture,
// including existing-order reuse. A DB binding from PayPal order to session is needed.
