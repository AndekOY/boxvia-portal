# PayPal Orders API - staged rollout (2026-11-03)

STATUS: CODE STAGED, PAYMENTS OFF, CLAIM INTAKE OFF.

## Implemented

- POST /api/paypal/create-order: requires claim ID + 64-character bearer capability issued at claim creation; creates server-priced USD 20.00 PayPal order; returns hosted PayPal approval URL.
- POST /api/paypal/capture-order: requires same capability; captures with PayPal and independently reads the order to verify COMPLETED, claim custom_id, exactly one completed USD 20.00 capture before setting D1 payment_status to paid.
- POST /api/claim-status: capability-protected claim payment status.
- Capability stored as SHA-256 in claim_access; raw token only returned once to submitting browser and stored in sessionStorage.
- Both PayPal operations fail closed unless PAYPAL_CHECKOUT_ENABLED is exactly true.
- PAYPAL_ENV must be explicitly sandbox or live; never set live for tests.

## Required manual setup, in order

1. Inspect the ACTUAL D1 claims schema before any migration:
   PRAGMA table_info(claims);
   SELECT id, status, payment_status FROM claims ORDER BY id DESC LIMIT 5;
2. Run cloudflare/paypal-orders-migration.sql in the Cloudflare D1 console for boxvia-claims. It only creates paypal_orders and claim_access; do not run cloudflare/schema.sql against existing production data.
3. Verify both tables with SELECT name FROM sqlite_master WHERE type='table' AND name IN ('claims','paypal_orders','claim_access');.
4. Create PayPal Developer REST app in Sandbox. In Cloudflare Worker settings store PAYPAL_CLIENT_SECRET as encrypted Secret; store PAYPAL_CLIENT_ID as Variable or Secret; set PAYPAL_ENV=sandbox. Never commit credentials or paste secret into chat.
5. Leave CLAIM_INTAKE_ENABLED=false and PAYPAL_CHECKOUT_ENABLED=false until staging tests pass.
6. Test /api/health, /api/db-health and that all PayPal endpoints return HTTP 503 when payment gate is off.
7. Perform authenticated Sandbox end-to-end tests in a controlled environment with test claim: invalid token, another claim ID, invalid order ID, duplicate capture, cancelled checkout, wrong amount, and PayPal API failure. Confirm paid status changes ONLY after PayPal verifies a completed USD 20.00 capture. Existing claim #1 has no access capability and must not be used for checkout.
8. Wire staged assets/paypal-checkout-staged.js into the thank-you page only after Sandbox checks. Remove the legacy PayPal payment link when enabling the new flow; never expose both. The staged script is intentionally NOT loaded by the live page.
9. Complete notification delivery, privacy/retention and abuse-control tests. Only then consider CLAIM_INTAKE_ENABLED=true and PAYPAL_CHECKOUT_ENABLED=true.
10. Before live mode, test PayPal webhooks/reconciliation and customer notification; do not assume browser return always happens. Decide how to reconcile paid orders after interrupted browser sessions.

## Important current limits

- No automatic email notification or webhook reconciliation implemented.
- No production payment tested. No D1 migration executed by this GitHub change.
- Claim IDs are not payment credentials; possession of a claim ID cannot initiate checkout.
- The existing static thank-you page intentionally says payment is unavailable.
- PayPal may change API response shapes; Sandbox testing is required before activation.
- Payment gate is fail-closed, but production readiness also requires rate limiting, logging hygiene, replay/idempotency and operational review.
