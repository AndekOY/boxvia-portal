# BXC D1 local Wrangler validation | INTERNAL DRAFT / RELEASE HOLD

Date: 2026-11-09.

## Evidence and current state
- User reports no significant data in current databases. This is context, not a verified zero-row inventory or authorization to delete.
- Node v22.16.0 and npm 10.9.2 are available in the assistant environment.
- Wrangler is not installed. Attempt to run `npx --yes wrangler --version` timed out after 25 seconds. **No Wrangler/D1 test has run.**
- Existing staging files: `schema.sql`, `seed.sql`, `verify.sql`, `test_staging.py`.
- Python unittest suite run against synthetic in-memory SQLite on 2026-11-09: 16/16 passed.

## Operator procedure: LOCAL ONLY
Prerequisite: install Wrangler in a dedicated, isolated development environment. Confirm `npx wrangler --version` works and review its CLI help before executing database commands.

Do not use production Wrangler config, database name, database ID, credentials, `--remote`, `wrangler deploy`, or any Worker binding.

1. Create a standalone local-only Wrangler config, outside production Worker configuration. Set a distinct synthetic database name and a non-production placeholder database ID as supported by the installed Wrangler version.
2. Use `wrangler d1 execute <synthetic-name> --local --config <local-config> --file schema.sql` to create synthetic schema.
3. Execute `seed.sql` with the same `--local` and `--config` arguments.
4. Execute `verify.sql` with the same flags; expected `preliminary_count=1` and empty `PRAGMA foreign_key_check`.
5. Repeat in a clean local DB to verify deterministic results; inspect FK and UNIQUE constraints.
6. Save tool version, exact commands, output, and error log in a new staging report.

## Optional production metadata gate (SEPARATE AUTHORIZATION)
Before any future migration, obtain a read-only, aggregate inventory of claims, claim_access, notification_outbox, paypal_orders and any other application tables; do not export customer content, email, token hashes or PayPal IDs. Check legal hold, refunds, disputes, accounting retention, backups and restoration. Reported low significance is not evidence that records can be erased.

## No-go
No live database creation or connection, no production migration, no data deletion, no Worker changes, no scheduler activation. Separate owner authorization and Polish legal/tax review required for release.
