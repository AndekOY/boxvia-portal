# BoxVia Technical Pilot — Preview acceptance record

Date: 2026-11-13 (Europe/Warsaw)
Record: BV-TP-PREVIEW-E2E-2026-11-13
Branch: audit/service-forms-20261111
Environment: boxvia-service-preview.andeks.workers.dev
D1: boxvia-bxc-sandbox
Status: Functional E2E accepted; Production NOT authorized.

## Evidence
User screenshots show Gmail notifications for Technical Pilot requests #1 and #2 at 09:10 and a fresh request #3 at 09:15 on 2026-11-13. The #3 email identifies service technical-pilot and isolated Preview D1. The user also showed a successful boxViaPreviewPoll execution at 09:09:58–09:10:03. A previous HTTP 401 was observed, but subsequent polling and delivery succeeded.
The new #3 notification followed the requested form submission. A separate screenshot of the final on-page confirmation was not supplied.

## Verified functional chain
Form submission -> Preview Worker -> sandbox D1 -> Apps Script poller -> Gmail. New ID #3 received.
Notification email contains ID, service and Preview environment, not submitted customer fields.

## Code review (Preview branch)
Inspected cloudflare/service-request.js, cloudflare/worker.js, tests/service-request.test.mjs, wrangler.service-preview.jsonc.
Intake checks Origin, JSON content type, required fields and acknowledgements; verifies Turnstile success, hostname and action; confirms D1 insert before HTTP 201. It fails closed on verification or database errors.
Owner notification endpoint requires bearer authorization, compares SHA-256 digests, validates cursors and returns only IDs and service codes. Unit tests include successful insert, invalid origin, invalid Turnstile action, expired token, invalid secret and D1 failure.

## Acceptance matrix
| Check | Status |
| --- | --- |
| New notification #3 | PASS: Gmail 09:15 |
| Prior notifications #1 and #2 | PASS: Gmail 09:10 |
| Apps Script polling after earlier 401 | PASS: successful run and delivery |
| D1 persistence | PASS, indirectly evidenced by D1-backed notification and request ID |
| No customer payload in Gmail notification | PASS, observed |
| Input validation and server-side Turnstile | CODE REVIEWED |
| Final UI confirmation screenshot for #3 | NOT DOCUMENTED |
| Live expired/replayed Turnstile token test | NOT VERIFIED |
| Duplicate form submission prevention | NOT ESTABLISHED |
| Exactly-once Gmail delivery | NOT ESTABLISHED |
| Production readiness | NOT APPROVED |

## Open issues
1. Add an idempotency key and database uniqueness protection; test double-click, retries and concurrency in Preview. Current handler inserts on every successful verified request and has no separate idempotency guarantee.
2. Inspect Apps Script cursor update ordering and Gmail send failure handling; test duplicate notifications and partial failure. Cursor polling alone does not guarantee exactly-once delivery.
3. Exercise live error paths: expired Turnstile, invalid inputs, 503 recovery and final UI confirmation. Keep the fallback error message until these pass.
4. Verify rate limiting, monitoring, D1 retention and access controls, and absence of personal content in logs.
5. Prior screenshots of script properties exposed a portion of a credential. Rotate potentially exposed credentials consistently in Preview and Apps Script; never commit or share token values.
6. Prepare Production migration, rollback and release checklist, then obtain explicit owner approval before any Production/main changes.

## Release decision
Preview functional E2E: ACCEPTED with hardening items outstanding.
Production deployment: BLOCKED pending further tests, release review and explicit authorization.
No Production settings or data were changed as part of this acceptance record.