# BXC isolated staging provisioning — draft checklist

**Status:** configuration committed, resources NOT provisioned, no deployment, no PayPal calls.

## Verified repository facts
- Root `wrangler.jsonc` points to Worker `boxvia` and D1 database `boxvia-claims` (production-associated; forbidden for staging).
- Existing BXC Actions workflow is Node/mock CI, not a real D1/PayPal Sandbox integration.
- There is no evidence in the repository of an approved isolated D1 database or PayPal Sandbox credentials.

## Fail-closed bootstrap
- `staging/wrangler.bxc-sandbox.jsonc` defines **different** Worker `boxvia-bxc-sandbox`, `workers_dev:false`, **no D1 bindings**, `PAYPAL_ENV:sandbox`, and `PAYPAL_CHECKOUT_ENABLED:false`.
- `cloudflare/contract-sandbox-probe-draft.js` is a read-only health probe; it cannot create a claim, call PayPal, send email, or mutate D1.
- It is **not** a complete checkout Worker; never treat a successful health response as payment E2E evidence.
- Do not deploy without an explicit isolated account/route and release approval. Never reuse root Wrangler configuration.

## Operator prerequisites
1. Create an isolated Cloudflare D1 database in the appropriate account, distinct from the root production database ID. Record the ID in an internal restricted record, not in public reports.
2. Review migrations and staging schema, then bind the isolated database to `DB` in a separate **untracked** local configuration. Never edit the root production binding.
3. Create a PayPal Sandbox app and sandbox payer, storing client credentials as staging secrets only. Do not set `PAYPAL_CHECKOUT_ENABLED=true` until the legal catalog, checkout endpoint and staging callbacks are ready.
4. Approve an isolated test hostname/route, test data retention and cleanup, and explicit sandbox capture authorization.
5. Execute S01–S12 in `BXC-PAYPAL-SANDBOX-INTEGRATION-GATE-2026-11-10.md` and attach redacted evidence.

## Release gate
Current state: **HOLD**. Mock CI success is not a live Sandbox test. No production migration or payment enablement is authorized.
