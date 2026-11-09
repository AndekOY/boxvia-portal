# BXC-RUNTIME-VERIFY-001 — Runtime verification checklist
2026-11-09 | DRAFT / READ-ONLY / NO PRODUCTION CHANGE

Purpose: close gaps between GitHub source code and actual Cloudflare/Resend/PayPal production configuration before Privacy/Cookie notices are approved. Never disclose API keys, secrets, customer emails, raw D1 rows, payment tokens or authentication headers. Screenshots must be redacted. No SQL writes, deploys, config changes, payment tests or real submissions are authorized by this checklist.

## A. Cloudflare Workers (read only)
1. Workers & Pages -> boxvia -> Settings / Variables and Secrets: provide only VARIABLE NAMES and whether configured (not values) for CLAIM_INTAKE_ENABLED, PAYPAL_CHECKOUT_ENABLED, PAYPAL_ENV, TURNSTILE_SECRET_KEY, PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, RESEND_API_KEY, NOTIFICATION_FROM, NOTIFICATION_TO. For non-secret flags, record values only if owner authorizes. Confirm deployed version/commit, environment, routes and Worker name.
2. Settings -> Triggers: Cron schedule present? Record schedule/time zone and active/inactive. Verify current scheduled handler exists in deployed version.
3. Settings -> Bindings: DB -> boxvia-claims; ASSETS; any other bindings. Record names only.
4. Observability/logs: whether logs are enabled, retention settings, sampling and redaction controls; do not export raw request/response logs.
5. Security: Turnstile site key configuration, domain allowlist, challenge mode, any Cloudflare bot/security features that set cookies or collect IP.
6. Web Analytics: site, beacon enabled, privacy settings, any custom tracking and any declared retention.

## B. D1 (read only)
1. D1 -> boxvia-claims -> Tables: screenshot of table NAMES and COLUMN DEFINITIONS only, no customer rows. Check claims, claim_access, paypal_orders, notification_outbox and any additional tables.
2. Verify retention/backup/PITR/export and deletion practices in Cloudflare account and applicable plan/vendor terms. Do not assert retention based only on SQL schema.
3. Verify whether records are removed for unpaid/abandoned claims, paid claims, outbox errors, and backups; document owner-approved retention by data category.

## C. Resend (read only)
1. Domains / Sending: approved sender domain and operational verification (redact sensitive details).
2. API Keys: show only whether a key exists, NEVER key value.
3. Email logs and retention: settings, event/webhook destinations, provider terms, recipient logging and deletion capabilities.
4. Verify what customer-facing contractual confirmation email exists outside inspected Worker modules, if any. Differentiate admin notification from client contract confirmation.
5. Check data processing agreement, subprocessors, processing locations and transfer terms.

## D. PayPal (read only)
1. Confirm environment live/sandbox and business account integration; no secrets.
2. Review what personal data BoxVia receives in transaction API and account reports; record data categories, not customer records.
3. Confirm provider privacy/DPA/controller roles and data retention as applicable; check whether payment receipts and customer contract confirmations are distinct.
4. Do not perform paid checkout as an audit action.

## E. Browser cookie/storage audit (read only)
Use a fresh browser profile and DevTools -> Application -> Storage and Network; capture redacted inventory of HTTP cookies, localStorage, sessionStorage, IndexedDB, scripts and request initiators for:
- / (initial visit)
- /privacy/ and /legal/
- /evidence-check/ before interacting
- Turnstile render/interaction (do not submit a real claim unless separately approved)
- /evidence-check/thank-you/ only with an authorized test request
- PayPal redirect/return only in an explicitly authorized sandbox test
For each item: name, domain, storage type, initiator, purpose, lifetime, whether active before consent, and screenshot reference. Avoid saving raw capability tokens, payment IDs, email or Turnstile tokens in screenshots/HAR.

## F. Release gate
Owner validates actual business address/contact, GDPR controller and provider roles, retention policy and lawful transfer mechanisms. Legal review confirms notice wording and Polish/EU terminal storage consent requirements. Then prepare revised public-facing pages with version/effective date and explicit approval. Until then: INTERNAL DRAFT / RELEASE HOLD.

## Evidence receipt template
| Item | Account/page | Observation | Evidence date | Source type (code/dashboard/browser/vendor) | Redacted attachment | Verified by | Remaining gap |
|---|---|---|---|---|---|---|---|
| Example: Cron active? | Cloudflare Worker Triggers | OPEN | — | dashboard | — | — | runtime unknown |
