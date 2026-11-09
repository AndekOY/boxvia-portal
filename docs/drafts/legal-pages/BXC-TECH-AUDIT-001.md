# BXC-TECH-AUDIT-001 — Cloudflare / D1 / Turnstile / PayPal / Resend / browser storage
2026-11-09 | CODE-BASED TECHNICAL AUDIT | DRAFT / NOT RELEASED / NO PRODUCTION CHANGE

## Audit boundary
Inspected `AndekOY/boxvia-portal` default branch `main` source code: `wrangler.jsonc`, `cloudflare/worker.js`, `cloudflare/paypal.js`, `cloudflare/notifications.js`, `cloudflare/service-request.js`, `cloudflare/schema.sql`, `cloudflare/paypal-orders-migration.sql`, `cloudflare/notification-outbox-migration.sql`, `cloudflare/claim-api.js`, `assets/claim-cloudflare.js`, `assets/paypal-checkout-staged.js`, `assets/service-request.js`, `legal/index.html`, `privacy/index.html`, `evidence-check/index.html`, `evidence-check/thank-you/index.html`, `index.html`. This is source-code evidence, NOT a live Cloudflare dashboard, production D1 data, network trace, PayPal account, Resend account, actual browser cookie inventory or full legal compliance certification. Some feature flags and Cron activation depend on runtime settings not evidenced by repository alone.

## Confirmed implementation facts
1. `wrangler.jsonc`: Worker entrypoint `cloudflare/worker.js`; `ASSETS` static asset binding; D1 `DB` bound to `boxvia-claims`; `keep_vars:true`. Do not reproduce secrets.
2. Check a Claim: `POST /api/claim` checks `CLAIM_INTAKE_ENABLED`, Origin, JSON fields, Turnstile, then stores customer email, claim, source URL, optional version/date in D1 `claims` and stores a SHA-256 capability hash in `claim_access`. The raw browser capability is stored in `sessionStorage` under `boxvia-claim-{id}`.
3. Turnstile: Check a Claim server sends token and `CF-Connecting-IP` value as `remoteip` to Cloudflare siteverify. Other service-request handler sends token for siteverify and checks hostname/action; the code does not explicitly supply remoteip in that handler. This does not establish all data Cloudflare itself collects.
4. D1 `claims`: id, created_at, customer_email, claim_text, source_url, status, payment_status, report_url, notes. Source version/date is inserted into `notes`. SQL reference schema is marked as matching existing D1, not proof of current live row content.
5. PayPal: gated by `PAYPAL_CHECKOUT_ENABLED`; backend obtains OAuth and creates PayPal Orders v2; $20.00 USD is hard-coded and verified; `paypal_orders` stores claim/order IDs, amount, currency, status, capture ID, timestamps. Successful capture is re-read from PayPal and updates D1. Browser thank-you page stores PayPal order ID in `sessionStorage` under `boxvia-order-{id}`. PayPal handles card details on its own checkout.
6. Email: `/api/service-request` verifies Turnstile then sends customer email plus full submitted service fields to configured `NOTIFICATION_TO` via Resend; no D1 insert in that handler. Paid-claim outbox email sends claim ID and customer email to administrative recipient via Resend after verified payment, if runtime config and scheduled trigger are enabled. `notification_outbox` stores event/status/attempts/error/timestamps. Customer-facing durable contract confirmation email is NOT demonstrated by these notification handlers; customer report delivery mechanism is outside these inspected flows.
7. Browser storage: active claim and thank-you scripts use `sessionStorage` for capability/order IDs. A separate `assets/paypal-checkout-staged.js` says it is not loaded by live thank-you page; the live page has its own inline implementation. Do not mistake staged file for live execution.
8. Analytics: `index.html`, `legal/index.html`, `evidence-check/index.html` include Cloudflare Web Analytics beacon script and a beacon token. `privacy/index.html` already discloses analytics. Cookie-free operation cannot be inferred; live browser storage/network evidence is required.
9. Existing public paths: `/legal/` and `/privacy/` already exist and contain meaningful service-boundary and GDPR-related information. Proposed `/legal/terms/`, `/legal/consumer-rights/`, `/legal/cookies/`, etc. are NOT present in main source tree. Avoid overwriting existing legal/privacy text without migration and link audit.
10. Existing public privacy and legal pages list a contact email. The email is **published in source**, but operational deliverability, its suitability for statutory complaints/withdrawals, and business identity verification are NOT established by source alone. Previous draft placeholders should be replaced only after owner confirmation.
11. Existing `/privacy/` includes provisional GDPR Art. 6 bases, data categories, processors, international transfer cautions and unresolved retention. These are source assertions, not an independent compliance finding.
12. `cloudflare/claim-api.js` appears to be a separate older or alternative handler using `CLAIMS_DB` and Resend; `wrangler.jsonc` points to `worker.js` and the examined worker does not import this file. Do not conflate this alternate handler with deployed routing.

