-- Preview-only v3: bind exact signed intent to event evidence reference.
-- Apply after hitl-signed-explicit-intent-v2-preview.sql; NOT production.
ALTER TABLE hitl_verified_commit_intents ADD COLUMN evidence_ref TEXT;
DROP TRIGGER IF EXISTS hitl_signed_event_guard_v2;
CREATE TRIGGER hitl_signed_event_guard_v3 BEFORE INSERT ON hitl_events
WHEN NEW.gate IN ('H3','H4','H5') AND NEW.decision='PASS'
BEGIN
 SELECT CASE WHEN NEW.signed_intent_id IS NULL OR NOT EXISTS (
   SELECT 1 FROM hitl_verified_commit_intents i
   JOIN hitl_auth_challenges c ON c.id=i.challenge_id
   JOIN hitl_authenticators a ON a.credential_id=i.credential_id
   WHERE i.id=NEW.signed_intent_id AND i.case_id=NEW.case_id
     AND i.gate=NEW.gate AND i.evidence_ref=NEW.evidence_ref
     AND length(i.evidence_ref) BETWEEN 1 AND 500
     AND i.state='PENDING' AND i.event_id IS NULL
     AND c.state='PENDING' AND c.expires_at>CAST(strftime('%s','now') AS INTEGER)
     AND c.case_id=NEW.case_id AND c.gate=NEW.gate
     AND c.credential_id=i.credential_id AND c.payload_sha256=i.payload_sha256
     AND a.state='ACTIVE'
 ) THEN RAISE(ABORT,'hitl_exact_intent_evidence_mismatch') END;
END;
-- The server MUST derive evidence_ref and payload_sha256 from the same canonical
-- signed envelope; this database guard only compares values already stored.
