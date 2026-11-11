# BXC — MINIMAX retention and provider verification
Date: 2026-11-11
Status: OPERATIONAL DRAFT / NOT A VERIFIED PRIVACY NOTICE
Scope: Check a Claim, Poland/EU consumer orders, one manually screened order at a time.

## Data minimization and proposed retention (owner approval required)
| Category | Minimum | Proposed operating trigger | Mandatory exception |
|---|---|---|---|
| Unpaid inquiry / claim material | Email, public claim, source URL, order reference | Delete or anonymize 30 days after last meaningful contact if no contract and no active dispute | Preserve only if legal claim or documented legal duty applies |
| Paid claim inputs and working drafts | Minimum evidence required for human assessment | Delete working copies 90 days after delivery, provided no active complaint or dispute | Preserve only necessary portions while legal duty/claim continues |
| Final delivered report | Customer-facing result and order reference | Retain 12 months for service support and complaints, then review and delete unless justified | Longer period where mandatory statutory rights/claims require |
| Contract acceptance and delivery evidence | Exact accepted terms, consent timestamps, order, delivery proof | Retain for the applicable statutory limitation period; do not set a numeric legal deadline without legal validation | Tax/accounting records may require separate periods |
| Payment and accounting records | PayPal transaction/capture ID, gross amount, invoice/tax record | Retain for the actual applicable Polish accounting/tax retention period, to be confirmed with accountant | Do not delete before legal expiry |
| Gmail correspondence | Only relevant order and complaint communications | Remove unnecessary messages after 12 months; preserve required contract, tax, complaint and claim evidence | Statutory duties and disputes |
| Technical logs and backups | Service/provider controlled | Provider settings and actual deletion lifecycle must be checked | Security and statutory requirements |

These are **proposed operating limits**, not established legal retention periods, and do not assert that D1/Gmail currently delete data automatically. Manual deletion is acceptable for the first controlled pilot; log deletion in a small internal record. No new database or scheduled job.

## Processing boundary
- Cloudflare: hosting/Worker, D1, Turnstile if intake enabled; IP may be sent for Turnstile verification. Verify actual dashboard flags, analytics, logs, DPA and transfers.
- PayPal: payment; claim ID in purchase-unit custom_id. Verify business account terms and payer data disclosure.
- Gmail: manual customer correspondence and durable contract confirmation. Verify account settings, retention and transfer disclosures.
- ChatGPT: genuinely anonymized claim information only. No identifiable/pseudonymized personal data without a separately approved lawful process.

## Minimal owner/account checks (no credentials shared)
1. Cloudflare: report whether Web Analytics, Turnstile, logs and additional tracking are enabled for the live domain; inspect checkout in browser developer tools (Network and Application/Cookies) and note observed third-party requests/cookies. Do not copy secret tokens.
2. PayPal: verify actual merchant account identity, published privacy/processing terms, and whether checkout uses only PayPal-hosted payment UI. No real payment needed.
3. Gmail: confirm sender account, whether customer emails are sent manually, account access protections and whether sent confirmations can be retained and retrieved.
4. Accountant or verified tax source: confirm actual VAT classification/rate and invoice obligations for individualized human-performed B2C analytical service supplied from Poland to PL/EU consumers.
5. Consumer legal check: validate 14-day withdrawal, early performance, statutory loss of withdrawal conditions and durable confirmation for this specific service.

## Release decision
**HOLD** until actual facts and approved final privacy disclosures are recorded. No production changes, no automatic deletions, no customer-data collection, no payment enablement. One synthetic sandbox E2E test after release-gate resolution.
