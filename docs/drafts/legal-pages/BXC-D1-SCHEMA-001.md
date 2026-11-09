# BXC-D1-SCHEMA-001 | Production D1 data inventory | v0.1 | INTERNAL DRAFT
Date: 2026-11-09
Source: owner-exported Cloudflare D1 Studio CSV, metadata-only SELECT sqlite_master JOIN pragma_table_info; 30 columns, four application tables.
No record values, credentials, payment tokens, or customer data inspected.

## Exact verified schema
claim_access: claim_id INTEGER PK; token_hash TEXT NOT NULL; created_at TEXT NOT NULL.
claims: id INTEGER PK; created_at TEXT NOT NULL; customer_email TEXT NOT NULL; claim_text TEXT NOT NULL; source_url TEXT nullable; status TEXT NOT NULL; payment_status TEXT NOT NULL; report_url TEXT nullable; notes TEXT nullable.
notification_outbox: id INTEGER PK; claim_id INTEGER NOT NULL; event_type TEXT NOT NULL; status TEXT NOT NULL; attempts INTEGER NOT NULL; last_error TEXT nullable; created_at TEXT NOT NULL; updated_at TEXT NOT NULL; sent_at TEXT nullable.
paypal_orders: id INTEGER PK; claim_id INTEGER NOT NULL; paypal_order_id TEXT NOT NULL; amount TEXT NOT NULL; currency TEXT NOT NULL; status TEXT NOT NULL; capture_id TEXT nullable; created_at TEXT NOT NULL; updated_at TEXT NOT NULL.

## Privacy inventory and limits
- Claims may contain identifying contact email, customer-supplied claim text, primary-source URL, report URL and internal notes. The structure does not prove actual field contents or categories in free text.
- Access uses a stored token_hash; hashing algorithm, token generation, expiration and deletion require code/operational verification.
- PayPal order/capture IDs, amount, currency and payment status are stored. No dedicated card number or CVV column in these four tables; this does NOT prove no card data in other services.
- Notification error text may include unexpected personal data; inspect logging and error sanitization without exposing live records.
- No explicit expiration/deletion or consent/Terms version fields in these tables. Separate systems and retention processes remain unverified.
- Cloudflare D1 backups/Time Travel, provider logs, actual retention, legal basis, transfers and processor roles cannot be established from schema alone.
- Privacy Notice should distinguish mandatory contact and claim fields from optional source URL/notes, describe payment metadata and notification handling, and not promise a specific retention period until verified.
- BXC consumer checkout implementation requires separate versioned legal acceptance and early-performance consent evidence; schema does not presently have dedicated fields.

## Gate
Schema evidence CONFIRMED; data flow PARTIALLY ESTABLISHED; deletion, consent, cookies and GDPR operational procedures UNVERIFIED; RELEASE HOLD.
