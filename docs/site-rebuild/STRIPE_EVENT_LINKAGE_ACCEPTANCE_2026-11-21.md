# Stripe Event Linkage — Acceptance Record
Date: 2026-11-21
Scope: isolated BoxVia Orders Sandbox only
Status: IMPLEMENTED / AUTOMATED ACCEPTANCE PENDING LIVE RUN VERIFICATION

## Verified historical evidence
- Prior owner-provided GitHub Actions D1 audit reported one paid `one-question-review` order for USD 50 in Stripe Test Mode.
- One verified attempt, one fulfillment outbox entry and one processed Stripe completion event were observed.
- The earlier schema did not provide direct event-to-order linkage. The historical event must remain UNESTABLISHED for direct linkage until independently reconciled. Do not fabricate or infer the mapping.
- Owner-provided GitHub screenshots show the additive sandbox D1 migration and offline linkage test workflow green; these do not independently prove that the updated settlement handler has passed its subsequent deployment tests.

## Implemented controls
1. Future verified Stripe checkout.session.completed events use the existing D1 transactional batch to insert a `stripe_event_order_links` row tying event ID, order ID, attempt ID, Stripe session ID and payload digest.
2. The processed marker is conditional on a matching linkage record; a successful new order transition without a new link is rejected by the handler.
3. Replay retains the existing paid-once order latch and fulfillment uniqueness. The historical record is not backfilled.
4. The read-only postpayment audit reports verified linkage separately from settlement evidence.
5. Sandbox deployment no longer creates a redundant synthetic request on every code change.

## Outstanding acceptance gates
- Confirm GitHub Actions offline HTTP acceptance and isolated deployment PASS for commits following the linkage change; review failing step logs if any.
- Confirm remote sandbox D1 schema contains `stripe_event_order_links` and read-only audit distinguishes historical UNESTABLISHED linkage.
- Execute a **new** isolated Stripe Test Mode payment for an independently created authorized order, with both $50 services covered in separate runs; verify event linkage, one verified attempt, one fulfillment and replay safety. No real money or customer data.
- Verify PayPal sandbox acceptance independently for both $50 services. Stripe success is not PayPal acceptance.
- Only after the two $50 services satisfy both provider gates, extend server-authoritative fixed-price flow to $200 and quotation-first services; do not accept client-provided amounts.
- Complete /library/, audience routes, legal/privacy and RU working translation review of EN public pages; final release requires separate owner approval.

## Release boundary
Production, main, real PayPal transactions and existing $20 historical records remain unchanged. No production readiness claim is made by this document.
