-- Sandbox-only: one payment provider/attempt per order, including cross-provider races.
-- Require preflight: zero orders with more than one payment attempt.
CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_attempt_one_total_per_order ON payment_attempts(order_id);
