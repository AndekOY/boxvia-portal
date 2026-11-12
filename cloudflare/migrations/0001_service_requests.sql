-- Fresh-install schema for isolated Preview D1. NOT an ALTER migration for existing databases.
-- Do not apply to Production without explicit authorization and a reviewed rollout.
-- This schema matches the current cloudflare/service-request.js INSERT statement.
CREATE TABLE IF NOT EXISTS service_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  service_code TEXT NOT NULL CHECK (service_code IN (
    'one-question-review', 'ai-governance-review', 'technical-pilot',
    'pre-decision-review', 'ai-governance-gap-assessment', 'faar-stage-1'
  )),
  service_title TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  request_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_review', 'closed')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_service_requests_created_at ON service_requests(created_at);
