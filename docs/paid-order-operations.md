# BoxVia - paid-order operating queue

The payment transaction is authoritative only when `claims.payment_status = 'paid'` and a matching `paypal_orders` row has `status = 'COMPLETED'`, `amount = '20.00'`, `currency = 'USD'`, and a nonempty `capture_id`.

## Immediate manual operating procedure

Open Cloudflare D1 > boxvia-claims > Console and run:

```sql
SELECT
  c.id AS claim_id,
  c.created_at,
  c.customer_email,
  c.claim_text,
  c.source_url,
  c.notes,
  c.status AS review_status,
  p.paypal_order_id,
  p.capture_id
FROM claims c
JOIN paypal_orders p ON p.claim_id = c.id
WHERE c.payment_status = 'paid'
  AND p.status = 'COMPLETED'
  AND p.amount = '20.00'
  AND p.currency = 'USD'
  AND p.capture_id IS NOT NULL
  AND c.status = 'new'
ORDER BY c.created_at ASC;
```

This is a read-only query. Do not use `claims.payment_status` alone as proof of payment.

After acknowledging an order for review, change only its review status (never its payment status):

```sql
UPDATE claims
SET status = 'in_review'
WHERE id = ? AND status = 'new' AND payment_status = 'paid'
  AND EXISTS (
    SELECT 1 FROM paypal_orders p
    WHERE p.claim_id = claims.id
      AND p.status = 'COMPLETED'
      AND p.amount = '20.00'
      AND p.currency = 'USD'
      AND p.capture_id IS NOT NULL
  );
```

Replace `?` with the exact claim ID when running in the D1 console.

## Automated notifications - pending configuration

An automatic email notifier is NOT deployed. A reliable notifier needs:
- A chosen transactional email provider and verified sender domain.
- A recipient address supplied by the operator.
- Secrets stored in Cloudflare Worker settings, never GitHub.
- A durable notification outbox and retry policy, with idempotent delivery handling.
- A test that confirms an actual message arrived and that failed sends remain retryable.

Do not enable live payments on the assumption that notifications are operational.

## Operational caution

Cloudflare D1 is the source of record. Never include customer email, claim text, PayPal credentials, access tokens or capture IDs in public build logs or analytics. Restrict D1 console access.
