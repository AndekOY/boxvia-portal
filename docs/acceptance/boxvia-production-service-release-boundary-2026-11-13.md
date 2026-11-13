# BoxVia service forms — Production release boundary review

Date: 2026-11-13  
Status: **HOLD — no Production Worker deployment authorized**  
Method: MINIMAX; repository-based static review only. No secrets read, no Production changes.

## Confirmed

- Production D1 `boxvia-claims` was independently verified with 10 columns, 3 indexes, 0 rows, and no duplicate UUID groups in [read-only audit 43406931146](https://github.com/AndekOY/boxvia-portal/actions/runs/43406931146).
- `wrangler.jsonc` matches in `main` and `audit/service-forms-20261111`; it targets Production Worker `boxvia` and D1 `boxvia-claims`, with `keep_vars: true`.
- The branches differ in `cloudflare/worker.js`, `cloudflare/service-request.js`, and `assets/service-request.js`.
- Current `main` service intake verifies Turnstile `hostname` and `action=service-request`, then sends a Resend email; it requires `TURNSTILE_SECRET_KEY`, `RESEND_API_KEY`, `NOTIFICATION_FROM`, and `NOTIFICATION_TO`.
- Preview branch service intake verifies the same Turnstile hostname/action but persists in D1 and relies on the `/api/owner-notifications` service queue and external polling; it requires `TURNSTILE_SECRET_KEY` and `DB`.
- Preview frontend generates a UUID v4 and reuses it across network retries. Production frontend does not.
- Preview branch owner notifications returns service ID/code only (no customer email or request body). The current `main` endpoint returns an empty service queue.

## Not established by repository inspection

- Whether Production Turnstile secret and public site key are configured for the Production hostname and `service-request` action.
- Whether Production owner polling is configured to target Production endpoint with the correct credential and durable cursor, without Preview/Production cross-delivery.
- Whether Production `RESEND_API_KEY` and notification addresses are present and working; static code cannot prove runtime secrets.
- Whether the final production code, public notice, consent and rate limits are sufficient for launch.

## Minimal recommended release scope

1. Prepare a new release branch from current `main`, not a merge of the divergent audit branch.
2. Port only the approved service intake D1 idempotency logic, matching frontend UUID logic, and service queue changes; avoid Preview diagnostics and unrelated routes.
3. Keep Production notification behavior explicit: **choose** between existing Resend delivery and D1 queue + owner polling. Do not silently switch delivery architecture or risk losing notifications.
4. Verify Turnstile Production hostname/action and presence of secret (never print values).
5. Verify the selected owner notification mechanism, cursor isolation and retry behavior before deployment.
6. Run tests and request explicit GO/NO-GO for Worker deployment. Perform a controlled post-deploy form smoke test and D1/notification audit.

**Decision:** D1 schema gate PASS; Turnstile runtime, notification delivery and exact release diff remain OPEN. Production Worker HOLD.
