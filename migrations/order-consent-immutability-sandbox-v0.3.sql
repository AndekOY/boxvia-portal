-- Sandbox-only additive evidence immutability. Never apply to Production.
-- Existing accepted evidence and canonical source rows are append-only.
-- A correction requires a new order and a new explicit customer acceptance.
CREATE TRIGGER IF NOT EXISTS trg_order_terms_acceptances_no_update
BEFORE UPDATE ON order_terms_acceptances
BEGIN SELECT RAISE(ABORT, 'accepted terms are immutable'); END;
CREATE TRIGGER IF NOT EXISTS trg_order_terms_acceptances_no_delete
BEFORE DELETE ON order_terms_acceptances
BEGIN SELECT RAISE(ABORT, 'accepted terms are immutable'); END;
CREATE TRIGGER IF NOT EXISTS trg_order_document_sources_no_update
BEFORE UPDATE ON order_document_sources
BEGIN SELECT RAISE(ABORT, 'canonical order documents are immutable'); END;
CREATE TRIGGER IF NOT EXISTS trg_order_document_sources_no_delete
BEFORE DELETE ON order_document_sources
BEGIN SELECT RAISE(ABORT, 'canonical order documents are immutable'); END;
