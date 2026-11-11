# BXC — production D1 test request #23: safe cleanup
Date: 2026-11-11
Status: PREPARED / NOT EXECUTED
Owner confirms test claim #23 was not paid. Browser confirms request received. Never treat owner confirmation alone as a substitute for database checks.

## Read-only inspection in Cloudflare D1 console (production database boxvia-claims)
Run each separately:
```sql
SELECT id, status, payment_status, created_at FROM claims WHERE id = 23;
SELECT name FROM sqlite_master WHERE type = 'table' AND name IN ('claim_access','paypal_orders','notification_outbox','contract_checkout_sessions','contract_acceptance_archive','contract_paypal_order_links','bxc_contract_formations');
PRAGMA foreign_key_list('claims');
PRAGMA foreign_key_list('claim_access');
PRAGMA foreign_key_list('paypal_orders');
```
For each *existing* dependent table inspect rows by claim_id = 23, or order_id where schema uses a different identifier; do not run queries on missing tables. Inspect relevant columns via PRAGMA table_info('table_name') before querying. Do not disclose emails, claim text, access tokens, or payment IDs.

## Deletion authorization conditions
- claims.id = 23 exists, payment_status = 'pending', and it is confirmed synthetic.
- No PayPal order/capture, no contract formation, no legitimate delivery, no accounting or complaint retention duty.
- Dependency inventory completed and foreign-key order established.
- Execute all deletions atomically in a transaction when supported by the D1 console; verify actual D1 transaction behavior before attempting. If atomicity is not assured, STOP and use a reviewed migration/procedure, not multiple blind DELETEs.
- Delete only rows uniquely linked to claim 23, never an entire table.
- Re-query after deletion and record only row counts and timestamp. No PII in logs.
- If any condition is uncertain, leave record pending; no irreversible action.

## Remaining release work
- Actual Cloudflare Web Analytics enabled (confirmed by owner screenshot). HTTP request logs present. Turnstile Siteverify validated once successfully. Actual logs/backups retention and transfer facts still not established.
- Privacy Notice must disclose analytics, Turnstile, Cloudflare, PayPal, Gmail, real recipients/transfers, statutory rights, approved manual retention and actual account facts.
- Consumer terms and payment handoff still need approval; separate accountant review waived as a process choice only.
- No production deployment or live PayPal sandbox test authorized by this cleanup plan.
