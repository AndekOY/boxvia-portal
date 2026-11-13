# BoxVia Production — read-only preflight findings (2026-11-13)

**Status: HOLD / NO-GO. No Production changes made.**

## GitHub comparison

Source: GitHub compare `main...audit/service-forms-20261111` inspected 2026-11-13.

- `main` SHA: `83cc97ed72b1c828542b6f6803cb0e48ba88d849`
- Branches diverged: 86 commits ahead on audit branch, 23 commits behind `main`.
- 36 changed/added files in compare result.
- Do **not** merge the audit branch wholesale. Create a dedicated release branch from current `main` and port only approved production changes.

## Production D1 target (configuration only, NOT remote observation)

- Production `wrangler.jsonc`: Worker `boxvia`; D1 `boxvia-claims` (ID `9e860945-027b-4fe9-8a43-c02206b88617`).
- Preview `wrangler.service-preview.jsonc`: Worker `boxvia-service-preview`; D1 `boxvia-bxc-sandbox` (ID `baf79e93-cbea-4786-8779-974f3b3afbcc`).
- These are distinct databases; a successful Preview migration proves nothing about Production schema.
- No remote Production D1 query has yet run in this phase.

## Safe next step

Manual-only workflow `.github/workflows/boxvia-production-d1-readonly-audit.yml` has been created on the audit branch. It verifies target IDs and runs only `SELECT` against `sqlite_master` plus `PRAGMA table_info` and `PRAGMA index_list` on Production D1. It does not read customer rows or perform writes. **It has not been executed.**

The workflow uses existing `boxvia-preview` GitHub environment credentials to avoid new secrets under MINIMAX. This requires that the scoped Cloudflare token be authorized for metadata reads on Production D1; if denied, do not broaden permissions automatically. The use of Preview environment for a Production read-only inspection is explicit and must not be reused for deployment.

## Release risk

Existing prior audit `docs/audits/production-release-readiness-2026-11-12.md` documents architectural differences: Production Resend notification vs Preview D1 + Apps Script. It also reported an earlier migration mismatch; the current `0001_service_requests.sql` was subsequently revised to use `request_json` and `service_title`. Fresh schema tests passed, but Production migration has not been authorized or executed.

**Decision:** hold deployment and any D1 migration until Production metadata results and an explicit architecture/release approval.


## Verified remote Production D1 audit — 2026-11-13

**Evidence:** [GitHub Actions run 43402379515](https://github.com/AndekOY/boxvia-portal/actions/runs/43402379515), job `audit-production-metadata`, completed successfully. Job logs inspected.

- Target assertion passed: `boxvia-claims` Production D1 is distinct from Preview.
- `sqlite_master` returned both `claims` and `service_requests`.
- Production `service_requests` columns: `id`, `service_code`, `service_title`, `customer_email`, `request_json`, `status`, `created_at`, `updated_at`.
- **Missing compared with Preview:** `request_key` and `request_digest`.
- `PRAGMA index_list(service_requests)` returned `idx_service_requests_review` in this observation; no unique UUID index.
- All D1 queries reported `changed_db=false` and `rows_written=0`.

**Decision:** Production D1 schema is **not ready** for Preview idempotency logic. Do not deploy Preview service-request Worker until a reviewed additive migration and rollback/backup plan are explicitly approved.

**Minimal proposed sequence (not executed):** capture schema and backup/recovery prerequisites; review additive `ALTER TABLE` for nullable UUID/digest columns; add unique index on UUID; test exact migration on disposable Preview-equivalent schema; separately approve Production D1 write; deploy code only after migration verified. Existing Production records must not be overwritten or deleted.

**Important:** current Production D1 table metadata alone does not establish row count, triggers, data retention, or compatibility of notification architecture. These remain open.
