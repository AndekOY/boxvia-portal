# BXC checkout / PayPal draft release gates — 2026-11-10

Status: DRAFT / NOT APPROVED FOR PRODUCTION. No deployment, DB migration or live mail.

## Implemented in isolated draft modules
- HTTP route adapter: `cloudflare/contract-checkout-route-draft.js` (disabled by default, not imported by worker.js).
- Session creation and one-time consumption: `contract-checkout-session-draft.js`.
- Archive and acceptance: `contract-checkout-orchestrator-draft.js`.
- PayPal create/capture gating: `paypal-contract-wired-draft.js`, not imported by production worker.js.
- Migration files: `contract-acceptance-archive-draft.sql`, `contract-checkout-sessions-draft.sql`, `contract-paypal-link-draft.sql`. None applied.

## Blocking issues before enabling any endpoint
1. Review real legal texts and annexes; pin immutable server-controlled canonical bytes, hashes, versions, provider identity, tax disclosures and consent copy. Current catalog is only an injected parameter, not an approved published catalog.
2. Ensure checkout session ID and acceptance timestamp are server issued. Verify claim_access schema, existing claims.payment_status, D1 foreign keys and indexes against actual deployed DB.
3. Session consumption + acceptance archive + finalization currently use separate D1 statements, NOT one transaction. On partial failure status remains consuming; implement audited reconciliation or a single DB transactional write boundary before production.
4. PayPal provider call is outside D1 transaction. If PayPal creates an order but DB linkage fails, use stable idempotency key and reconcile with provider before allowing another attempt. Existing PayPal idempotency key is claim-only and requires redesign for session binding.
5. Existing PayPal handler returns previously created order by claim. Must reject legacy unlinked orders and prevent cross-session reuse. Capture must check linkage both before capture and before recording paid state.
6. Frontend must collect affirmative, granular consent and submit the issued session ID to both PayPal endpoints. Never infer consent from payment.
7. Implement tested retention, deletion/legal-hold and GDPR access policy for immutable acceptance archive; do not apply no-delete triggers without legal approval.
8. Perform end-to-end sandbox tests: happy path, wrong token, expired session, double submit, concurrent requests, orphan PayPal order, capture retry, PayPal timeout, D1 failure, missing email and full PDF attachments. No real email until approved production test.
9. Confirm consumer withdrawal notices and any early-performance request without automatic waiver. Obtain legal review before release.

## Safe release sequence
Approve documents and data retention -> validate schema in isolated D1 -> apply reviewed migrations -> test routes and PayPal sandbox with dedicated test fixtures -> audit reconciliation -> approve production deployment -> verify real Gmail receipt after release.

Do not interpret CI mock/structural tests as proof of live payment, D1 or email delivery.
