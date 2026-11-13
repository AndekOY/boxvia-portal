# BoxVia Service Requests — Production Readiness Gate v0.1

**Date:** 2026-11-13  
**Policy:** MINIMAX — no new infrastructure, no Production writes or deployment without separate authorization.  
**Preview acceptance:** CONDITIONAL PASS.  
**Production decision:** HOLD — NOT AUTHORIZED.

## Verified evidence

- Preview browser submission and Gmail notification were observed in earlier E2E testing.
- Preview remote D1 schema and unique `request_key` index passed read-only audit: [run 43395121628](https://github.com/AndekOY/boxvia-portal/actions/runs/43395121628).
- Preview remote D1 integrity passed: [run 43398556565](https://github.com/AndekOY/boxvia-portal/actions/runs/43398556565): 5 rows; 2 keyed and digested; 0 duplicate non-NULL UUID groups; 0 malformed digests; 0 missing digest for keyed rows.
- Unit and schema CI passed: [run 43396659524](https://github.com/AndekOY/boxvia-portal/actions/runs/43396659524).
- Live same-UUID HTTP retry/concurrency and conflict handling remain **unverified**; explicitly accepted as a Preview evidence limitation, not a PASS.

## Configuration boundary observed in repository

| Property | Preview | Production |
|---|---|---|
| Worker name | `boxvia-service-preview` | `boxvia` |
| D1 database name | `boxvia-bxc-sandbox` | `boxvia-claims` |
| Config | `wrangler.service-preview.jsonc` | `wrangler.jsonc` |
| `keep_vars` | Not declared in Preview config | `true` in Production config |

**Warning:** Preview D1 schema must not be assumed to exist in Production D1. The repository's Production config points to a different database. Preview Turnstile and notification behavior does not prove Production environment bindings, permissions, or delivery.

## Minimal release gates

| Gate | Required evidence | Current |
|---|---|---|
| P01 — Change set | Exact diff from intended Production baseline; review for unrelated changes | OPEN |
| P02 — Production D1 | Read-only schema/index/row-count check; safe migration plan and backup/restore decision | OPEN |
| P03 — Secrets and Turnstile | Presence/configuration verified without revealing values; Production hostname/action compatibility | OPEN |
| P04 — Notifications | Owner notification polling and isolation; avoid duplicate delivery | OPEN |
| P05 — Privacy and abuse | Public-form notice, retention/access, rate limiting/abuse controls assessed | OPEN |
| P06 — Deployment control | Named release commit, explicit approval, post-deploy smoke checks, rollback instructions | OPEN |

## Minimal release sequence (not executed)

1. Inspect exact branch-to-Production diff; exclude unrelated changes.
2. Run read-only Production D1 inspection and document migration/backup prerequisites.
3. Review Production secret presence and Turnstile hostname/action, without logging credentials.
4. Define rollback for Worker and data migration separately; D1 schema rollback may be nontrivial.
5. Request explicit GO/NO-GO.
6. Only after GO: deploy in a controlled window and verify form, D1, owner notification, and existing site routes.

## Risk decision

The omitted live retry test remains a documented residual risk. The D1 unique index protects non-NULL keys against duplicates, but neither exactly-once notification nor deployed HTTP 201/200/409 semantics has been established by a live retry test.

**No Production deployment or migration has been performed.**
