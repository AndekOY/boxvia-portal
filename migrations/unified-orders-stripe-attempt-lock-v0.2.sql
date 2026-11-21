-- Sandbox ONLY. Apply after verifying no duplicate Stripe attempts per order.
-- Unique partial index is the concurrency barrier for Checkout Session creation.
CREATE UNIQUE INDEX IF NOT EXISTS idx_stripe_one_attempt_per_order
ON payment_attempts(order_id) WHERE provider = 'stripe';
