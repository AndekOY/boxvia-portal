# BXC-DATA-001 — Actual processing evidence and decision register
Date: 2026-11-10
Status: SOURCE-BOUND TECHNICAL REVIEW; NOT A COMPLETE ARTICLE 13 INVENTORY
Scope: BXC sandbox draft code only. This does not certify the production site.

## Evidence confirmed from draft repository
| Component | Evidence | Status / boundary |
|---|---|---|
| Cloudflare Workers | cloudflare/bxc-sandbox-worker-draft.js and wrangler.bxc-sandbox.jsonc | Draft request processing; separate sandbox Worker, not deployed |
| Cloudflare D1 | wrangler.bxc-sandbox.jsonc, binding DB to boxvia-bxc-sandbox | Sandbox database specified; retention and production binding unknown |
| Cloudflare static assets | wrangler.bxc-sandbox.jsonc, ASSETS from cloudflare/bxc-sandbox-public | Draft checkout UI only |
| PayPal | cloudflare/paypal-contract-wired-draft.js, PayPal Orders OAuth/create/capture and claim-status | Payment integration in sandbox code; disabled by default, not proof of real transactions |
| Claim capability | bxc-sandbox-worker-draft.js, checkout UI | Claim ID and access token submitted to Worker; UI states no browser storage; do not equate with zero logging |
| Contract evidence | bxc-sandbox-worker-draft.js, catalog hashes and acceptance API | Intended storage in D1; actual retention and confirmation dispatch not verified |
| Email | Provider contact owner-confirmed | No verified automated delivery/notification implementation |
| AI providers | Owner confirms AI-assisted human analysis | Provider identity, contract, inputs, storage, training, transfers not verified |
| Analytics/cookies | No actual production page audit performed | Cannot claim absent; must inspect deployed pages |
| Cross-border transfers | Not documented by reviewed code | Cannot infer Cloudflare/PayPal processing countries or GDPR safeguards |
| Security/retention | No verified policies or deletion schedule | Do not invent days or vendor-specific terms |

## Privacy Notice review outcome
- Controller, purpose categories, contact and human-performed nature are grounded.
- Art. 6(1)(b)/(c)/(f) is a plausible *candidate mapping*, not a complete basis-by-purpose assessment.
- Recipient categories remain conditional, not a verified list.
- Exact retention criteria, Art. 13 international-transfer details and complaint contact need final validation against production operation.
- No consent checkbox should imply that merely acknowledging a privacy notice is consent to all processing.
- Do not publish any blanket statement that data never leaves the EEA, is never used for model training, or is deleted after a specific period without evidence.

## Minimum factual owner/operator decisions
1. Identify the actual AI tool/provider used on submitted claim material, whether customer data is entered, and the approved data handling mode.
2. Confirm how results and contract confirmation are emailed, which service transports the email, and whether email is retained.
3. Identify actual analytics/cookies on the deployed BoxVia website.
4. Define operational retention periods for claims/reports, contract evidence, payment and accounting records and backups, based on law and necessity.
5. Verify Cloudflare/PayPal and AI/email provider data processing terms and international transfer safeguards.

## Release disposition
PRIVACY CANDIDATE: HOLD for final factual Art. 13 disclosure.
CONTRACT CANDIDATES: HOLD pending mandatory legal review and working checkout/confirmation.
No production modification, no vendor verification claim, no PayPal enablement.
