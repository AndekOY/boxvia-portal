# BXC Sandbox — minimal activation checklist (MINIMAX)

**State:** draft code prepared, NOT deployed, PayPal disabled, no E2E PASS.

## Draft files
- `wrangler.bxc-sandbox.jsonc` — isolated Worker name and sandbox D1 binding; no production D1.
- `cloudflare/bxc-sandbox-worker-draft.js` — checkout session, acceptance, public catalog metadata, guarded PayPal.
- `cloudflare/bxc-sandbox-public/checkout/index.html` — manual sandbox UI, explicit consent, PayPal return.
- `cloudflare/paypal-contract-wired-draft.js` — sandbox return URL and sandbox-only approval URL.

## Blocker 1 — approved catalog (do not invent values)
Set server-only `BXC_CONTRACT_CATALOG_JSON` to a complete JSON object satisfying `validateContractSnapshot` in `cloudflare/contract-confirmation.js`, including:
`productId=check-a-claim`, `productVersion`, `exactScope`, `termsVersion`, `scheduleVersion`, `providerName`, `providerAddress`, `providerContact`, `totalPrice=20.00`, `currency=USD`, `taxDisclosure`, `deliveryRule`, `reportLanguage=English`, `deliveryChannel`, and exactly three `acceptedDocuments` objects for terms/schedule/withdrawal with version and real SHA-256 of the approved immutable document bytes. Also set `documentUrls` (HTTPS URLs for terms/schedule/withdrawal/privacy) and `privacyVersion`. Do not place fake hashes or legal wording in the catalog. `orderId`, `acceptedAt`, `customerEmail` are assigned by the server for each actual acceptance and must not be taken from a browser.

**Legal stop gate:** verify Polish/EU consumer contract disclosures, VAT/tax disclosure, cancellation/withdrawal notice, early-performance request where applicable, privacy/GDPR, and contract confirmation delivery. The current UI records acknowledgement but does NOT implement an optional early-performance request or send a durable contract confirmation. Do not enable live checkout until resolved.

## Blocker 2 — isolated deploy (operator only)
Review the configuration and ensure sandbox D1 database ID is correct. Use a separate Cloudflare Worker name and hostname. Configure sandbox PayPal credentials as secrets, never in source. Deploy with explicit config only:

`npx wrangler deploy --config wrangler.bxc-sandbox.jsonc`

Before a sandbox PayPal run, set `PAYPAL_CHECKOUT_ENABLED=true` only on this isolated Worker, with `PAYPAL_ENV=sandbox`, `BXC_SANDBOX_ONLY=true`. Do not edit production `wrangler.jsonc` or deploy the draft entrypoint as production. Ensure the sandbox claim has a valid capability token; do not reuse the existing Stage8 sessions.

## Blocker 3 — single E2E, no test proliferation
1. Fresh sandbox claim + capability token.
2. Open sandbox `/checkout/`; review actual documents; explicitly accept.
3. PayPal sandbox buyer approves; return and re-enter capability token; capture sandbox order.
4. Verify PayPal COMPLETED, D1 claim paid, linked order, notification outbox and human-visible fulfillment queue.
5. STOP on the first failure; fix only that blocker. No production payment or deployment.

## Current caveats
- Sandbox UI is manual test harness, not final commercial UX.
- Provider GET order and capture rely on real PayPal sandbox credentials; not called yet.
- Contract confirmation delivery is not implemented in the new sandbox flow.
- The D1 repair trigger is an incident-recovery mechanism, not the normal payment path.
