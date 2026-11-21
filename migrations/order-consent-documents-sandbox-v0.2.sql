-- Sandbox only. Owner must provision both canonical documents before any acceptance.
-- Existing orders remain fail-closed: nullable additions cannot authorize consent.
ALTER TABLE order_document_sources ADD COLUMN offer_text TEXT;
ALTER TABLE order_document_sources ADD COLUMN offer_version TEXT;
ALTER TABLE order_document_sources ADD COLUMN confidentiality_text TEXT;
ALTER TABLE order_document_sources ADD COLUMN confidentiality_version TEXT;
ALTER TABLE order_document_sources ADD COLUMN deliverable TEXT;
ALTER TABLE order_document_sources ADD COLUMN deadline TEXT;
