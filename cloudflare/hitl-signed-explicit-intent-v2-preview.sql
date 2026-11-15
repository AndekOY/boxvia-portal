-- PREVIEW-ONLY v2 explicit intent binding. Never apply to production.
-- Requires registry, attestation, signed-guard and signed-atomic prototype migrations.
-- SQLite ADD COLUMN is irreversible here; this is a separate migration, not a rewrite.
ALTER TABLE hitl_events ADD COLUMN signed_intent_id TEXT;
DROP TRIGGER IF EXISTS hitl_signed_event_guard;
DROP TRIGGER IF EXISTS hitl_signed_event_consume;
CREATE TRIGGER hitl_signed_event_guard_v2 BEFORE INSERT ON hitl_events
WHEN NEW.gate IN ('H3','H4','H5') AND NEW.decision='PASS'
BEGIN
 SELECT CASE WHEN NEW.signed_intent_id IS NULL OR NOT EXISTS (
   SELECT 1 FROM hitl_verified_commit_intents i
   JOIN hitl_auth_challenges c ON c.id=i.challenge_id
   JOIN hitl_authenticators a ON a.credential_id=i.credential_id
   WHERE i.id=NEW.signed_intent_id AND i.case_id=NEW.case_id
     AND i.gate=NEW.gate AND i.state='PENDING' AND i.event_id IS NULL
     AND c.state='PENDING' AND c.expires_at>CAST(strftime('%s','now') AS INTEGER)
     AND c.case_id=NEW.case_id AND c.gate=NEW.gate
     AND c.credential_id=i.credential_id AND c.payload_sha256=i.payload_sha256
     AND a.state='ACTIVE'
 ) THEN RAISE(ABORT,'hitl_exact_verified_intent_required') END;
END;
CREATE TRIGGER hitl_signed_event_consume_v2 AFTER INSERT ON hitl_events
WHEN NEW.gate IN ('H3','H4','H5') AND NEW.decision='PASS'
BEGIN
 UPDATE hitl_verified_commit_intents SET state='CONSUMED',event_id=NEW.id
   WHERE id=NEW.signed_intent_id AND state='PENDING' AND event_id IS NULL;
 SELECT CASE WHEN changes()<>1 THEN RAISE(ABORT,'hitl_intent_consume_failed') END;
 UPDATE hitl_auth_challenges SET state='CONSUMED',consumed_at=CURRENT_TIMESTAMP
   WHERE id=(SELECT challenge_id FROM hitl_verified_commit_intents WHERE id=NEW.signed_intent_id)
     AND state='PENDING';
 SELECT CASE WHEN changes()<>1 THEN RAISE(ABORT,'hitl_challenge_consume_failed') END;
 INSERT INTO hitl_auth_proofs(challenge_id,case_id,event_id,credential_id,signed_payload_sha256,assertion_sha256,uv)
 SELECT challenge_id,NEW.case_id,NEW.id,credential_id,payload_sha256,assertion_sha256,1
   FROM hitl_verified_commit_intents WHERE id=NEW.signed_intent_id AND state='CONSUMED';
 SELECT CASE WHEN changes()<>1 THEN RAISE(ABORT,'hitl_proof_insert_failed') END;
END;
-- Note: an explicit ID eliminates ambiguity but does not prove WebAuthn verification,
-- review-content binding, server authorization or genuine human participation.
