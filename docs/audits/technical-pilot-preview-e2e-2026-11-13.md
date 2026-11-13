# Technical Pilot — Preview E2E evidence and Production gate

Date: 2026-11-13 (Europe/Warsaw). Branch: `audit/service-forms-20261111`.

## Observed live evidence

- Isolated Preview auto-deploy workflow #10, commit `61f1b42`, showed **Success** (22 seconds).
- Technical Pilot Preview form displayed: `Request received. BoxVia will follow up by email.`
- Gmail displayed `[PREVIEW] BoxVia service request #4` at 09:35 with `ID: 4`, `Service: technical-pilot`, and `Environment: isolated Preview D1 (boxvia-bxc-sandbox)`.
- Prior Gmail notifications #1, #2 and #3 were also observed during earlier tests.
- This is evidence of the Preview form → Turnstile → Worker → D1 → Apps Script → Gmail path. The D1 row was **not independently inspected** as part of this final screenshot check; the notification reports its ID.

## Idempotency — evidence boundaries

- The Preview D1 idempotency migration workflow #1 showed Success on 2026-11-13, and Preview Worker was redeployed afterward.
- Implementation uses `request_key` UUID, a unique D1 index, and a SHA-256 payload digest. Identical UUID/payload retries should return the same row ID (HTTP 200 after initial HTTP 201); changed payload with reused UUID should return HTTP 409.
- Repository unit tests cover same-key/same-payload, same-key/changed-payload and invalid UUID. **A live double-submit/concurrent-retry test on remote Preview D1 has not been demonstrated.** No claim of full live idempotency acceptance is made.

## Acceptance matrix

| Gate | Status | Evidence / action |
| --- | --- | --- |
| Preview deployment | PASS | Workflow #10 Success, commit `61f1b42` |
| Technical Pilot submission | PASS | Form displays `Request received` |
| Owner email notification | PASS | Gmail Preview request #4 at 09:35 |
| Preview D1 record ID | OBSERVED VIA NOTIFICATION | Notification reports #4; independent row audit pending |
| Turnstile + D1 persistence path | PASS (E2E observed) | Valid form and subsequent owner notification |
| Idempotency unit coverage | IMPLEMENTED | `tests/service-request.test.mjs` |
| Idempotency live duplicate test | PENDING | Use the same request UUID and identical payload twice with distinct valid Turnstile tokens; verify one D1 row, same ID and 201/200 |
| All six service forms live | PENDING | Technical Pilot alone does not establish all forms |
| Retention/deletion policy | PENDING | No automatic cleanup approved |
| Owner-only full details access | PENDING | Currently authorized D1 console |
| Production approval | NOT GRANTED | No Production deployment or D1 migration |

## Next controlled verification

1. Perform a non-destructive, read-only audit of the remote `boxvia-bxc-sandbox` table for the Technical Pilot test ID and idempotency index; do not log customer email or request text.
2. Run an authorized Preview-only live retry test using two separate valid Turnstile tokens and the **same** UUID and payload, then read-only verify one row. A replayed Turnstile token is not a valid idempotency test.
3. Run Preview-only validation for the other five service forms, negative cases, and Apps Script pagination.
4. Decide retention, deletion, and authorized owner detail retrieval before Production approval.
5. Prepare a separate Production change plan including migration compatibility, rollback, secrets, Turnstile hostname and data-protection review. **Do not merge or deploy without explicit approval.**

## Scope and safeguards

Preview Worker: `boxvia-service-preview`. Preview D1: `boxvia-bxc-sandbox`. Production remains unchanged. No customer personal data, credentials or secret values are recorded in this report.
