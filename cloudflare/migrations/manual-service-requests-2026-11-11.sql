-- BoxVia manual service-request intake. Apply to boxvia-claims D1 before deploying D1-only intake.
-- Contains personal data. Restrict console access and define retention/deletion policy before production.
CREATE TABLE IF NOT EXISTS service_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  service_code TEXT NOT NULL,
  service_title TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  request_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK(status IN ('new','reviewing','closed','deleted')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_service_requests_review ON service_requests(status, created_at);
-- Manual review query (do not expose via public API):
-- SELECT id, service_code, customer_email, status, created_at FROM service_requests WHERE status = 'new' ORDER BY created_at ASC;
