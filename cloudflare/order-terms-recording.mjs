// Persist customer-confirmed terms only from an authenticated, CSRF-checked acceptance route.
// The caller MUST verify order capability, affirmative separate checkboxes and current
// document versions. Never accept client-provided final prices as authoritative.
import { evaluateCheckoutEligibility } from "./checkout-eligibility.mjs";
export async function recordAcceptedTerms(db, order, evidence) {
  if (!db || !order || order.status !== "pending" ||
      evidence?.offerAcceptance?.accepted !== true ||
      evidence?.confidentialityAcceptance?.accepted !== true) {
    throw new Error("Explicit acceptance required");
  }
  const eligibility=evaluateCheckoutEligibility({
    serviceCode:order.serviceCode,
    finalTerms:evidence.finalTerms,
    offerAcceptance:evidence.offerAcceptance,
    confidentialityAcceptance:evidence.confidentialityAcceptance,
    acceptedQuote:evidence.acceptedQuote ?? null
  });
  if (!eligibility.eligible || eligibility.amountMinor !== order.amountMinor ||
      eligibility.currency !== order.currency) throw new Error("Terms are not eligible");
  const quoteId=evidence.acceptedQuote?.id ?? null;
  // Quote/order association must be independently verified by the trusted caller.
  if (evidence.acceptedQuote && !quoteId) throw new Error("Quote ID required");
  const t=evidence.finalTerms,o=evidence.offerAcceptance,c=evidence.confidentialityAcceptance;
  const result=await db.prepare(
    "INSERT OR IGNORE INTO order_terms_acceptances (order_id,service_code,amount_minor,currency,scope_digest,terms_digest,deliverable,deadline,quote_id,offer_version,offer_digest,offer_accepted_at,confidentiality_version,confidentiality_digest,confidentiality_accepted_at) SELECT ?,?,?,?,?,?,?,?,?,?,?,?,?,?,? WHERE EXISTS (SELECT 1 FROM service_orders WHERE id = ? AND service_code = ? AND amount_minor = ? AND currency = ? AND status = 'pending')"
  ).bind(order.orderId,order.serviceCode,order.amountMinor,order.currency,t.scopeDigest,t.termsDigest,
    t.deliverable,t.deadline,quoteId,o.documentVersion,o.documentDigest,o.acceptedAt,
    c.documentVersion,c.documentDigest,c.acceptedAt,order.orderId,order.serviceCode,
    order.amountMinor,order.currency).run();
  if (!result?.success || result.meta?.changes !== 1) throw new Error("Terms already recorded or order unavailable");
  return { recorded:true };
}
