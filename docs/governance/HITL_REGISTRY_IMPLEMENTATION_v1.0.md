# HITL Registry v1.0 - deployment and operation
Status: DRAFT / HOLD - no production authorization
Files: cloudflare/hitl-registry-migration.sql, cloudflare/hitl-registry.js, cloudflare/worker.js
Source records: claims.id (source_type=claim) and service_requests.id (source_type=service).

## Design
- One hitl_cases record per source type + ID; unique pair prevents collisions across services.
- Append-only hitl_events preserve the full decision history for H1-H5.
- Each event stores gate, PASS/HOLD/STOP, evidence reference, optional note, actor and timestamp.
- Case status defaults to HOLD; only H5 PASS after H1-H4 PASS can mark PASS. STOP closes the case.
- Evidence references should point to controlled records, never raw confidential content or credentials.
- This does not store the actual evidence, does not prove an actor's legal identity and does not send a report to a customer.
- A case is not marked human-reviewed merely because an API response says PASS: the operator must verify real evidence and authorization.

## Preview setup only
1. Apply `cloudflare/hitl-registry-migration.sql` to the **preview D1** database first, after a backup and schema check.
2. Configure `HITL_REGISTRY_ENABLED=true` only in an isolated preview Worker.
3. Configure `HITL_OWNER_TOKEN` as a random secret with at least 32 characters. Never commit it or put it in a URL.
4. Run authenticated functional and concurrency tests, including nonexistent IDs, duplicate requests, invalid source IDs, skipped gates, STOP, repeated H5 and failed database writes.
5. Confirm that the request Origin matches the Worker origin for POST. This endpoint is intended for a controlled owner interface, not public clients.
6. Validate that preview and production D1 bindings are isolated. The migration has not been executed by this commit.

## API (draft)
`GET /api/owner/hitl?source_type=claim&source_id=123` - owner-only read.
`POST /api/owner/hitl` - create case if needed and append gate event.

Header: `Authorization: Bearer <HITL_OWNER_TOKEN>`
POST headers also require `Content-Type: application/json` and `Origin: <Worker origin>`.
Example body:
```json
{
  "source_type": "claim",
  "source_id": 123,
  "gate": "H1",
  "decision": "PASS",
  "evidence_ref": "controlled-case-record/123/scope-v1",
  "actor": "Andrey Ekhmenin",
  "note": "Scope and source version confirmed"
}
```

## Important limitations before production
- API uses a shared bearer token, not individual authenticated user identities. `actor` is self-declared; add a proper authenticated owner identity before treating this as high-assurance provenance.
- The current read-then-write gate check is not serialized across concurrent requests. Concurrent approvals require transaction-safe enforcement or a single-writer control before production.
- No dedicated owner UI, evidence upload, document hashing, cryptographic signature, or delivery integration is provided.
- No automated migration, Worker deployment or production flag change has been performed.
- Retention, data subject rights and confidentiality policy require approval before real customer use.
- Do not expose the owner token in browser JavaScript or local storage.

## Acceptance decision
HOLD until owner approves a hardened release design, preview tests pass, and production changes are explicitly authorized.
