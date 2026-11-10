# BXC Sandbox D1 — migration execution and verification

Target database: `boxvia-bxc-sandbox` (`baf79e93-cbea-4786-8779-974f3b3afbcc`).
**Never use the root `wrangler.jsonc`: it targets production `boxvia-claims`.**

The staging schema is a reconstructed test baseline from draft handler queries; it is not an approved production migration. The existing migration files `contract-checkout-sessions-draft.sql`, `contract-acceptance-archive-draft.sql`, and `contract-paypal-link-draft.sql` were consulted. Confirm compatibility of the create-attempt table and outbox before any payment test.

## Execution — after review and explicit operator approval

Use the **Cloudflare D1 Console** for `boxvia-bxc-sandbox`, or a trusted local Wrangler CLI. Apply the complete `staging/bxc-sandbox-schema-draft.sql` to the isolated database only.

CLI example (from repo root, with Cloudflare account authentication already configured):

```sh
npx wrangler d1 execute boxvia-bxc-sandbox --remote --config staging/wrangler.bxc-sandbox.jsonc --file staging/bxc-sandbox-schema-draft.sql
```

Before running, verify that the selected database ID is exactly `baf79e93-cbea-4786-8779-974f3b3afbcc` and that the command does not reference `boxvia-claims`. The CLI command is supplied for operator execution; no remote execution has been performed by ChatGPT.

## Read-only verification

In the D1 Console for the isolated database, run:

```sql
SELECT name, type FROM sqlite_master
WHERE name NOT LIKE 'sqlite_%' AND type IN ('table','trigger','index')
ORDER BY type, name;
SELECT COUNT(*) AS claims_count FROM claims;
SELECT COUNT(*) AS orders_count FROM paypal_orders;
SELECT COUNT(*) AS sessions_count FROM contract_checkout_sessions;
PRAGMA foreign_key_check;
```

Expected: tables and immutable triggers present, all three counts zero, `foreign_key_check` returns no rows.

## STOP conditions

Stop if database name or ID differs, tables already contain unexpected rows, schema errors occur, or foreign key check returns rows. Do not delete or reset data as an automatic recovery step. Do not enable payment routes until staging Worker, versioned catalog, secrets, and test payer are separately approved.
