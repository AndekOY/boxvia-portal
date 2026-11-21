-- Sandbox-only: enforce at most one payment attempt per provider and order.
-- Preflight MUST prove no existing duplicate groups before applying.
CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_attempt_one_per_order_provider ON payment_attempts(order_id, provider);
