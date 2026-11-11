# BXC sandbox activation runbook | v0.1
Date: 2026-11-11
Status: NOT EXECUTED — NO PRODUCTION DEPLOYMENT

## Verified draft components
- Separate sandbox Worker: cloudflare/bxc-sandbox-worker-draft.js.
- PayPal capture handler: cloudflare/paypal-contract-wired-draft.js.
- Additive sandbox D1 migration: cloudflare/migrations/bxc-contract-formation-draft.sql.
- Verified capture is associated with accepted checkout and a durable formation row.
- Claim-status API reports formation independently of paid status.
- Formation never authorizes performance automatically.

## Operator setup, still required
1. Provision an isolated sandbox D1 database, distinct from production, and inventory existing sandbox schema.
2. Apply all prerequisite draft migrations in dependency order and then bxc-contract-formation-draft.sql. Inspect table definitions and uniqueness constraints.
3. Freeze the four complete English legal documents and compute hashes of exact immutable bytes. Supply reviewed HTTPS URLs and trusted catalog.
4. Configure dedicated sandbox Worker bindings: sandbox D1 and ASSETS; BXC_SANDBOX_ONLY=true; PAYPAL_ENV=sandbox; PAYPAL_CHECKOUT_ENABLED=true; sandbox-only PayPal credentials. Never reuse production secrets or DB.
5. Verify actual order scope, deliverable, price, tax and start rule in the checkout.
6. Perform one synthetic sandbox journey: accept documents, create PayPal order, approve, capture, inspect formation row, read status, prepare manual durable confirmation. No real personal data or email.
7. Reconcile any uncertain capture manually; do not issue a second charge.
8. Verify actual provider agreements, transfers, retention, cookies, security, and consumer-law formation wording.
9. Obtain explicit owner GO authorization before any live change.

## Stop conditions
- Production DB binding or uncertain migration order.
- PayPal captured but formation record absent or conflicting.
- Missing immutable legal document hashes/URLs.
- Payment incorrectly treated as authorization to start work.
- Unresolved legal, privacy or Gmail confirmation requirements.

## Timestamp qualification
The formation row currently records D1 reconciliation time, not necessarily the PayPal provider capture time. Legal review must approve the distinction or require recording both.

## Gate
NO-GO: sandbox not deployed, migration not applied, end-to-end payment not performed, legal/privacy release gates open.
