-- BoxVia HITL registry v1.0 - apply to preview D1 first, never automatically to production.
-- Registry is separate from claims and service_requests; source identifiers are not globally unique.
CREATE TABLE IF NOT EXISTS hitl_cases (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 source_type TEXT NOT NULL CHECK(source_type IN ('claim','service')),
 source_id INTEGER NOT NULL CHECK(source_id > 0),
 assessor TEXT NOT NULL DEFAULT 'Andrey Ekhmenin',
 status TEXT NOT NULL DEFAULT 'HOLD' CHECK(status IN ('HOLD','PASS','STOP')),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE(source_type, source_id)
);
CREATE TABLE IF NOT EXISTS hitl_events (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 case_id INTEGER NOT NULL REFERENCES hitl_cases(id),
 gate TEXT NOT NULL CHECK(gate IN ('H1','H2','H3','H4','H5')),
 decision TEXT NOT NULL CHECK(decision IN ('PASS','HOLD','STOP')),
 evidence_ref TEXT NOT NULL CHECK(length(evidence_ref) BETWEEN 1 AND 500),
 note TEXT CHECK(note IS NULL OR length(note) <= 1000),
 actor TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_hitl_events_case_gate ON hitl_events(case_id,gate,id);
CREATE INDEX IF NOT EXISTS idx_hitl_cases_status ON hitl_cases(status,created_at);
-- No client email, claim text, credentials, source URL or raw evidence stored in this registry.

-- Atomic gate checks live in SQLite, not in a read-then-write API sequence.
CREATE TRIGGER IF NOT EXISTS hitl_event_validate BEFORE INSERT ON hitl_events
BEGIN
 SELECT CASE WHEN (SELECT status FROM hitl_cases WHERE id=NEW.case_id) <> 'HOLD'
   THEN RAISE(ABORT,'hitl_case_closed') END;
 SELECT CASE WHEN NEW.actor <> (SELECT assessor FROM hitl_cases WHERE id=NEW.case_id)
   THEN RAISE(ABORT,'hitl_actor_mismatch') END;
 SELECT CASE WHEN NEW.decision='PASS' AND NEW.gate IN ('H2','H3','H4','H5')
   AND (SELECT decision FROM hitl_events WHERE case_id=NEW.case_id AND gate='H1' ORDER BY id DESC LIMIT 1) IS NOT 'PASS'
   THEN RAISE(ABORT,'hitl_prior_gate_missing') END;
 SELECT CASE WHEN NEW.decision='PASS' AND NEW.gate IN ('H3','H4','H5')
   AND (SELECT decision FROM hitl_events WHERE case_id=NEW.case_id AND gate='H2' ORDER BY id DESC LIMIT 1) IS NOT 'PASS'
   THEN RAISE(ABORT,'hitl_prior_gate_missing') END;
 SELECT CASE WHEN NEW.decision='PASS' AND NEW.gate IN ('H4','H5')
   AND (SELECT decision FROM hitl_events WHERE case_id=NEW.case_id AND gate='H3' ORDER BY id DESC LIMIT 1) IS NOT 'PASS'
   THEN RAISE(ABORT,'hitl_prior_gate_missing') END;
 SELECT CASE WHEN NEW.decision='PASS' AND NEW.gate='H5'
   AND (SELECT decision FROM hitl_events WHERE case_id=NEW.case_id AND gate='H4' ORDER BY id DESC LIMIT 1) IS NOT 'PASS'
   THEN RAISE(ABORT,'hitl_prior_gate_missing') END;
END;
CREATE TRIGGER IF NOT EXISTS hitl_event_status AFTER INSERT ON hitl_events
BEGIN
 UPDATE hitl_cases SET
   status=CASE WHEN NEW.decision='STOP' THEN 'STOP'
               WHEN NEW.gate='H5' AND NEW.decision='PASS' THEN 'PASS'
               ELSE 'HOLD' END,
   updated_at=CURRENT_TIMESTAMP WHERE id=NEW.case_id;
END;
CREATE TRIGGER IF NOT EXISTS hitl_event_immutable_update BEFORE UPDATE ON hitl_events
BEGIN SELECT RAISE(ABORT,'hitl_event_immutable'); END;
CREATE TRIGGER IF NOT EXISTS hitl_event_immutable_delete BEFORE DELETE ON hitl_events
BEGIN SELECT RAISE(ABORT,'hitl_event_immutable'); END;
