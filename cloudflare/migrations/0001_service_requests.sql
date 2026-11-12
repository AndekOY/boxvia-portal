-- Fresh-install schema aligned with the observed isolated Preview D1 schema (audit #5, 2026-11-12).
-- NOT an ALTER migration. Never apply to an existing database to reconcile its schema.
-- Do not apply to Production without explicit authorization and a reviewed rollout.
-- Existing remote sandbox D1 remains untouched.
CREATE TABLE IF NOT EXISTS service_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  service_code TEXT NOT NULL,
  service_title TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  request_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'reviewing', 'closed', 'deleted')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_service_requests_created_at ON service_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_service_requests_review ON service_requests(status, created_at);
