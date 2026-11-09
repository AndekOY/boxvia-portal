# BXC test-data cleanup | INTERNAL DRAFT / RELEASE HOLD

**Scope:** existing production Cloudflare D1 application tables `claims`, `claim_access`, `notification_outbox`, `paypal_orders`.

Owner reports that all 65 rows (22/21/2/20) are tests and there are no paid transactions. This is an owner declaration, not a verified PayPal reconciliation. Never interpret `paypal_orders` row count as captures.

Files:
- `001_preflight_READ_ONLY.sql`: aggregate-only preflight, FK checks, no customer content.
- `002_cleanup_TEMPLATE_DO_NOT_EXECUTE.sql`: destructive commands **commented out**, post-check only. Not an executable cleanup plan.

**No execution, deployment, migration, production database access, or release authorization has occurred.**

Next gate: read-only preflight results, PayPal capture/reconciliation check, restorable backup, legal/accounting review and explicit approval of an execution plan. Preserve the four tables, all indexes, constraints and Worker behavior. Avoid `DROP TABLE` or `TRUNCATE`. A clean application DB does not mean backups or payment provider records should be purged.

BXC retention controls are a separate draft and must not be activated by cleanup.
