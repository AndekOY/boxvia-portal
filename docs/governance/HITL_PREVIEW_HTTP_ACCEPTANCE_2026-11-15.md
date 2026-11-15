# HITL PREVIEW WORKER HTTP ACCEPTANCE - 2026-11-15
Status: PARTIAL PASS / production HOLD
Run: https://github.com/AndekOY/boxvia-portal/actions/runs/43708359461
Preview Worker: https://boxvia-hitl-preview-test.andeks.workers.dev
Preview D1: baf79e93-cbea-4786-8779-974f3b3afbcc
Production Worker and D1: unchanged.

## Evidence
GitHub Actions completed successfully and the job log confirms six HTTP checks:
1. No bearer token -> 401.
2. Incorrect bearer token -> 401.
3. Authenticated request without source -> 400.
4. Wrong Origin on POST -> 403.
5. Authenticated unknown source -> 404.
6. Unrelated URL path -> 404.

## Isolation
A standalone HITL-only entrypoint was deployed to a separate preview Worker.
It has no payment, service intake, notification or static website routes.
A random token was generated in CI and configured as a Worker secret; token value was not printed.
The HTTP tests did not create or change customer records or HITL case records.

## Limitations
- This is a negative-path HTTP suite. A valid source and successful POST H1-H5 workflow were not tested end-to-end via HTTP.
- The preview Worker is reachable at a public workers.dev URL, but the HITL endpoint requires bearer authentication.
- The token is ephemeral and not retained by the operator; rotate/reprovision it for future tests.
- Bearer possession is not proof of personal identity. Origin checks do not substitute for authentication.
- Preview worker should be disabled or removed after final testing.
- Full release still requires human identity assurance, operational controls, and owner authorization.

Decision: HOLD for production.
