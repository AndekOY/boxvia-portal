# Unified Orders - Sandbox Provisioning and Acceptance Runbook v0.1
Date: 2026-11-19
Status: PREPARATION ONLY / NO DEPLOYMENT AUTHORIZED
Branch: work/technical-pilots-first-20261118

## Isolation
- Existing site Preview boxvia-site-preview-20261118 has no D1 and both legacy payment/intake flags false. Keep it unchanged as a public editorial Preview.
- Use a new dedicated payment sandbox Worker and dedicated D1 database with test records only.
- Do not point any preview to the Production D1 database, production PayPal secrets or live Stripe keys.
- Cloudflare account ID and API token may be reused only where authorized and scoped; secrets stay in GitHub Actions or Cloudflare secret storage, never source files.
- No live charges, automatic deployment, migration execution, or production changes are part of this runbook.

## Existing isolated infrastructure discovered\n- Branch audit/service-forms-20261111 contains wrangler.service-preview.jsonc, with Worker boxvia-service-preview and D1 boxvia-bxc-sandbox (database ID baf79e93-cbea-4786-8779-974f3b3afbcc).\n- Its deployment workflow is .github/workflows/boxvia-preview-deploy.yml and uses the GitHub boxvia-preview environment.\n- This D1 is an EXISTING service-form sandbox, not a newly provisioned payment database. Do not apply the unified-orders migration to it without checking its schema and isolation requirements.\n- The site branch has no wrangler.service-preview.jsonc, so the dedicated payment sandbox configuration must be created separately.\n- scripts/check-unified-orders-schema.py provides offline SQLite structural checks, NOT a substitute for verifying actual D1 schema.\n\n## Prerequisites (verify before provisioning)
1. Inventory all current D1 migrations, existing service_requests schema, bindings and backup procedure.
2. Choose dedicated sandbox Worker name and D1 database; record actual IDs only after provisioning.
3. Obtain PayPal Sandbox merchant credentials and Stripe Test Mode keys/webhook signing secret via secure secret store. Verify account readiness; never assume it.
4. Configure Turnstile test sitekey and secret, origin/hostname checks and test-only email delivery.
5. Review D1 SQL migration in migrations/unified-orders-sandbox-v0.1.sql against the actual sandbox service_requests table. The foreign key requires the parent table to exist.
6. Confirm least-privilege token permissions and isolated deploy target before introducing a GitHub Actions deploy job.

## Suggested safe commands (do not execute against Production)
- node --test tests/service-catalog.test.mjs tests/unified-orders.test.mjs
- node scripts/check-public-site.mjs
- Use wrangler d1 execute only with an explicit sandbox database name and --remote after schema review, never a production database name.

## Acceptance evidence
- Both service IDs: one-question-review and ai-governance-review.
- Provider cases: PayPal Sandbox and Stripe Test Mode for each service.
- Persist D1 records and verify provider-side payment proof, replay safety, single fulfillment, retries, refunds, cancellations and cross-provider race.
- Capture redacted test logs and test order IDs only; do not store payment credentials or customer PII in GitHub.
- Status remains HOLD until full provider test and browser acceptance.
