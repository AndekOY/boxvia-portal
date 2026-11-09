PRAGMA foreign_keys=ON;
CREATE TABLE claims(id INTEGER PRIMARY KEY,created_at TEXT NOT NULL,customer_email TEXT NOT NULL,claim_text TEXT NOT NULL,source_url TEXT,status TEXT NOT NULL,payment_status TEXT NOT NULL,report_url TEXT,notes TEXT);
CREATE INDEX idx_claims_status ON claims(status);
CREATE TABLE claim_access(claim_id INTEGER PRIMARY KEY REFERENCES claims(id) ON DELETE NO ACTION,token_hash TEXT NOT NULL,created_at TEXT NOT NULL);
CREATE TABLE paypal_orders(id INTEGER PRIMARY KEY,claim_id INTEGER NOT NULL REFERENCES claims(id) ON DELETE NO ACTION,paypal_order_id TEXT NOT NULL UNIQUE,amount TEXT NOT NULL,currency TEXT NOT NULL,status TEXT NOT NULL,capture_id TEXT UNIQUE,created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
CREATE INDEX idx_paypal_orders_claim ON paypal_orders(claim_id);
CREATE TABLE notification_outbox(id INTEGER PRIMARY KEY,claim_id INTEGER NOT NULL REFERENCES claims(id) ON DELETE NO ACTION,event_type TEXT NOT NULL,status TEXT NOT NULL,attempts INTEGER NOT NULL,last_error TEXT,created_at TEXT NOT NULL,updated_at TEXT NOT NULL,sent_at TEXT,UNIQUE(claim_id,event_type));
CREATE INDEX idx_notification_outbox_status ON notification_outbox(status,created_at);
CREATE TABLE bxc_retention_control(claim_id INTEGER PRIMARY KEY,legal_hold INTEGER NOT NULL DEFAULT 1 CHECK(legal_hold IN(0,1)),dispute_open INTEGER NOT NULL DEFAULT 1 CHECK(dispute_open IN(0,1)),payment_reconciled INTEGER NOT NULL DEFAULT 0 CHECK(payment_reconciled IN(0,1)),delivery_confirmed_at TEXT,token_expires_at TEXT,review_after TEXT,decision_reference TEXT,reviewed_at TEXT,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
