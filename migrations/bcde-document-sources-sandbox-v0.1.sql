-- BCDE sandbox-only canonical commercial source; not an invoice.
-- Must be populated by trusted owner-side terms approval before client acceptance.
CREATE TABLE IF NOT EXISTS order_document_sources (
 order_id TEXT PRIMARY KEY NOT NULL REFERENCES service_orders(id),
 terms_digest TEXT NOT NULL CHECK(length(terms_digest)=64),
 terms_version TEXT NOT NULL,
 scope_text TEXT NOT NULL CHECK(length(scope_text)>0),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
