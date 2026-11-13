# BoxVia Preview — Acceptance Report v1.0

**Date:** 2026-11-13  
**Scope:** isolated Technical Pilot service-request intake, Preview Worker, sandbox D1, owner notifications.  
**Branch:** `audit/service-forms-20261111`  
**Decision:** **CONDITIONAL PASS (Preview only)**. **Production release NOT AUTHORIZED.**

## 1. Evidence register

| ID | Check | Result | Evidence / limitation |
|---|---|---|---|
| A01 | Isolated Preview target | PASS | `wrangler.service-preview.jsonc`: Worker `boxvia-service-preview`, D1 binding `DB`, database `boxvia-bxc-sandbox`, ID `baf79e93-cbea-4786-8779-974f3b3afbcc`. |
| A02 | Remote D1 schema | PASS | User-provided GitHub Actions read-only audit output, 2026-11-13: `request_key` and `request_digest` present. |
| A03 | Unique idempotency index | PASS | Remote `PRAGMA index_list(service_requests)`: `idx_service_requests_request_key`, `unique=1`, `partial=0`. |
| A04 | Historical data retained | PASS for observed rows | Remote count: 4 `technical-pilot` rows at audit time. No before/after full reconciliation was supplied. |
| A05 | Row #4 metadata | PASS | `id=4`, `service_code=technical-pilot`, `status=new`, `has_request_key=1`, `has_request_digest=1`. |
| A06 | Read-only audit | PASS | D1 responses show `changed_db=false`, `rows_written=0`; workflow uses PRAGMA and SELECT only. |
| A07 | Browser form submission | PASS for observed run | User screenshot, 2026-11-13: Preview Technical Pilot displays “Request received. BoxVia will follow up by email.” |
| A08 | Owner notification | PASS for observed runs | User Gmail screenshots, 2026-11-13: Preview notifications for request IDs 1–5, including #5 at 09:50; labeled Preview/sandbox. |
| A09 | Unit/schema tests | PASS for shown CI runs | User screenshots: Service request tests #66 and #67 successful. Workflow covers local SQLite/Wrangler schema and Node unit tests; this is not proof of production behavior. |
| A10 | Live duplicate/retry handling | NOT FULLY VERIFIED | Unique index and successful unit tests support design; supplied read-only audit does not prove two live HTTP retries produce one row or that a conflicting payload is rejected in deployed Worker. |
| A11 | Production regression and release readiness | NOT VERIFIED | No Production deployment or release acceptance performed. |

**Evidence hygiene:** no customer email, request JSON, UUID, or secret values are included in this report. Evidence screenshots/logs remain in the conversation and external systems; this file records their results, not immutable copies.

## 2. Technical interpretation

- Unique non-partial index on `request_key` prevents duplicate **non-NULL** keys in SQLite/D1. It does not prevent multiple NULL keys.
- Presence of `request_digest` confirms schema and row metadata, **not** correctness of digest comparison in every execution path.
- `status=new` for row #4 does not itself prove notification delivery or processing state. Gmail screenshots independently support observed notification delivery.
- A successful GitHub Actions run means the configured tests passed; it does not substitute for a live adversarial retry/concurrency test.
- The read-only D1 audit is a point-in-time observation: four rows were counted. Gmail evidence includes request #5 from a later observed event, so these observations are not contradictory.

## 3. Preview acceptance decision

**CONDITIONAL PASS:** The Preview flow is operational in the observed Technical Pilot E2E run, the sandbox D1 migration is structurally sound, and owner email notifications have been observed.

**Outstanding release gates:**
1. Run and record a live same-UUID retry with a fresh Turnstile token: same response identity, no additional D1 row, no duplicate notification.
2. Run and record a same-UUID conflicting-payload attempt: explicit conflict response, no additional D1 row.
3. Validate concurrent submissions and failure/recovery cases against deployed Preview, with PII-free audit evidence.
4. Confirm configuration parity requirements, privacy/data-retention controls, monitoring and rollback for a separate Production release.
5. Obtain explicit authorization before merging or deploying to Production.

## 4. Change control

- This document is evidence consolidation, not an instruction to deploy.
- Do not copy Preview secrets or sandbox D1 identifiers into Production runtime configuration.
- No Production configuration, schema, or application changes are authorized by this report.
- Next formal artifact: Production readiness checklist and deployment/rollback plan, **only after** outstanding gates are assessed.

**Prepared for:** BoxVia / ANDEKS internal technical acceptance.


## Addendum — remote D1 integrity evidence (2026-11-13)

**Source:** GitHub Actions run [43398556565](https://github.com/AndekOY/boxvia-portal/actions/runs/43398556565), job `integrity`, conclusion `success`. Actual job log was inspected.

- `duplicate_groups=0` — no duplicate non-NULL request UUIDs found.
- `malformed_digests=0` — no malformed non-NULL SHA-256 digests found.
- `missing_digest_for_key=0` — no populated UUID without a digest.
- `total_rows=5`, `keyed_rows=2`, `digested_rows=2`.
- Three historical rows have no UUID/digest; this is compatible with the nullable-column migration and is not, by itself, a migration failure.
- Read-only audit, no data mutations.

**Acceptance update:** remote Preview D1 integrity = **PASS at the observed snapshot**. This does **not** establish correct HTTP 201/200/409 handling under live retries, nor exactly-once Gmail delivery. Those remain open release gates.

**Production release authorization:** still **NOT GRANTED**.


## Closure note — MINIMAX decision (2026-11-13)

**Preview acceptance closed as CONDITIONAL PASS, not full PASS.** The owner accepted deferral of live same-UUID HTTP retry/concurrency testing to avoid additional browser tooling and infrastructure. A10 remains **NOT FULLY VERIFIED**; this is a documented evidence limitation, not a successful test result.

The Production readiness assessment is a separate phase and is **not approved for deployment**. See [Production Readiness Gate v0.1](./boxvia-production-readiness-gate-v0.1.md). Production schema, configuration, privacy/abuse controls, notifications, and rollback must be assessed before a GO/NO-GO decision.

**No Production changes authorized.**
