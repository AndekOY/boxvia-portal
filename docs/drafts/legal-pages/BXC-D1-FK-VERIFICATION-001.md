# BXC-D1-FK-VERIFICATION-001 | v0.1 | 2026-11-09 | INTERNAL DRAFT
Source: owner-provided Cloudflare D1 Studio CSV export (metadata-only; 3 rows, 7 columns).
Columns: table_name, id, seq, parent_table, child_column, parent_column, on_delete.
Verified:
1. claim_access.claim_id references claims.id — NO ACTION.
2. notification_outbox.claim_id references claims.id — NO ACTION.
3. paypal_orders.claim_id references claims.id — NO ACTION.
All three FK constraints report id=0, seq=0 within their table. The query found no foreign keys defined on claims.
Interpretation: No declared ON DELETE CASCADE on these three relationships. When FK enforcement is active, a referenced parent cannot be deleted without satisfying its constraints. FK enforcement state, triggers, indexes, and all non-FK application behavior were NOT established by this CSV.
Architecture: preserve paid claim parent while payment evidence is legally required; prefer minimized/redacted working data. For unpaid cases, review deletion of eligible dependent records first, then parent, in a single safe transaction with fresh payment and hold checks. No executable deletion authorized.
Open: production indexes/triggers, PRAGMA foreign_keys behavior, refund/chargeback evidence, retention approval, accounting preservation, staging tests.
STATUS: FK ACTIONS VERIFIED; RELEASE HOLD.
