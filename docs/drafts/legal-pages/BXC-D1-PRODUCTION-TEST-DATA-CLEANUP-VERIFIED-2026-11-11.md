# BXC — Production D1 test data cleanup verification

Date: 2026-11-11
Database: boxvia-claims (Production)
Status: VERIFIED BY USER-PROVIDED D1 CONSOLE SCREENSHOT

## Owner authorization and scope
Owner explicitly confirmed all current application records were synthetic test records and requested full deletion. Owner confirmed two 20 USD transactions recorded as COMPLETED were PayPal Sandbox tests, not Live sales. User-provided PayPal Business Live Activity screenshot showed no transactions matching current criteria; this alone is not an exhaustive PayPal reconciliation.

## Before cleanup (read-only SQL counts)
- claims: 23
- claim_access: 22
- paypal_orders: 20 (18 CREATED, 2 COMPLETED)
- notification_outbox: 2
- service_requests: 0
- Total: 67

## Operation (executed by owner in Cloudflare D1 Console)
```sql
DELETE FROM notification_outbox;
DELETE FROM paypal_orders;
DELETE FROM claim_access;
DELETE FROM claims;
DELETE FROM service_requests;
```
D1 Console reported successful execution.

## After cleanup (read-only verification)
```sql
SELECT 'claims' AS table_name, COUNT(*) AS records FROM claims
UNION ALL SELECT 'claim_access', COUNT(*) FROM claim_access
UNION ALL SELECT 'paypal_orders', COUNT(*) FROM paypal_orders
UNION ALL SELECT 'notification_outbox', COUNT(*) FROM notification_outbox
UNION ALL SELECT 'service_requests', COUNT(*) FROM service_requests;
```
User-provided screenshot at approximately 15:02 Europe/Warsaw showed all five counts = 0.

## Scope limits
Current rows were removed; table definitions and indexes remain. No evidence of erasure from D1 Time Travel, Cloudflare logs, PayPal Sandbox, Gmail, or backups. No Worker deployment, secret modification, or PayPal transaction was performed by assistant. Historical audit and accounting retention requirements must be handled separately if relevant.

## Next
Continue minimal B2C PL/EU privacy and checkout release gates; BXC remains HOLD pending approval and verified disclosures.
