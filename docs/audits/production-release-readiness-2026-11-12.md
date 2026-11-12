# BoxVia Production release readiness audit — 2026-11-12

Status: BLOCKED / NOT AUTHORIZED FOR PRODUCTION. Source inspection only. No production change.

## Evidence
- GitHub compare `main...audit/service-forms-20261111`: diverged; 57 ahead, 22 behind, 27 changed files. Base main `275b365fae9c08846708b357653131b52c5e594e`; merge base `3f47a363546614dab085ef80e600b1a8e9d59373`.
- Preview Technical Pilot form submission and sandbox D1 insertion were confirmed by owner during E2E; Preview Gmail notification #1 received, cursor advanced to 1, repeat poll did not resend.
- Production Apps Script `boxViaPoll` completed without error after owner-performed token rotation; authorization and delivery of a new notification have NOT been independently confirmed.

## Confirmed differences
1. Production `cloudflare/service-request.js` requires `RESEND_API_KEY`, `NOTIFICATION_FROM`, `NOTIFICATION_TO` and sends service request contents via Resend. Preview requires `TURNSTILE_SECRET_KEY` and D1 `DB`, persists request and returns HTTP 201. This is an architectural and data-processing change, not a hotfix.
2. Preview adds required confirmation checks `public_material_confirmation` and `terms_acknowledgement` to Worker validation.
3. Preview `cloudflare/worker.js` reads `service_requests` into owner notification metadata. Production owner notification API currently returns `services: []`.
4. Production D1 is `boxvia-claims` (ID `9e860945-027b-4fe9-8a43-c02206b88617`). Preview D1 is `boxvia-bxc-sandbox` (ID `baf79e93-cbea-4786-8779-974f3b3afbcc`). Never apply Preview migration to Production without approval.
5. Preview has additional workflows, scripts, test files, integration code, diagnostic UI and separate Wrangler config. These are not automatically appropriate for Production.
6. The committed `cloudflare/migrations/0001_service_requests.sql` declares `request_body`, but the Preview Worker inserts `request_json` and `service_title`. Its `status` default and permitted values also differ from the Worker insert (`'new'` is shared). **Migration is incompatible with the current Worker INSERT**. Preview E2E success proves the deployed sandbox schema works, not that the committed migration can recreate it. Production schema must be specified and tested before rollout.
7. `AGENTS.md` evidence-first protocol exists in Preview branch only; can be promoted separately after review.

## Release blockers
- BLOCKER: reconcile and test the D1 schema/migration against current Worker SQL (no assumption that sandbox matches migration).
- BLOCKER: decide explicitly whether replacing Production Resend delivery with D1 + Apps Script is approved; document retention, access to full request details, lawful data handling and failure/retry behavior.
- BLOCKER: determine how existing Production service requests and claims notifications coexist, without resetting `CLAIMS_AFTER` or `SERVICES_AFTER`.
- BLOCKER: audit production environment variables, Turnstile widget hostname/action and actual D1 schema; GitHub alone cannot verify live configuration.
- BLOCKER: reconcile 22 main-only commits and select minimal file-level changes. Do not merge entire Preview branch.
- BLOCKER: test all six service codes and negative cases in isolated environment. One Technical Pilot E2E does not validate all services.
- SECURITY: a Production owner notification token was exposed in a screenshot. Owner reports rotation and successful script execution; further auth verification may be appropriate. Never place token values in GitHub.

## Proposed gates
1. Preserve and document current Production behavior and rollback commit/deployment.
2. Build a dedicated release branch from current `main` and cherry-pick or port only approved changes.
3. Repair migration in a separate Preview-only change and verify against fresh disposable D1.
4. Run automated tests plus E2E on isolated Preview, including all service types and owner poll.
5. Obtain explicit approval for Production D1 migration, notification architecture and retention.
6. Deploy only with owner approval, verify API and Gmail end-to-end, then monitor and document rollback.

Decision: NO-GO for Production deployment as of this audit. The Preview acceptance is limited to Technical Pilot + notification path; not a Production authorization.
