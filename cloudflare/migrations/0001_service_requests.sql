-- Apply to isolated Preview D1 first; production requires separate approval.
-- Do not execute against production until retention and owner retrieval are approved.
CREATE TABLE IF NOT EXISTS service_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  service_code TEXT NOT NULL CHECK (service_code IN (
    'one-question-review', 'ai-governance-review', 'technical-pilot',
    'pre-decision-review', 'ai-governance-gap-assessment', 'faar-stage-1'
  )),
  customer_email TEXT NOT NULL,
  request_body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_review', 'closed')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_service_requests_created_at ON service_requests(created_at);
