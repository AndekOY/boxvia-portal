# BXC-D1-READ-ONLY-MODULE-TEST-001 | v0.1 | INTERNAL DRAFT / RELEASE HOLD
Date: 2026-11-09
Scope: isolated D1-shaped JavaScript module, NOT imported into cloudflare/worker.js; no production access.
Files: cloudflare/retention-draft/d1-retention.mjs and d1-retention.test.mjs.
Execution: node --test d1-retention.test.mjs, local Node runner.
Result: 15 passed, 0 failed. An initial test exposed JavaScript Date.parse normalization of nonexistent date 2026-02-30; strict canonical UTC validation was added and all 15 tests then passed.
Functions:
- classifyUnpaid: synthetic metadata-only fail-closed classification, always requires review for old unpaid candidates.
- dryRun: read-only aggregate SQL through an injected D1-shaped adapter, requires the NOT APPLIED draft bxc_retention_control table, returns only counts and deletionAuthorized:false.
- executeErasure: throws RELEASE_HOLD unconditionally.
No D1 execution, migration, staging, live database connection, scheduler integration, or deletion was performed. A mocked adapter verifies SQL shape but not actual D1 semantics.
Important: the proposed retention period is NOT approved. String comparison of timestamps in draft SQL assumes canonical timestamps; actual stored formats must be inspected before staging evaluation. Approval metadata is absent from the draft control schema; the module does not grant approval. No paid claim deletion.
Next gates: approved retention schedule, separate accounting evidence, authoritative PayPal reconciliation, D1 staging read-only tests, controlled transaction design, rollback/restore, owner authorization.
STATUS: LOCAL TEST PASS; D1 STAGING UNTESTED; RELEASE HOLD.
