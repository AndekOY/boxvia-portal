# BXC — MINIMAX legal-to-checkout reconciliation | 2026-11-11
Status: INTERNAL REVIEW / HOLD. No production release or legal approval.
Branch: draft/bxc-legal-trust-v01.

## Documents actually reviewed
- BXC-001 v0.2 EN — General Service Terms: candidate, not approved.
- BXC-002 v0.2 EN — Consumer and Protected Sole Trader Schedule: candidate, not approved.
- BXC-WD-001 v0.3 EN — Withdrawal Instructions and Model Form: candidate, not approved.
- BXC-PRIV-001 v0.2 EN — Privacy Notice: **not publishable** until Article 13 facts are verified.

## Checkout source findings
1. `cloudflare/bxc-sandbox-public/checkout/index.html` displays USD 20 and distinct, initially unchecked mandatory acknowledgements for the four documents. Separate unchecked early-performance request and consequences acknowledgement are present. A mismatched pair is rejected on submit.
2. Checkout retrieves `/api/bxc/catalog`; without an approved `BXC_CONTRACT_CATALOG_JSON` the server fails closed, the payment button remains disabled and draft preview links are shown only for review. This is correct and must remain.
3. `cloudflare/bxc-sandbox-worker-draft.js` previously exposed v0.1 document preview links despite later candidate versions. Corrected in commit `6c70cbc7d41cca3d2a21e74918fe1138ee7e2205`: review-only preview now points to BXC-001 v0.2, BXC-002 v0.2, BXC-WD-001 v0.3 and BXC-PRIV-001 v0.2. These are mutable branch URLs; never treat them as accepted contract documents.
4. The checkout page has no customer-visible, populated **exact claim scope**, report/delivery channel, and lawful start summary tied to the specific order before the PayPal action. The claim ID alone is not sufficient evidence of informed pre-contract disclosure. The server catalog has a general delivery rule but does not prove order-specific display.
5. The form does not show an explicit link to a complete order summary immediately before payment, beyond generic price and service name. Final payment wording and PayPal-side button sequence require verification under Polish Consumer Rights Act art. 17.
6. Contract formation after independently verified PayPal capture is the chosen model in the candidate terms; runtime PayPal sandbox E2E and idempotency have not been evidenced here. Do not infer them from source alone.
7. Manual Gmail confirmation is the approved operating model. The checkout source does not establish actual attachment delivery, verified recipient or dispatch timing. Do not start service until the legally required durable confirmation has been sent.
8. Public EN texts exist; approved RU technical equivalents for the final legal versions have not been verified.

## Only three remaining release gates (MINIMAX)
**LEGAL:** Owner verifies tax/VAT and price, service/digital classification, final consumer/sole-trader withdrawal and performance terms, and actual GDPR Article 13 facts (provider roles, recipients, transfers, retention, cookies, data requirements and rights). Approve complete EN documents with RU technical equivalence.
**CHECKOUT:** Display the populated exact order scope, deliverable, delivery channel, total price/tax, lawful start and immutable versions of all four approved documents before the payment obligation; record the accepted versions and unchecked choices. Keep payment disabled until approved.
**PAYMENT + HANDOFF:** One controlled PayPal sandbox transaction verifies captured USD 20 and order binding, then manually send the full durable confirmation from Gmail to the verified order email before lawful performance. Record the dispatch. PayPal notification alone is not a substitute for server-side verification.

## Explicitly out of scope
Resend, automatic outbound email, service-request Worker, extra D1 request pipeline, cron, CRM, broad test suites, production deployment.

## Release decision
HOLD. No production deployment, live payments, approved catalog injection or publication authorized by this review.
