# Payment Migration Audit - Check a Claim to Two $50 Services
Date: 2026-11-19
Status: INITIAL SOURCE REVIEW / DESIGN GATE OPEN
Source: working branch work/technical-pilots-first-20261118

## Confirmed by owner
Check a Claim $20 underwent a successful real-money control purchase and operational execution. This is evidence of the tested PayPal route; not of a reusable generic order system, not of Stripe readiness.

## Inspected repository components
- evidence-check/index.html: existing claim form, marketing text and checkout entry.
- assets/claim-cloudflare.js: claim intake client adapter and payment continuation behavior.
- assets/paypal-checkout-staged.js: staged create/capture client calls, with claim-specific session capability.
- cloudflare/worker.js: /api/claim, /api/paypal/create-order, /api/paypal/capture-order, /api/claim-status and /api/service-request routing.
- cloudflare/paypal.js: PayPal OAuth, server-side order creation, capture verification, D1 writes, claim access tokens, explicit $20.00 USD checks.
- cloudflare/service-request.js and assets/service-request.js: existing independent intake for other service pages.
- services/one-question-review/index.html and services/ai-governance-review/index.html: distinct $50 service pages, currently submitting to generic service request route.
- wrangler.site-preview.jsonc: site Preview disables CLAIM_INTAKE_ENABLED and PAYPAL_CHECKOUT_ENABLED and has no D1 binding. Therefore it cannot serve as an end-to-end payment acceptance environment.

## Additional source findings
- cloudflare/service-request.js: existing $50 service forms feed a Turnstile-verified, D1-backed service_requests intake with request_key deduplication; it is not a payment ledger.
- cloudflare/notifications.js: scheduled paid-claim notification outbox explicitly joins claims and paypal_orders and checks USD 20.00; it must be generalized or replaced for $50 paid orders.
- The site work branch does not contain wrangler.service-preview.jsonc; isolated payment testing must use an explicitly verified sandbox branch/config, not assume it is available here.

## Verified architectural constraints
1. PayPal integration is claim-centric. It checks capture amount against exact USD 20.00 and writes to claims, paypal_orders and claim_access; it cannot safely be generalized by merely changing the displayed price.
2. Generic service requests use /api/service-request; they are not yet shown by this review to have verified payment orders.
3. Server-side price validation, provider transaction identity, idempotency and verified capture must be retained in the new design.
4. Stripe code/credentials, webhook, event signature verification and settlement handling have NOT been established in this review.
5. Claim shutdown must not delete historical payment records or break paid-customer return/status paths.

## Next engineering deliverables
A. Map actual D1 schema, existing migration scripts and notifications before editing runtime payment code.
B. Define stable service catalog IDs and immutable server-side pricing (50.00 USD each), service request to order lifecycle, state machine and customer capability.
C. Specify PayPal adaptation and Stripe Checkout + verified webhook with event deduplication and provider-independent order status.
D. Separate isolated payment acceptance environment with sandbox D1, PayPal sandbox, Stripe test mode, secrets, Turnstile test controls and explicit failure/rollback cases. No real client data.
E. Plan retirement of Check a Claim public page, route, callbacks and sitemap only after two $50 paths pass acceptance.
F. Audit /library/ information architecture and existing canonical research links as the separate editorial track.

## Status
Source audit: PARTIAL PASS.
Existing PayPal $20 control purchase: OWNER CONFIRMED.
Generic $50 PayPal flow: UNESTABLISHED.
Stripe $50 flow: UNESTABLISHED.
End-to-end acceptance in site Preview: NOT APPLICABLE until isolated test bindings are provisioned.
Production change: HOLD.
