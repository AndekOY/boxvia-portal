// Read-only server-side payment gate. The browser cannot assert consent or price.
// Fail closed on missing migration, absent accepted terms, or mismatched quote.
import { evaluateCheckoutEligibility } from "./checkout-eligibility.mjs";
import { getServiceDefinition } from "./service-catalog.mjs";
const sha256 = async value => [...new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value)))].map(x=>x.toString(16).padStart(2,"0")).join("");
export async function getCheckoutEligibility(db, order) {
  if (!db || !order || !getServiceDefinition(order.serviceCode)) return { eligible:false, reason:"invalid_order" };
  const evidence = await db.prepare(
    "SELECT service_code,amount_minor,currency,scope_digest,terms_digest,deliverable,deadline,quote_id,offer_version,offer_digest,offer_accepted_at,confidentiality_version,confidentiality_digest,confidentiality_accepted_at FROM order_terms_acceptances WHERE order_id = ?"
  ).bind(order.orderId).first();
  if (!evidence) return { eligible:false, reason:"consent_missing" };
  if (evidence.service_code !== order.serviceCode || evidence.amount_minor !== order.amountMinor ||
      evidence.currency !== order.currency) return { eligible:false, reason:"order_terms_mismatch" };
  // A digest alone is not a renderable, agreed commercial offer.
  // Require the canonical text source bound to exactly the accepted terms digest.
  const source=await db.prepare(
    "SELECT scope_text,terms_version,offer_text,offer_version,confidentiality_text,confidentiality_version,deliverable,deadline FROM order_document_sources WHERE order_id = ? AND terms_digest = ?"
  ).bind(order.orderId,evidence.terms_digest).first();
  if (!source || typeof source.scope_text!=="string" || !source.scope_text.trim() ||
      typeof source.terms_version!=="string" || !source.terms_version.trim()) {
    return { eligible:false, reason:"canonical_terms_missing" };
  }
  // Revalidate the actual canonical bytes, not merely the previously stored digests.
  // An owner-side change after consent must invalidate payment authorization.
  if (![source.offer_text,source.offer_version,source.confidentiality_text,
        source.confidentiality_version,source.deliverable,source.deadline]
       .every(x=>typeof x==="string"&&x.trim()) ||
      source.offer_version!==evidence.offer_version ||
      source.confidentiality_version!==evidence.confidentiality_version ||
      source.deliverable!==evidence.deliverable ||
      source.deadline!==evidence.deadline ||
      await sha256(source.scope_text)!==evidence.terms_digest ||
      await sha256(source.offer_text)!==evidence.offer_digest ||
      await sha256(source.confidentiality_text)!==evidence.confidentiality_digest) {
    return {eligible:false,reason:"canonical_document_changed"};
  }
  const service=getServiceDefinition(order.serviceCode);
  let quote=null;
  if (service.quoteRequired) {
    if (!evidence.quote_id) return { eligible:false, reason:"quote_missing" };
    quote=await db.prepare(
      "SELECT id,service_request_id,service_code,amount_minor,currency,scope_digest,status,accepted_at,expires_at FROM service_quotes WHERE id = ?"
    ).bind(evidence.quote_id).first();
    if (!quote || quote.status !== "accepted" || !quote.accepted_at ||
        quote.service_code !== order.serviceCode || quote.amount_minor !== order.amountMinor ||
        quote.currency !== order.currency || quote.scope_digest !== evidence.scope_digest ||
        (quote.expires_at && Date.parse(quote.expires_at) <= Date.now())) {
      return { eligible:false, reason:"quote_invalid" };
    }
    const bound=await db.prepare(
      "SELECT service_request_id,quote_id FROM service_orders WHERE id = ?"
    ).bind(order.orderId).first();
    if (!bound || bound.service_request_id !== quote.service_request_id ||
        bound.quote_id !== quote.id) return { eligible:false, reason:"quote_order_mismatch" };
  } else if (evidence.quote_id) return { eligible:false, reason:"unexpected_quote" };
  return evaluateCheckoutEligibility({
    serviceCode:order.serviceCode,
    finalTerms:{serviceCode:evidence.service_code,amountMinor:evidence.amount_minor,
      currency:evidence.currency,scopeDigest:evidence.scope_digest,termsDigest:evidence.terms_digest,
      deliverable:evidence.deliverable,deadline:evidence.deadline,status:"confirmed"},
    offerAcceptance:{accepted:true,documentVersion:evidence.offer_version,documentDigest:evidence.offer_digest,
      acceptedAt:evidence.offer_accepted_at,termsDigest:evidence.terms_digest},
    confidentialityAcceptance:{accepted:true,documentVersion:evidence.confidentiality_version,
      documentDigest:evidence.confidentiality_digest,acceptedAt:evidence.confidentiality_accepted_at,
      termsDigest:evidence.terms_digest},
    acceptedQuote:quote ? {serviceCode:quote.service_code,amountMinor:quote.amount_minor,
      currency:quote.currency,scopeDigest:quote.scope_digest,status:quote.status} : null
  });
}