## Data inventory for Privacy Notice
| Process | Data | System | Status |
|---|---|---|---|
| Check a Claim intake | email, claim, source URL, source version/date, anti-bot token | Worker -> D1, Turnstile | CODE-CONFIRMED; live feature flag UNKNOWN |
| Capability authorization | hashed capability, claim ID; raw token in browser session | D1 claim_access / sessionStorage | CODE-CONFIRMED |
| Payment | order ID, claim ID, $20 USD, capture ID, status, timestamps | PayPal + D1 | CODE-CONFIRMED; live settings UNKNOWN |
| Paid admin notification | claim ID, email, event status/attempts/error | D1 outbox -> Resend -> operator email | CODE-CONFIRMED; cron/runtime UNKNOWN |
| Other service forms | email, service selection, free-text service inputs, anti-bot token | Worker -> Resend | CODE-CONFIRMED; provider logs UNKNOWN |
| Security | Turnstile token; explicit remoteip on claim route | Worker -> Cloudflare | CODE-CONFIRMED; broader telemetry UNKNOWN |
| Web analytics | beacon script, visitor measurement | Cloudflare Web Analytics | CODE-CONFIRMED inclusion; actual cookies/storage UNKNOWN |
| Delivery/complaints | report email and correspondence | stated on site, delivery implementation not confirmed in audited modules | PARTIAL |

## Privacy draft amendments required
- Identify BoxVia as controller for its website/orders; distinguish any processor role under separate client engagement.
- Disclose separate D1 claim/order/capability/outbox records, email fields in service requests, Resend administrative notifications, PayPal transaction identifiers, Turnstile verification and Cloudflare Web Analytics.
- Mention browser `sessionStorage` capabilities and order identifiers as operational storage; assess whether these are personal data or online identifiers and the relevant retention/erasure implications.
- Do not assert that the claim or notification data are encrypted at rest, EU-only, auto-deleted or subject to a fixed retention period without vendor and runtime evidence.
- Clarify actual purposes and Art. 6 legal bases per flow, recipients/controller-vs-processor roles, contractual safeguards, international transfers and GDPR Art. 13 disclosures.
- Review exposure of free-text service-request content via administrative email; avoid client secrets in public forms and apply BCAF gate before restricted evidence.

## Cookie draft amendments required
- Disclose confirmed presence of Cloudflare Web Analytics and Turnstile scripts and browser `sessionStorage` used for checkout capabilities.
- Explicitly distinguish `sessionStorage` from HTTP cookies; EU ePrivacy storage/access analysis is not limited to cookies.
- No claim that Cloudflare Web Analytics necessarily sets a cookie; no claim that it is exempt from consent in this exact deployment.
- Inspect network/storage for initial load, claim form, Turnstile interaction, PayPal redirect and return, analytics events, mobile and private mode, with consent/no-consent scenarios. Record cookie/storage name, domain, purpose, TTL, provider and necessity.
- External PayPal checkout is a separate origin; document redirects and vendor notice, but do not attribute all PayPal-domain cookies to BoxVia without legal analysis.

## Risk register and follow-up
P0: No verified production retention/deletion/backup policy for D1, Resend, PayPal, email and Cloudflare logs.
P0: No verified live cookie/network/analytics consent audit.
P0: Customer durable contract confirmation and versioned consumer consent are not demonstrated by current notification handlers.
P1: Verify actual runtime flags `CLAIM_INTAKE_ENABLED`, `PAYPAL_CHECKOUT_ENABLED`, `PAYPAL_ENV`, notification variables and Cron trigger in Cloudflare dashboard, without exposing secret values.
P1: Confirm email contact is functional and approved for complaints, withdrawal and GDPR requests.
P1: Confirm provider terms, subprocessors, transfer safeguards, DPA and retention settings.
P1: Check whether `/api/db-health` is necessary to expose publicly; it returns a limited schema-health signal, not data.
P1: Reconcile `/legal/` and `/privacy/` existing routes with proposed eight-page structure.
P2: Review `sessionStorage` capability lifecycle, browser return failure, multi-tab recovery and log redaction.
P2: Verify analytics presence across all HTML pages; reviewed sample pages show beacon inclusion but no complete page-by-page census.

## Verdict
SOURCE-CODE AUDIT: COMPLETED FOR LISTED FILES.
PRIVACY DRAFT: CAN BE MADE MORE FACTUAL, NOT READY FOR RELEASE.
COOKIE DRAFT: REQUIRES BROWSER/NETWORK EVIDENCE.
PRODUCTION ACCOUNT SETTINGS: NOT VERIFIED.
D1 LIVE DATA/RETENTION: NOT ACCESSED.
NO SITE/WORKER/D1/PAYPAL CHANGES.
RELEASE HOLD.
