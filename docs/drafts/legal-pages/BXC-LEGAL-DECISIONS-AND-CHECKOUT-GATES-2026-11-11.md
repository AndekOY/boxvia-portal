# BXC — Legal completion decisions and remaining factual blockers | 2026-11-11
Status: INTERNAL CONTROLLED REVIEW — NOT APPROVED, NOT PUBLISHED. No live payment authorization.

## Confirmed text decisions
1. Use BXC-001 v0.2 EN and BXC-002 v0.2 EN as working contract terms. The product is a human-performed claim analysis; no certification or legal/tax opinion. Exact claim, deliverable and permitted use must be in the individual order, not generic website copy.
2. Use BXC-WD-001 v0.3 EN as the working withdrawal notice. Do not infer loss of withdrawal rights from payment or acceptance. Early performance request and consequences acknowledgment remain separate, unchecked, optional and paired. Without lawful early performance, the 24-hour period does not start during the statutory withdrawal period where applicable.
3. Preserve statutory consumer and protected natural-person sole-trader rights. Do not impose an automatic waiver or override mandatory jurisdiction.
4. Keep manual owner Gmail dispatch after verified PayPal capture, with full accepted order and document copies on a durable medium before lawful performance. PayPal notification is not evidence of completed capture or dispatch.
5. Keep Privacy Notice BXC-PRIV-001 v0.2 explicitly **unpublishable**. Its named providers are the intended stack, not verified DPA roles or international transfer facts.

## Legally relevant unresolved facts — owner/provider evidence required
- TAX: Polish VAT status, EU/cross-border place-of-supply and B2C/B2B treatment, final tax-inclusive USD 20 price and invoice obligations. No assumption that a single USD price solves all tax obligations.
- CLASSIFICATION: Polish consumer-law treatment of a human-performed service delivered as a digital report, and whether any digital-content provisions apply; consumer-facing language obligations and precise pre-contract disclosures.
- GDPR: actual Cloudflare, PayPal and Gmail controller/processor roles, DPA terms, subprocessors, processing countries, transfer safeguards, retention/deletion periods, website cookies/Turnstile/analytics, automated decision-making status, and data subject request procedure.
- CONSUMER: final statutory withdrawal instructions, complaint/ADR disclosures and legal review of payment-button sequence, prior information and durable confirmation.
- EVIDENCE: immutable approved EN documents, complete RU technical equivalents, byte-level hash verification, and express owner approval.

## Checkout technical implementation in draft branch
- Added authenticated POST /api/bxc/order-summary. Requires existing claim access capability, trusted catalog, and a server-defined `ordersByClaimId[claim_id]` record with exactScope, deliverable, deliveryChannel, deliveryRule and lawfulStartRule.
- Fail closed unless individual exactScope, deliveryChannel and deliveryRule match the server contract snapshot fields, preventing a customer from accepting a displayed order that differs from the archived contract.
- Checkout page now requires loading and displaying verified order summary, exact accepted document versions, URLs and SHA-256 before enabling its sandbox payment action.
- Changing claim ID or token clears the verified summary and blocks the action. Unapproved catalog still blocks checkout.
- Current server catalog is **not configured** and no individual approved order records exist. This is intentional: source changes alone do not make payment possible.

## Residual technical issue for next controlled preflight
The current per-claim mapping requires a trusted catalog with order-specific snapshot values. It is suitable for a single reviewed pilot order, not a general multi-order production model. Do not inject a dummy catalog or pretend a generic scope is an individual order. Before enabling sandbox PayPal, verify order-specific archived acceptance and the final payment button/PayPal sequence against the accepted bytes.

## Decision
HOLD / NO-GO. No Resend, automated email, extra request intake, unrelated infrastructure or broad test expansion. Next external inputs are the actual tax/GDPR facts and legal sign-off, not more speculative copy.
