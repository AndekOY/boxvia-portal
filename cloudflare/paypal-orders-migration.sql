-- Apply once in Cloudflare D1 Console after review.
-- Does not change or delete existing claims.
CREATE TABLE IF NOT EXISTS paypal_orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  claim_id INTEGER NOT NULL,
  paypal_order_id TEXT NOT NULL UNIQUE,
  amount TEXT NOT NULL CHECK (amount = '20.00'),
  currency TEXT NOT NULL CHECK (currency = 'USD'),
  status TEXT NOT NULL DEFAULT 'CREATED',
  capture_id TEXT UNIQUE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (claim_id) REFERENCES claims(id)
);
CREATE INDEX IF NOT EXISTS idx_paypal_orders_claim ON paypal_orders(claim_id);
