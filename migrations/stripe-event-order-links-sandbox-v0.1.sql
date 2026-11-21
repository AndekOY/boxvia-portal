-- Additive evidence linkage for future Stripe Test events only.
-- Never backfill an existing event/order association without independent provider evidence.
-- Sandbox D1 only. No changes to payment_events or existing order tables.
CREATE TABLE IF NOT EXISTS stripe_event_order_links (
  provider TEXT NOT NULL DEFAULT 'stripe' CHECK (provider = 'stripe'),
  event_id TEXT NOT NULL,
  order_id TEXT NOT NULL,
  payment_attempt_id TEXT NOT NULL,
  stripe_session_id TEXT NOT NULL,
  payload_digest TEXT NOT NULL CHECK (length(payload_digest) = 64),
  linked_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (provider, event_id),
  FOREIGN KEY (provider, event_id) REFERENCES payment_events(provider, event_id),
  FOREIGN KEY (order_id) REFERENCES service_orders(id),
  FOREIGN KEY (payment_attempt_id) REFERENCES payment_attempts(id),
  UNIQUE (stripe_session_id, event_id)
);
CREATE INDEX IF NOT EXISTS idx_stripe_event_order_links_order ON stripe_event_order_links(order_id);
