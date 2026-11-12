# BoxVia isolated Preview Worker deployment runbook

Status: NOT DEPLOYED. No production deployment authorized.

## Scope and isolation
- Preview config: `wrangler.service-preview.jsonc`.
- Worker name: `boxvia-service-preview`, **not** `boxvia`.
- D1 binding: `boxvia-bxc-sandbox` (`baf79e93-cbea-4786-8779-974f3b3afbcc`), **not** production `boxvia-claims`.
- No routes or custom domains in Preview config. Never use `wrangler.jsonc` for this deployment.
- Keep this PR in Draft. Do not merge.

## Prerequisites
1. Confirm the sandbox D1 table exists (already confirmed by owner screenshot).
2. A Cloudflare API token scoped to deploy Workers in the owner's account, stored locally or in protected GitHub environment; do not share token in chat.
3. A dedicated Turnstile sitekey and secret allowing the exact Preview Worker hostname, or a controlled testing strategy. The service handler validates `result.hostname === url.hostname` and `result.action === "service-request"`. Existing production widget/sitekey may not work on Preview.
4. `OWNER_NOTIFICATION_TOKEN` must be a dedicated Preview secret (minimum 32 characters) if testing the owner API. Never reuse production secret.
5. Confirm no live payments are initiated on Preview; payment endpoints exist in the shared Worker code but will be unconfigured if production payment secrets are not added.

## Operator commands (local terminal, in checked-out PR branch)
```sh
npx wrangler deploy --config wrangler.service-preview.jsonc
```
This command **deploys only the named preview Worker** and does not modify production Worker or production D1. The Cloudflare account and Worker name must be checked in the CLI output before proceeding.

Set Preview-only secrets without pasting them into source code:
```sh
npx wrangler secret put TURNSTILE_SECRET_KEY --name boxvia-service-preview
npx wrangler secret put OWNER_NOTIFICATION_TOKEN --name boxvia-service-preview
```
Do not configure production PayPal or Resend credentials on this Worker.

## Smoke checks
1. `GET https://<preview-worker-host>/api/health` should return status ok.
2. Confirm `GET /api/owner-notifications` with no Authorization returns 401 (or 503 until Preview token is configured).
3. Open a Preview-hosted service form and submit a synthetic request using Preview-compatible Turnstile. Do not use personal customer data.
4. Confirm HTTP 201 and `received: true` only after D1 insert.
5. In sandbox D1 Console, execute:
```sql
SELECT id, service_code, status, created_at
FROM service_requests
ORDER BY id DESC LIMIT 10;
```
6. Confirm owner poll with Preview token returns only `{id, code}` for service records. Never send customer email or request text in notifications.
7. Test each of the six service codes and failure cases.
8. Delete synthetic test records after verification:
```sql
DELETE FROM service_requests WHERE customer_email = 'test@example.org';
```
Only execute this deletion against sandbox D1 after reviewing rows.

## Gate
Preview integration remains UNVERIFIED until deployment, hostname-compatible Turnstile, six actual submissions and authenticated poll pass. Owner-only full detail retrieval and retention policy remain separate release gates.
