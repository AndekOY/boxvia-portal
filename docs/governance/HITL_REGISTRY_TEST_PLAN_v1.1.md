# HITL registry security and preview test plan v1.1
Status: DRAFT - not deployed, no production changes

## Hardened controls
- SQLite BEFORE INSERT trigger checks that case is HOLD and prerequisite gates have most recent PASS.
- SQLite AFTER INSERT trigger derives case status in the same database statement.
- Immutable event triggers block UPDATE and DELETE.
- API binds actor to the server-side case assessor; client-supplied actor is ignored.
- Access remains owner bearer token and feature flag, with POST Origin check.
- API writes only an event; status is not independently writable through this API.

## Tests required in isolated preview D1
1. Apply migration to preview database and inspect schema/triggers.
2. Create claim #test and service #test; verify distinct registry cases.
3. GET unknown case -> 404; POST nonexistent source -> 404.
4. Unauthorized requests -> 401; feature flag disabled -> 503.
5. Invalid JSON, oversized payload, bad gate, invalid source, wrong Origin -> rejection.
6. H5 PASS without H1-H4 -> rejection, case HOLD, no event inserted.
7. H1 PASS, H2 PASS, H3 PASS, H4 PASS, H5 PASS -> case PASS.
8. Attempt event after PASS -> rejected; no additional event.
9. STOP event -> case STOP; later events rejected.
10. H3 HOLD after H3 PASS -> later H4 PASS must be rejected until H3 passes again.
11. Parallel H5 PASS submissions -> exactly one event accepted; no duplicate release.
12. UPDATE/DELETE of hitl_events -> SQLite trigger rejects both.
13. Client sends actor='Other Person' -> stored actor remains case.assessor.
14. Verify no client email, raw claim text, URLs, secrets or evidence payloads in HITL tables.
15. Confirm no client emails or report delivery triggered by this API.
16. Confirm preview D1 and production D1 bindings are distinct.

## Residual risks
- Shared bearer token identifies possession of a secret, not a natural person; server-side actor binding is attribution, not proof of identity.
- Production-grade provenance needs identity-bound authentication and tamper-evident audit export/backup.
- Migration assumes SQLite trigger support in the deployed D1 version; verify with real preview migration.
- API error handling intentionally does not expose database failure details.
- No tests have been executed against Cloudflare preview D1 at the time of this document.
- No publication/merge is authorized.

## Decision
HOLD pending preview migration, integration tests and owner sign-off.
