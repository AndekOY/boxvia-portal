# Service Request — isolated sandbox runbook (2026-11-11)

Status: PREPARED, NOT DEPLOYED. Owner approval required before any production deployment.

## Boundaries

- Dedicated Worker: `boxvia-service-request-sandbox`.
- Dedicated D1: `boxvia-bxc-sandbox` (never `boxvia-claims`).
- No PayPal routes, checkout, email sender, Resend or production assets.
- No real customer submissions during testing. Use synthetic data.
- This test does not activate BXC legal checkout or payment.

## Local checks (repository root)

```powershell
node --experimental-default-type=module --test cloudflare/service-request-sandbox.test.mjs
npx wrangler deploy --dry-run --config wrangler.service-request-sandbox.jsonc
```

## Prepare sandbox D1 schema

Only against the sandbox database:

```powershell
npx wrangler d1 execute boxvia-bxc-sandbox --remote --file cloudflare/migrations/service-requests-sandbox.sql
```

Confirm the target database name before executing.

## Turnstile prerequisite

Configure a Turnstile widget for the **actual sandbox Worker hostname** and its matching secret. Do not reuse the production Turnstile secret without confirming the hostname and action policy.

```powershell
npx wrangler secret put TURNSTILE_SECRET_KEY --name boxvia-service-request-sandbox
```

The service-request handler requires Turnstile `action=service-request` and exact hostname equality. A synthetic mock test does not replace a live Turnstile challenge.

## Optional isolated deployment (not yet executed)

```powershell
npx wrangler deploy --config wrangler.service-request-sandbox.jsonc
```

The Worker has no HTML test page. Use a test page hosted on its **same origin** with a sandbox Turnstile widget, or an equivalent browser test harness; cross-origin submissions are rejected by design.

After a synthetic submission, confirm manually in the **sandbox** D1 console:

```sql
SELECT id, service_code, status, created_at
FROM service_requests ORDER BY id DESC LIMIT 5;
```

Never display customer emails or request bodies in public logs or screenshots.

## Exit criteria

1. Offline tests pass.
2. Dry-run builds successfully.
3. Sandbox D1 schema exists.
4. Turnstile validates the sandbox hostname and action.
5. Synthetic request returns HTTP 201 and is visible in sandbox D1.
6. PayPal and email endpoints return HTTP 404.
7. Production remains unchanged.

**No GO** for production, real payments or real email is implied by passing these checks.
