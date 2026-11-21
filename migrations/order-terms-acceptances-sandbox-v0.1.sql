-- Sandbox-only additive commercial acceptance evidence. Do not apply to Production.
-- Each accepted terms revision is immutable. Revisions require a new digest.
CREATE TABLE IF NOT EXISTS order_terms_acceptances (
  order_id TEXT PRIMARY KEY NOT NULL REFERENCES service_orders(id),
  service_code TEXT NOT NULL,
  amount_minor INTEGER NOT NULL CHECK(amount_minor > 0),
  currency TEXT NOT NULL CHECK(currency = 'USD'),
  scope_digest TEXT NOT NULL CHECK(length(scope_digest)=64),
  terms_digest TEXT NOT NULL CHECK(length(terms_digest)=64),
  deliverable TEXT NOT NULL,
  deadline TEXT NOT NULL,
  quote_id TEXT REFERENCES service_quotes(id),
  offer_version TEXT NOT NULL,
  offer_digest TEXT NOT NULL CHECK(length(offer_digest)=64),
  offer_accepted_at TEXT NOT NULL,
  confidentiality_version TEXT NOT NULL,
  confidentiality_digest TEXT NOT NULL CHECK(length(confidentiality_digest)=64),
  confidentiality_accepted_at TEXT NOT NULL,
  confirmed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_order_terms_acceptances_quote ON order_terms_acceptances(quote_id);
