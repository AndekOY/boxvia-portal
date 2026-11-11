# BXC — Minimal Checkout privacy source audit | 2026-11-11
Status: CODE-VERIFIED ONLY / LIVE BEHAVIOR NOT VERIFIED
Branch: draft/bxc-legal-trust-v01

## Sources reviewed
- `wrangler.jsonc`: production Worker `boxvia`, D1 binding `boxvia-claims`, ASSETS; `keep_vars: true` means production secrets and runtime variables are not enumerated in this file.
- `cloudflare/worker.js`: POST `/api/claim` collects email, exact claim, primary source URL, optional version/date, Turnstile token, acknowledgments; saves claim to D1, creates hashed capability; sends Turnstile verification including `CF-Connecting-IP` to Cloudflare. Claim intake is gated by `CLAIM_INTAKE_ENABLED`.
- `wrangler.bxc-sandbox.jsonc`: separate `boxvia-bxc-sandbox` Worker and D1 `boxvia-bxc-sandbox`; `PAYPAL_ENV=sandbox`; `PAYPAL_CHECKOUT_ENABLED=false`.
- `cloudflare/bxc-sandbox-public/checkout/index.html`: claim ID, access token and acknowledgments; no direct analytics, ad pixel, third-party JS or browser local/session storage code observed. API calls same-origin; PayPal redirect after server checkout acceptance. This is a source review, not browser traffic observation.
- `cloudflare/bxc-sandbox-worker-draft.js`: catalog, verified order summary, session, acceptance and payment API. Order data is stored in D1 by separate imported modules; no direct client-side card collection.
- `cloudflare/paypal-contract-wired-draft.js`: PayPal API called server-side; sends claim ID as PayPal purchase-unit `custom_id`; handles capture and persistence. This is not proof of live PayPal merchant configuration.

## Minimal security fix
The draft checkout previously accepted any hostname ending in `.paypal.com` for a redirect. Restricted to the exact `www.sandbox.paypal.com` host for the sandbox-only flow; rejects URLs containing credentials. Commit `2423fdafbfcdcbe16b032f36014be89978a7ec30`. Not deployed or runtime tested.

## Privacy facts supported by code
1. Claim intake processes email, claim statement, source URL and optional source version/date; the Turnstile verification path can send visitor IP to Cloudflare.
2. Checkout processes claim ID, access token, consent flags and contract/payment references. Token is not explicitly written to browser storage; it is transmitted to same-origin endpoints.
3. Cloudflare D1 stores operational claim/payment/contract evidence; exact records, deletion schedule and account-level logs not established.
4. PayPal receives a claim ID as order reference, plus payment information within its own flow. The provider's independent collection of payer data is not inspectable in this repository.
5. Manual Gmail confirmation is an owner-approved operating process, not a verified live configuration.
6. No direct analytics or third-party browser scripts are present in the examined sandbox checkout HTML. This does NOT prove that the deployed site has no cookies, telemetry or third-party requests.

## Three factual checks only — account/traffic evidence needed
- Cloudflare dashboard: production/sandbox variables and enabled analytics/Turnstile/logging; live browser network and cookie observation. Do not share secret values.
- PayPal and Google: actual account processing terms, controller/processor roles, international transfer disclosure and manual Gmail retention settings.
- BoxVia operator: simple deletion policy for claim inputs, contract records, payment/accounting records and sent emails that respects applicable statutory retention. Exact statutory period and any backup lifecycle need confirmation.

## Decision
No additional Worker, D1 schema, analytics tool, email automation or test suite. No live customer intake or payment authorization. Keep legal/privacy candidate unpublished until facts and required Article 13 disclosures are verified. This is an internal implementation audit, not a GDPR compliance certification.
