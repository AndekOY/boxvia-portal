# BXC — Cloudflare data processing facts and evidence boundary
Date: 2026-11-11
Status: INTERNAL VERIFIED-SOURCE INVENTORY / ACCOUNT SETTINGS UNVERIFIED / HOLD

## Directly verified from GitHub source
- wrangler.jsonc: production Worker `boxvia`, D1 binding `DB` to `boxvia-claims`; `keep_vars: true`. This is repository configuration, not proof of deployed configuration.
- wrangler.bxc-sandbox.jsonc: separate Worker `boxvia-bxc-sandbox`, D1 `boxvia-bxc-sandbox`, `BXC_SANDBOX_ONLY=true`, `PAYPAL_ENV=sandbox`, `PAYPAL_CHECKOUT_ENABLED=false`.
- cloudflare/worker.js: `/api/claim` can collect customer email, claim text, source URL, source version/date, Turnstile token; requires `CLAIM_INTAKE_ENABLED=true`; stores claim details in D1. Live flag unverified.
- cloudflare/service-request.js: service form accepts email and service-specific free text; sends via Resend API to configured notification address after Cloudflare Turnstile. This is a fourth relevant external recipient in the BoxVia system, omitted from earlier Cloudflare/PayPal/Gmail-only inventory. Actual configuration and live use unverified.
- cloudflare/notifications.js: D1-backed notification outbox sends customer email and claim ID to Resend after a verified paid claim, conditional on configured secrets and Cron.
- cloudflare/bxc-sandbox-public/checkout/index.html: consent flags and claim capability entered by user; draft checkout calls BXC endpoints; preview is nonbinding.
- cloudflare/contract-checkout-evidence-draft.js: server acceptance event includes customer email, claim ID, timestamps, document versions and hashes, early performance consent; not automatically evidence that production data exists.
- cloudflare/bxc-gmail-confirmation-adapter-draft.js: Gmail sending is sandbox-only, OAuth-gated and recipient-allowlisted, not proof of active Gmail dispatch.
- cloudflare/retention-draft/: retention scripts exist as drafts, not evidence of scheduled production deletion or actual retention durations.

## Data classes supported by source
Contact: customer email.
Request: claim text, source URL/version, service-specific free text.
Order and payment: claim/order IDs, PayPal order/capture references and paid status.
Legal evidence: acceptance event, document versions/hashes, consent timestamps.
Security: Turnstile verification and access-token hash in D1; platform logs and IP/cookie processing require runtime/provider verification.
Communication: Resend form/notification messages; Gmail draft confirmations.

## Facts NOT established by repository code
Cloudflare account jurisdiction and DPA, subprocessors, transfers, actual storage/backup geography, deployed Worker variables, analytics/cookies/Turnstile settings, D1 row counts or records, deletion execution, log retention, Resend account activation and legal roles, PayPal merchant processing, Google mailbox retention, cross-border transfer safeguards.

## Privacy Notice implication
Do not assert that Cloudflare, PayPal and Gmail are the complete recipient list for BoxVia. Add Resend to factual inventory, with conditional deployment disclosure; avoid asserting live use without account evidence. Final GDPR Article 13 disclosure must distinguish actual BXC processing from the broader BoxVia site, disclose recipient categories and actual transfer/retention criteria, and include mandatory statutory particulars.

## Next evidence to request from owner (no secrets, no customer data)
1. Cloudflare Dashboard > Workers & Pages > boxvia and boxvia-bxc-sandbox: screenshot of Settings > Variables and Bindings with values/tokens redacted; status of deployed Worker versions.
2. Cloudflare Dashboard > D1 > boxvia-claims and boxvia-bxc-sandbox: database metadata and configured region/location, not table rows.
3. Cloudflare Analytics and Turnstile: enabled services, cookie/analytics settings and domains, no visitor records.
4. Cloudflare account DPA/subprocessor and transfer documentation or URLs; Resend account existence/active use.
5. Any retention/cleanup Cron and log settings. No credentials or personal information.

Decision: factual code inventory PASS; live operational verification OPEN; BXC legal release HOLD.
