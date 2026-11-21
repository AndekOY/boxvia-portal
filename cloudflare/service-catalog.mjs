// Central authoritative service definitions for the planned unified order flow.
// Do not activate checkout from this module without provider verification and D1 migrations.
export const SERVICE_CATALOG = Object.freeze({
  "one-question-review": Object.freeze({ title: "One Question Review", currency: "USD", fixedPriceMinor: 5000, startingPriceMinor: 5000, quoteRequired: false }),
  "ai-governance-review": Object.freeze({ title: "Focused AI Governance Review", currency: "USD", fixedPriceMinor: 5000, startingPriceMinor: 5000, quoteRequired: false }),
  "pre-decision-review": Object.freeze({ title: "Independent Pre-Decision Review", currency: "USD", fixedPriceMinor: null, startingPriceMinor: 20000, quoteRequired: true }),
  "technical-pilot": Object.freeze({ title: "Technical Pilot", currency: "USD", fixedPriceMinor: null, startingPriceMinor: 25000, quoteRequired: true }),
  "faar-stage-1": Object.freeze({ title: "Project Definition Review", currency: "USD", fixedPriceMinor: null, startingPriceMinor: 25000, quoteRequired: true }),
  "ai-governance-gap-assessment": Object.freeze({ title: "AI Governance & Compliance Gap Assessment", currency: "USD", fixedPriceMinor: null, startingPriceMinor: 30000, quoteRequired: true })
});
export function getServiceDefinition(serviceCode) {
  return typeof serviceCode === "string" && Object.hasOwn(SERVICE_CATALOG, serviceCode)
    ? SERVICE_CATALOG[serviceCode] : null;
}
export function resolveOrderPrice(serviceCode, acceptedQuote = null) {
  const service = getServiceDefinition(serviceCode);
  if (!service) throw new Error("Unknown or retired service");
  if (!service.quoteRequired) {
    if (acceptedQuote !== null) throw new Error("Fixed-price service does not accept client quote");
    return Object.freeze({ amountMinor: service.fixedPriceMinor, currency: service.currency });
  }
  if (!acceptedQuote || acceptedQuote.serviceCode !== serviceCode ||
      acceptedQuote.currency !== service.currency ||
      acceptedQuote.status !== "accepted" ||
      !Number.isSafeInteger(acceptedQuote.amountMinor) ||
      acceptedQuote.amountMinor < service.startingPriceMinor ||
      typeof acceptedQuote.scopeDigest !== "string" ||
      !/^[a-f0-9]{64}$/.test(acceptedQuote.scopeDigest)) {
    throw new Error("A verified accepted quote is required");
  }
  // Caller must load the quote from trusted server-side persistence, never from browser input.
  return Object.freeze({ amountMinor: acceptedQuote.amountMinor, currency: service.currency });
}
