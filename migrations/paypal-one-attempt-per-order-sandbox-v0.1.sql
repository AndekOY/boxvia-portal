-- Sandbox only; requires a verified backup and a separate migration run.
-- Prevent multiple PayPal attempts for one commercial service order.
CREATE UNIQUE INDEX IF NOT EXISTS idx_paypal_one_attempt_per_order
 ON payment_attempts(order_id) WHERE provider = 'paypal';
