-- INTERNAL DRAFT / RELEASE HOLD. APPLY ONLY TO ISOLATED STAGING WITH EXPLICIT APPROVAL.
-- This file intentionally does not create or modify the existing claims table.
-- Requires verified existing claims(id) and SQLite/D1 foreign key enforcement.
CREATE TABLE IF NOT EXISTS bxc_fulfillment (
 claim_id INTEGER PRIMARY KEY REFERENCES claims(id) ON DELETE NO ACTION,
 state TEXT NOT NULL DEFAULT 'new' CHECK(state IN ('new','in_review','ready','delivered','closed')),
 state_version INTEGER NOT NULL DEFAULT 0 CHECK(state_version>=0),
 started_at TEXT, ready_at TEXT, delivered_at TEXT, closed_at TEXT,
 delivery_channel TEXT, delivery_evidence_reference TEXT, operator_id TEXT,
 updated_at TEXT NOT NULL,
 CHECK(state <> 'delivered' OR
   (length(trim(coalesce(delivered_at,'')))>0 AND length(trim(coalesce(delivery_channel,'')))>0 AND length(trim(coalesce(delivery_evidence_reference,'')))>0)),
 CHECK(state <> 'closed' OR (length(trim(coalesce(delivered_at,'')))>0 AND length(trim(coalesce(closed_at,'')))>0))
);
CREATE TABLE IF NOT EXISTS bxc_fulfillment_events (
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
CREATE INDEX IF NOT EXISTS idx_bxc_fulfillment_events_claim ON bxc_fulfillment_events(claim_id,occurred_at);
