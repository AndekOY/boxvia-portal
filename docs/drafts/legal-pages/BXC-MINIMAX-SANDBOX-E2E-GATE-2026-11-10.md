# BXC MINIMAX — single sandbox E2E gate (2026-11-10)

Status: NOT EXECUTED. No production deployment or PayPal capture.

## Completed in draft branch
- Sandbox-only Worker entrypoint: `cloudflare/bxc-sandbox-worker-draft.js`.
- Routes: POST /api/bxc/checkout-session, POST /api/bxc/accept, existing guarded POST /api/paypal/create-order, POST /api/paypal/capture-order, POST /api/claim-status.
- No change to production `cloudflare/worker.js`.
- Existing D1 repair trigger and negative tests are not substitutes for E2E.

## Only blocking items
1. **Trusted contract catalog**: populate server-only `BXC_CONTRACT_CATALOG_JSON` with the reviewed complete Check a Claim contract snapshot template and *actual* SHA256 of published immutable terms, schedule and withdrawal notice. Do not invent or copy fixture hashes. Confirm legal/consumer disclosures before payment.
2. **Sandbox isolation**: separate Worker, separate D1 binding to `boxvia-bxc-sandbox`, `BXC_SANDBOX_ONLY=true`, `PAYPAL_ENV=sandbox`, `PAYPAL_CHECKOUT_ENABLED=true`, sandbox PayPal client ID/secret. Do not attach to production hostname. Do not expose secrets.
3. **Client checkout UI**: user must review the same versioned contract documents, explicitly affirm each required acknowledgement, and submit the capability token with session and acceptance; then use returned PayPal approval URL. Do not silently auto-accept.
4. **Fulfillment handoff**: after verified capture, check `claims.payment_status='paid'` and a `notification_outbox` entry. Confirm actual operator notification/queue visibility; do not claim service delivered from payment alone.

## One acceptance run — stop on first failure
1. Create a fresh sandbox claim with capability token (do not reuse Stage8/test archives).
2. Review documents in sandbox checkout; POST checkout-session; POST accept with explicit consent; verify accepted archive/session.
3. POST PayPal create-order; approve with PayPal sandbox buyer; POST capture-order; verify PayPal provider capture and D1 paid state.
4. Verify notification_outbox and operational receipt. Capture one trace (claim/session/order IDs, redacted), no sensitive tokens.
5. PASS only if every step succeeds. If any step fails: STOP, fix the specific blocker, repeat once. Do not generate a broad matrix of synthetic tests.

## Important
- The new entrypoint is code only: not deployed and not yet integrated with a client form.
- No actual PayPal sandbox transaction was performed.
- Existing live production payment route remains legacy and must not be enabled for BXC before this gate.
