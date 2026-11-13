-- PREVIEW SANDBOX ONLY. Apply once to existing boxvia-bxc-sandbox BEFORE deploying
-- the idempotent intake Worker. Never apply to Production without approval.
-- Existing rows remain NULL; SQLite permits multiple NULL values in UNIQUE indexes.
ALTER TABLE service_requests ADD COLUMN request_key TEXT;
ALTER TABLE service_requests ADD COLUMN request_digest TEXT;
CREATE UNIQUE INDEX idx_service_requests_request_key ON service_requests(request_key);
