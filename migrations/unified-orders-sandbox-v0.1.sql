-- BoxVia unified orders - sandbox-only proposed D1 migration v0.1.
-- DO NOT apply to Production. Review existing schema and backup first.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS service_orders (
  id TEXT PRIMARY KEY NOT NULL,
  service_request_id INTEGER NOT NULL UNIQUE,
  service_code TEXT NOT NULL,
  amount_minor INTEGER NOT NULL CHECK (amount_minor > 0),
  currency TEXT NOT NULL CHECK (currency = 'USD'),
  quote_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','checkout','paid','fulfillment_ready','in_progress','delivered','cancelled','expired','manual_review','refunded','disputed')),
  capability_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  paid_at TEXT,
  FOREIGN KEY (service_request_id) REFERENCES service_requests(id)
);
CREATE INDEX IF NOT EXISTS idx_service_orders_status ON service_orders(status, created_at);

CREATE TABLE IF NOT EXISTS service_quotes (
  id TEXT PRIMARY KEY NOT NULL,
  service_request_id INTEGER NOT NULL,
  service_code TEXT NOT NULL,
  amount_minor INTEGER NOT NULL CHECK (amount_minor > 0),
  currency TEXT NOT NULL CHECK (currency = 'USD'),
  scope_digest TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('proposed','accepted','rejected','expired')),
  accepted_at TEXT,
  expires_at TEXT,
  FOREIGN KEY (service_request_id) REFERENCES service_requests(id)
);

CREATE TABLE IF NOT EXISTS payment_attempts (
  id TEXT PRIMARY KEY NOT NULL,
  order_id TEXT NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('paypal','stripe')),
  provider_order_id TEXT,
  provider_payment_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('created','pending','verified','failed','cancelled','manual_review','refunded','disputed')),
  amount_minor INTEGER NOT NULL CHECK (amount_minor > 0),
  currency TEXT NOT NULL CHECK (currency = 'USD'),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  verified_at TEXT,
  FOREIGN KEY (order_id) REFERENCES service_orders(id)
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_provider_order ON payment_attempts(provider, provider_order_id) WHERE provider_order_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_provider_capture ON payment_attempts(provider, provider_payment_id) WHERE provider_payment_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS payment_events (
  provider TEXT NOT NULL CHECK (provider IN ('paypal','stripe')),
  event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload_digest TEXT NOT NULL,
  received_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  processed_at TEXT,
  PRIMARY KEY (provider, event_id)
);

CREATE TABLE IF NOT EXISTS fulfillment_outbox (
  id TEXT PRIMARY KEY NOT NULL,
  order_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sending','sent','failed')),
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES service_orders(id)
);
