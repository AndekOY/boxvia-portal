# BXC / PayPal — order-to-payment integration audit
Date: 2026-11-10
Status: DRAFT / STATIC REVIEW / RELEASE HOLD
Branch: draft/bxc-legal-trust-v01

## Scope and branch decision
The commercial checkout integration work belongs to this branch, not the isolated draft/paypal-guest-checkout-v01 experiment. The latter contains a two-line change in cloudflare/paypal.js and its test protocol; it is not a substitute for legal/contractual checkout.
The existing main Worker serves claim intake, PayPal create/capture and status. Draft BXC modules are NOT imported by production worker.js. No deploy, live payment, D1 migration, or real email is authorized by this review.

## Evidence reviewed
- main README.md, cloudflare/worker.js, cloudflare/paypal.js, assets/claim-cloudflare.js, evidence-check/thank-you/index.html, wrangler.jsonc, paypal-orders-migration.sql (on guest draft where common main baseline remains)
- docs/drafts/PAYPAL-GUEST-001.md
- docs/drafts/bxc-legal-trust-v0.1.md
- docs/drafts/legal-pages/BXC-CHECKOUT-RELEASE-GATES-002.md
- docs/drafts/legal-pages/BXC-CHECKOUT-CONSUMER-LEGAL-GATES-001.md
- cloudflare/contract-paypal-acceptance-gate-draft.js
- cloudflare/contract-checkout-orchestrator-draft.js
- main...draft branch compare metadata
This is a targeted source audit, not a claim that every repository file has been read.

## Actual flow and readiness
1. /evidence-check form -> /api/claim -> Turnstile -> D1 claims + claim_access token: implemented in main baseline; runtime not verified.
2. Browser sessionStorage token -> /thank-you/?request=id: implemented; browser/session loss is a recovery gap.
3. /api/claim-status: returns DB status, not PayPal reconciliation. A paid provider transaction may remain pending in D1 if return/capture fails.
4. /api/paypal/create-order: existing orders reused by claim; current baseline has no immutable contract acceptance/session requirement.
5. PayPal redirect/return: server-side capture only on return or explicit retry; closing the tab can leave a paid/approved transaction unresolved until a reconciliation path runs.
6. /api/paypal/capture-order: verifies provider order, USD 20.00, custom_id, capture status and writes D1; code-level safeguards present, runtime unverified.
7. notification_outbox insertion after paid update: failure is logged and swallowed; captured payment can lack notification. Outbox delivery and report fulfillment are separate proof obligations.
8. Draft BXC acceptance and PayPal gating: separate isolated modules; not wired into worker.js or published UI.

## Blocking defects / decisions
P0-1: Approval of verified legal/consumer/tax/privacy texts, exact immutable annex bytes, language, contact, price and consent copy is pending. Do not wire payment to unapproved catalog.
P0-2: Contract checkout session consumption, archive and finalization are separate D1 statements; partial failure leaves 'consuming'. Require transactional boundary or durable audited reconciliation before release.
P0-3: PayPal provider create is outside D1 transaction. An order can exist at PayPal without local link. Implement stable per-attempt idempotency and reconciliation before any retry.
P0-4: Reject any pre-existing legacy order without verified session link. Enforce claim/session/archive/amount linkage at both create and capture.
P0-5: Frontend must collect separate affirmative legal acknowledgments and early-performance request where applicable; payment alone is not withdrawal waiver.
P0-6: On PayPal return with lost sessionStorage token, customer cannot self-verify status. Design secure recovery without leaking claim data or allowing unauthorized capture.
P0-7: Scheduled reconciliation is needed for provider/DB divergence, outbox insert failures and notification delivery; no false 'paid' or duplicate charge.
P0-8: No actual sandbox D1/PayPal, browser, mobile, mail or production test is evidenced by reviewed files.

## Safe implementation order
A. Pin and approve server-side immutable legal catalog, release gates, consumer-rights classification and data-retention policy.
B. In isolated staging D1, validate current schema, constraints and migrations, with fixtures only.
C. Add atomic acceptance/session archive or explicit 'consuming' reconciliation with immutable audit log.
D. Bind each PayPal attempt to accepted session, order, claim and immutable snapshot; reconcile orphan provider orders before retry.
E. Add browser checkout summary and granular consent UI, with safe session recovery.
F. Add provider status reconciliation and notification outbox recovery; avoid email delivery claims without logs.
G. Execute sandbox tests: valid, expired, wrong token, concurrent, double-submit, cancel, return, browser loss, orphan order, D1 error, PayPal timeout, capture retry, notifications, consumer durable confirmation.
H. Only after owner approval: controlled deploy/rollback plan. No production mutation from this audit.

## Verification labels
SOURCE-CODE PRESENT: main intake and payment endpoints, BXC draft modules.
STATIC DESIGN GAP CONFIRMED: BXC not imported, partial D1 writes, missing released catalog, lack of acceptance in main checkout.
RUNTIME: UNESTABLISHED.
LEGAL/TAX APPROVAL: UNESTABLISHED.
PRODUCTION RELEASE: HOLD.

## Next execution task
Implement and test a narrowly scoped isolated reconciliation design for partial checkout acceptance and PayPal orphan-order linkage, keeping worker.js/main untouched. Review the exact current draft modules and their tests before code edits.
