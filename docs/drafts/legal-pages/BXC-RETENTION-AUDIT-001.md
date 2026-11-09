# BXC-RETENTION-AUDIT-001 | Retention and deletion code audit | v0.1 | INTERNAL DRAFT
Date: 2026-11-09
Scope: read-only inspection of draft/bxc-legal-trust-v01 cloudflare/worker.js, paypal.js, notifications.js, service-request.js and wrangler.jsonc, compared conceptually with owner-exported production D1 schema. This is not a full external Cloudflare/Resend/PayPal account audit.

## Findings
1. No recurring retention sweep, TTL deletion or scheduled cleanup was found in the inspected files. worker.js scheduled handler only calls deliverNotifications(env); wrangler.jsonc does not define a cleanup handler.
2. worker.js has a single targeted DELETE FROM claims WHERE id=? AND payment_status='pending', invoked when saveClaimAccess fails after initial intake insert. This is rollback/error recovery, NOT a retention policy.
3. claim_access stores token_hash and created_at; paypal.js access verification checks the supplied hash against the stored hash, without an age/expiry condition in the inspected implementation. No token expiry/revocation/deletion logic was found there.
4. paypal_orders stores PayPal order IDs, amount, currency, status and capture ID; inspected paypal.js contains INSERT and UPDATE but no retention-based deletion.
5. notification_outbox has created_at, updated_at, sent_at and last_error. notifications.js selects pending/failed or stale sending rows, limits attempts to 5 and retries stale sending after 10 minutes. Success clears last_error, but neither success nor exhausted retries removes records.
6. Notification emails through Resend send a customer email address to the configured notification recipient. A failed send records safeText(error.message), replacing CR/LF and limiting to 300 characters; this does not prove all possible PII is excluded from error text. No provider-side retention is established.
7. Turnstile siteverify receives the token and CF-Connecting-IP value. Third-party processing/retention is not established by source alone.
8. service-request.js sends separate service inquiry email via Resend; this flow is not stored in the four D1 application tables by the inspected code and requires separate privacy coverage.
9. Schema has no explicit expires_at, deleted_at or consent/version fields; external/manual deletion and provider retention remain unverified.
10. No data was modified, no live records were read, and no production deployment occurred.

## Recommended policy decision, not yet implemented
- Define purpose-specific schedules for (a) unpaid/abandoned claims, (b) paid claims and reports, (c) access-token hashes, (d) payment transaction metadata and accounting records, (e) notification delivery/error records, (f) contact/service-request emails.
- Distinguish legal/tax record retention from operational copies, and articulate legal holds and backup/Time Travel behavior.
- Implement owner-approved deletion/anonymization workflow with referential integrity and auditable dry-run, including secure handling of customer free text, source URLs and notes.
- Validate applicable Polish/EU legal bases and time limits before publishing fixed retention promises.
- Confirm D1 Time Travel/backup windows and Cloudflare, Resend, PayPal provider-side retention, locations and processing terms.
- Add a tested DSAR/erasure workflow and versioned consumer-contract consent evidence; do not conflate request data retention with accounting records.
- Confirm notification recipient mailbox and customer-facing communications; avoid logging PII in errors.

## Release gate
CODE RETENTION AUTOMATION: NOT FOUND IN REVIEWED FILES.
EXTERNAL/MANUAL RETENTION: UNVERIFIED.
PRIVACY RETENTION SCHEDULE: OPEN.
STATUS: INTERNAL DRAFT / RELEASE HOLD.
