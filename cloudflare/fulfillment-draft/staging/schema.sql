-- INTERNAL DRAFT / RELEASE HOLD. LOCAL SQLITE STAGING ONLY. DO NOT APPLY TO PRODUCTION.
PRAGMA foreign_keys=ON;
CREATE TABLE claims (id INTEGER PRIMARY KEY, payment_status TEXT NOT NULL);
CREATE TABLE bxc_fulfillment (
 claim_id INTEGER PRIMARY KEY REFERENCES claims(id) ON DELETE NO ACTION,
 state TEXT NOT NULL DEFAULT 'new' CHECK(state IN ('new','in_review','ready','delivered','closed')),
 state_version INTEGER NOT NULL DEFAULT 0 CHECK(state_version>=0),
 started_at TEXT, ready_at TEXT, delivered_at TEXT, closed_at TEXT,
 delivery_channel TEXT, delivery_evidence_reference TEXT, operator_id TEXT,
 updated_at TEXT NOT NULL,
 CHECK(state <> 'delivered' OR (delivered_at IS NOT NULL AND delivery_channel IS NOT NULL AND delivery_evidence_reference IS NOT NULL)),
 CHECK(state <> 'closed' OR (delivered_at IS NOT NULL AND closed_at IS NOT NULL))
);
CREATE TABLE bxc_fulfillment_events (
 event_id INTEGER PRIMARY KEY,
 claim_id INTEGER NOT NULL REFERENCES claims(id) ON DELETE NO ACTION,
 from_state TEXT NOT NULL,
 to_state TEXT NOT NULL,
 actor TEXT NOT NULL,
 occurred_at TEXT NOT NULL,
 delivery_evidence_reference TEXT,
 idempotency_key TEXT NOT NULL UNIQUE,
 state_version INTEGER NOT NULL,
 UNIQUE(claim_id,state_version)
);
CREATE INDEX idx_bxc_fulfillment_events_claim ON bxc_fulfillment_events(claim_id,occurred_at);
