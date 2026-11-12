# Service intake release preparation — 2026-11-12

Status: PREPARATION ONLY / NO-GO. Branch created from current `main` to preserve main-only commits. No service code ported or Production deployed.

Source: `audit/service-forms-20261111`.
Preview migration schema contract corrected in source branch; isolated SQLite test and CI added.

## Release gates
1. Confirm Preview schema contract test and unit tests pass in GitHub Actions.
2. Compare actual sandbox D1 schema against corrected fresh-install migration; test on a disposable isolated D1 database before considering Production.
3. Verify all six service forms, negative cases, notification API and Apps Script behavior.
4. Review Production D1 schema and migration approach without modifying Production.
5. Approve D1 storage replacing Resend, data retention, owner retrieval and notification reliability.
6. Port only reviewed changes to this branch, without Preview diagnostics, Preview keys, Preview Wrangler config or Preview deployment workflows.
7. Review diff against main and explicitly authorize any Production deployment.

No Production schema migration, merge or deployment is authorized by this preparation.
