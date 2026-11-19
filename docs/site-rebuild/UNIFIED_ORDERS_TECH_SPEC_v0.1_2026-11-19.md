# BoxVia Unified Orders - Technical Specification v0.1
Date: 2026-11-19
Status: DRAFT IMPLEMENTATION SPEC / NO PAYMENT ACTIVATION
Owner-approved scope: two $50 services first, PayPal + Stripe, then four remaining services.
Target: isolated sandbox only. Production and main HOLD.

## 1. Existing evidence
The owner confirmed a successful real-money $20 Check a Claim purchase. The source review found cloudflare/paypal.js verifies exact USD 20.00 captures and persists claim-specific records; cloudflare/notifications.js sends claim-specific notifications; cloudflare/service-request.js independently accepts and deduplicates service_requests using Turnstile and request_key. The site Preview has no D1 and payment flags are disabled. Thus the current site Preview is NOT a payment test environment.

## 2. Service catalog and authoritative prices
Service identifiers must match existing form codes:
- one-question-review: USD 50.00, fixed, quote_required=false
- ai-governance-review: USD 50.00, fixed, quote_required=false
- pre-decision-review: USD 200.00, fixed, quote_required=false
- technical-pilot: from USD 250.00, quote_required=true
- faar-stage-1: public name Project Definition Review, from USD 250.00, quote_required=true
- ai-governance-gap-assessment: from USD 300.00, quote_required=true
Check a Claim remains legacy-only; never present as a new catalog choice. No client-supplied amount, service title, or quote accepted as authoritative.

## 3. Lifecycle
service_request (Turnstile, privacy consent, dedupe) -> intake_accepted -> [quote_required: scope_proposed -> quote_accepted] -> order_pending -> provider_checkout -> payment_pending -> payment_verified -> fulfillment_ready -> in_progress -> delivered.
Exception states: cancelled, payment_failed, refunded, disputed, expired, manual_review.
Only server-issued immutable order IDs and authorized customer capabilities may initiate checkout or inspect status. A redirect or client callback is not proof of payment.

## 4. Proposed D1 schema (migration must be reviewed against existing schema before execution)
service_orders: id (opaque UUID PK), service_request_id (FK), service_code, price_minor INTEGER, currency TEXT CHECK USD, quote_id nullable, status, customer_capability_hash, created_at, updated_at, paid_at.
payment_attempts: id UUID PK, order_id FK, provider ENUM paypal|stripe, provider_order_id UNIQUE scoped to provider, provider_payment_id UNIQUE scoped to provider nullable, status, amount_minor, currency, created_at, verified_at.
payment_events: provider, event_id, event_type, payload_digest, received_at, processed_at; UNIQUE(provider,event_id).
service_quotes: id UUID PK, service_request_id, service_code, price_minor, currency, scope_digest, accepted_at, expires_at.
fulfillment_outbox: id PK, order_id UNIQUE, status, attempts, last_error, timestamps.
No migration execution until schema review and backup/rollback plan.

## 5. Provider rules
PayPal: server creates order using authoritative USD 50.00, sends provider idempotency key, checks provider-side completed capture, order identity, amount and currency before transactional state transition. Preserve existing legacy $20 callbacks and records until retirement.
Stripe: server creates Checkout Session with fixed/approved amount and metadata order_id; signed webhook verifies raw request body and Stripe-Signature against environment-specific secret; confirm paid status, expected order, amount, currency and provider IDs; dedupe event IDs. Redirect is informational only. Do not store card data.
Cross-provider: one order can be paid only once; second provider success after first must go to manual reconciliation/refund handling, not trigger duplicate fulfillment. Outbox delivery must be idempotent.

## 6. API design (proposed, not yet implemented)
POST /api/orders/create: customer capability + service_request_id; server resolves service/quote, creates idempotent order; returns opaque order handle.
POST /api/orders/checkout: capability + order handle + provider; server checks pending state, returns trusted provider URL.
GET /api/orders/status: capability + order handle; no PII leak.
POST /api/stripe/webhook: raw signed Stripe event; no browser authorization; dedupe, validate and reconcile.
PayPal capture/status routes for generic orders should be distinct from /api/paypal/create-order and /api/paypal/capture-order legacy claim routes.

## 7. Security and compliance gates
Origin and CSRF controls for browser actions, rate limits, Turnstile for intake, opaque customer capability, hashed tokens at rest, no credentials in HTML, trusted provider URLs only, server-side pricing, explicit status transitions, replay-safe event handling, minimal PII, GDPR retention and privacy notice, audited errors without logging secrets.
Provider credentials and test databases must be separately scoped. Never run live card charges as part of automated CI.

## 8. Test matrix / acceptance
Each of two $50 services x PayPal Sandbox and Stripe Test Mode:
- happy path and provider-verified $50.00 capture; correct D1 order and one fulfillment notification
- cancel/abandon, payment failure, duplicate submit, repeated callback/webhook, network retry
- price tampering, wrong currency, forged callback/signature, wrong order, expired capability
- parallel checkout with both providers, double payment/reconciliation, refunds/disputes
- sensitive data boundaries, customer return, owner notifications, accessibility/mobile
Gate PASS requires real sandbox provider evidence and D1 queries. Unit tests alone are insufficient.

## 9. Rollout / retirement
1. Verify existing D1 migration inventory and deployed notification behavior.
2. Build isolated sandbox worker + sandbox D1, credentials and Stripe test webhook; never reuse Production DB.
3. Implement two $50 orders, tests and provider acceptance.
4. Disable new Check a Claim sales only after accepted alternatives and explicit route/redirect decision. Preserve historical claim access and records.
5. Extend order model to four remaining services; quote-first for 'from' pricing.
6. Production release requires separate explicit owner approval.

## Open decisions
- Stripe account activation, supported merchant geography and test credentials: UNESTABLISHED.
- Exact quote acceptance and invoicing workflow for variable-price services: TO DESIGN.
- Historical /evidence-check/ redirect behavior: NOT APPROVED.
- Database migration/rollback scripts and payment-test worker: NOT YET VERIFIED.
