// Common payment eligibility policy for all BoxVia services.
// Client UI visibility is informational: provider routes must enforce this server-side.
import { getServiceDefinition, resolveOrderPrice } from "./service-catalog.mjs";
const digest = value => typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
export function evaluateCheckoutEligibility({ serviceCode, finalTerms, offerAcceptance, confidentialityAcceptance, acceptedQuote } = {}) {
  const service = getServiceDefinition(serviceCode);
  if (!service) return Object.freeze({ eligible: false, reason: "unknown_service" });
  if (!finalTerms || finalTerms.serviceCode !== serviceCode ||
      !digest(finalTerms.scopeDigest) || !digest(finalTerms.termsDigest) ||
      typeof finalTerms.deliverable !== "string" || !finalTerms.deliverable.trim() ||
      typeof finalTerms.deadline !== "string" || !finalTerms.deadline.trim() ||
      finalTerms.status !== "confirmed") {
    return Object.freeze({ eligible: false, reason: "terms_unconfirmed" });
  }
  if (!offerAcceptance || offerAcceptance.accepted !== true ||
      !digest(offerAcceptance.documentDigest) ||
      !offerAcceptance.documentVersion || !offerAcceptance.acceptedAt ||
      offerAcceptance.termsDigest !== finalTerms.termsDigest) {
    return Object.freeze({ eligible: false, reason: "offer_not_accepted" });
  }
  if (!confidentialityAcceptance || confidentialityAcceptance.accepted !== true ||
      !digest(confidentialityAcceptance.documentDigest) ||
      !confidentialityAcceptance.documentVersion || !confidentialityAcceptance.acceptedAt ||
      confidentialityAcceptance.termsDigest !== finalTerms.termsDigest) {
    return Object.freeze({ eligible: false, reason: "confidentiality_not_accepted" });
  }
  let price;
  try {
    price = resolveOrderPrice(serviceCode, service.quoteRequired ? acceptedQuote : null);
  } catch {
    return Object.freeze({ eligible: false, reason: "price_unconfirmed" });
  }
  if (service.quoteRequired && (!acceptedQuote ||
      acceptedQuote.scopeDigest !== finalTerms.scopeDigest)) {
    return Object.freeze({ eligible: false, reason: "quote_scope_mismatch" });
  }
  if (finalTerms.amountMinor !== price.amountMinor ||
      finalTerms.currency !== price.currency) {
    return Object.freeze({ eligible: false, reason: "amount_mismatch" });
  }
  return Object.freeze({ eligible: true, amountMinor: price.amountMinor, currency: price.currency });
}
