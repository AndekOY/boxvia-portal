# BXC-D1-ERASURE-EXECUTOR-DESIGN-001 | v0.1 | INTERNAL DRAFT / RELEASE HOLD
Date: 2026-11-09
Scope: design only, no executable deletion code, no migration, no production access.

## 1. Precondition
Production D1 FK/index/trigger metadata has NOT yet been provided. The 30-day unpaid policy is only a proposed duration. Any SQL deletion order or ON DELETE CASCADE choice is provisional until read-only metadata review. No paid claim or payment record may be automatically deleted.

## 2. Safe architecture
- Planner (already drafted) classifies minimized metadata; candidate status never authorizes deletion.
- Reviewer signs an immutable decision record with policy version, cutoff, category, reconciliation reference, legal-hold status, dispute status, scope, approval and expiry.
- Executor is separate from Cron notifications, default disabled; no public HTTP endpoint. Only an explicitly authorized operator-controlled job can request execution.
- Executor re-reads claim, access, orders, outbox, hold and dispute flags within a transaction immediately before any mutation.
- **Fail closed** on unknown status, missing control row, stale approval, changed payment state, any PayPal order, missing external reconciliation, active notification, dispute, legal hold or unexpected FK/trigger definition.
- For unpaid claims, candidate deletion must include claim_access token and related operational data only if no payment order or other legal record exists. Never delete payment evidence by cascade.
- For paid claims, prefer separate field-level redaction after preservation of lawful accounting evidence; no paid-data executor in v0.1.
- Audit: store non-content reason code, policy/approval reference, action time and operator identity. Restrict access and prevent logs containing emails, claims, URLs, tokens or PayPal IDs.
- Idempotency: repeated execution must not cause additional loss or false success. Use bounded batches and verified affected-row counts.
- Rollback: before activation, test backup/restore and erasure reapplication to restored data; no promise of instant removal from provider backups.
- Monitoring: count dry-run, blocked, approved and executed outcomes; alerts on errors and unexpectedly high candidate volumes.

## 3. Race and integrity tests
1. Payment captured after planning but before execution: block.
2. PayPal order exists with any status: block.
3. Legal hold or dispute added after planning: block.
4. Outbox pending or retrying: block.
5. Unknown or absent control metadata: block.
6. Unapproved policy or expired approval: block.
7. FK restrict, cascade or trigger unexpectedly present: block until reviewed.
8. Concurrent executor invocations: one atomic decision, no duplicate deletion.
9. Partial DB failure: no orphaned access tokens or records.
10. Restore after deletion: deletion decisions reapplied.
11. Paid/refunded/chargeback case: no v0.1 deletion.
12. Empty and oversized batches: safe no-op/limit.
13. D1 transaction semantics and query behavior: validate in isolated staging, not assumed from local SQLite.

## 4. Implementation gate
- Obtain actual production metadata using `004_fk_index_inventory_READ_ONLY.sql` and review it.
- Confirm lawful retention schedule, accounting export and DSAR process.
- Create a separate feature branch with executor disabled by default and synthetic integration tests.
- Require owner, legal/tax, BCAF/BQS and COS release approvals before deployment.
- No SQL DELETE or live cleanup authorized by this document.

STATUS: DESIGN COMPLETE AS A DRAFT; FK METADATA UNVERIFIED; EXECUTOR NOT IMPLEMENTED; RELEASE HOLD.


## Verified production foreign-key evidence — 2026-11-09
Owner-exported D1 Studio read-only pragma result (3 rows) establishes:
- claim_access.claim_id -> claims.id; ON DELETE NO ACTION
- notification_outbox.claim_id -> claims.id; ON DELETE NO ACTION
- paypal_orders.claim_id -> claims.id; ON DELETE NO ACTION
All three have id=0, seq=0 within their own table. No FK rows for claims. This confirms the declared FK actions, but not whether PRAGMA foreign_keys enforcement is enabled on every relevant connection, nor index definitions or triggers.

**Design decision:** no CASCADE; paid claims must retain the parent key while legally required payment evidence exists. For unpaid claims, an eventual reviewed executor may remove eligible access and outbox child records before removing the parent, but only after verifying that no PayPal order exists and there is no active outbox delivery, legal hold, dispute, unresolved payment or tax record. Execute rechecks and mutations atomically with D1-supported transaction semantics. Do not issue a deletion query based solely on these FK rows.

**Outstanding:** production index and trigger metadata, enforcement status, legal retention approval, operational hold/reconciliation controls, staging integration tests. No production mutation authorized.
