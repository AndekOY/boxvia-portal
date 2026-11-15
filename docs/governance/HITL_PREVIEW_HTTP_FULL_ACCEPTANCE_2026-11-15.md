# HITL Preview HTTP H1-H5 Acceptance - 2026-11-15
Status: TECHNICAL PASS / PRODUCTION HOLD
Successful run: https://github.com/AndekOY/boxvia-portal/actions/runs/43708655067
Previous failed runs: https://github.com/AndekOY/boxvia-portal/actions/runs/43708502655 and https://github.com/AndekOY/boxvia-portal/actions/runs/43708616246
Preview Worker: https://boxvia-hitl-preview-test.andeks.workers.dev
Preview D1: baf79e93-cbea-4786-8779-974f3b3afbcc

## Failure investigation and fix
The initial authenticated H1 HTTP request returned 503 despite writing H1 records. The registry API required inserted.meta.changes === 1, while D1 trigger-updated writes can report more than one change. The check was corrected to require a successful insert and at least one change.
The failed test's curl retry behavior produced multiple H1 entries. Automatic retries of non-idempotent POST were removed.
A second attempt encountered 401 immediately after rotating the preview token. The test now waits for token propagation before issuing POST requests.

## Verified positive end-to-end HTTP run
- New synthetic service request inserted in preview D1 only.
- Premature H5 PASS returned HTTP 409.
- H1 PASS, H2 PASS, H3 PASS, H4 PASS and H5 PASS each returned HTTP 200.
- A second H5 PASS returned HTTP 409.
- Authenticated GET returned case status PASS, exactly five history events in H1-H5 order, each decision PASS.
- The GitHub Actions job completed successfully.

## Limits and operational safeguards
This proves a technical HTTP and D1 integration path, not that a human assessor reviewed evidence. Synthetic tests use the default assessor label but must never be represented as human-approved assessments.
The owner bearer token authenticates possession of a credential, not a human identity or human approval.
API POST requests are not idempotent; duplicate submission may append repeated events for an open gate. A request idempotency key and stronger actor authentication are recommended before production.
A standalone public preview Worker remains deployed with protected HITL route and preview-only D1.
Do not merge or deploy to production without owner authorization.

Decision: HOLD for production pending identity assurance, operator approval evidence, and release review.
