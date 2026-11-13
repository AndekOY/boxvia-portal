-- Authorized clean reset of Production service_requests only, 2026-11-13.
-- All existing rows are test data per owner; no backup requested.
-- Do not touch claims or any other table.
DROP TABLE IF EXISTS service_requests;
CREATE TABLE service_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  service_code TEXT NOT NULL,
  service_title TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  request_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'reviewing', 'closed', 'deleted')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  request_key TEXT,
  request_digest TEXT
);
CREATE INDEX idx_service_requests_created_at ON service_requests(created_at);
CREATE INDEX idx_service_requests_review ON service_requests(status, created_at);
CREATE UNIQUE INDEX idx_service_requests_request_key ON service_requests(request_key);
