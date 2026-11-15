-- PREVIEW ONLY v4: reject stale event history and persist verified authenticator counter
-- after signed event. Requires v1-v3 migrations. No WebAuthn verification in SQL.
ALTER TABLE hitl_verified_commit_intents ADD COLUMN expected_last_event_id INTEGER;
ALTER TABLE hitl_verified_commit_intents ADD COLUMN verified_sign_count INTEGER;
DROP TRIGGER IF EXISTS hitl_signed_event_guard_v3;
CREATE TRIGGER hitl_signed_event_guard_v4 BEFORE INSERT ON hitl_events
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
    AND i.expected_last_event_id IS NOT NULL
    AND i.expected_last_event_id=COALESCE((SELECT MAX(id) FROM hitl_events WHERE case_id=NEW.case_id),0)
    AND i.verified_sign_count IS NOT NULL AND i.verified_sign_count>=0
    AND (i.verified_sign_count=0 OR a.sign_count=0 OR i.verified_sign_count>a.sign_count)
    AND c.state='PENDING' AND c.expires_at>CAST(strftime('%s','now') AS INTEGER)
    AND c.case_id=NEW.case_id AND c.gate=NEW.gate
    AND c.credential_id=i.credential_id AND c.payload_sha256=i.payload_sha256
    AND a.state='ACTIVE'
 ) THEN RAISE(ABORT,'hitl_signed_snapshot_or_counter_invalid') END;
END;
CREATE TRIGGER hitl_signed_counter_v4 AFTER INSERT ON hitl_events
WHEN NEW.gate IN ('H3','H4','H5') AND NEW.decision='PASS'
BEGIN
 UPDATE hitl_authenticators
 SET sign_count=CASE WHEN sign_count=0 AND
  (SELECT verified_sign_count FROM hitl_verified_commit_intents WHERE id=NEW.signed_intent_id)=0
  THEN 0 ELSE (SELECT verified_sign_count FROM hitl_verified_commit_intents WHERE id=NEW.signed_intent_id) END
 WHERE credential_id=(SELECT credential_id FROM hitl_verified_commit_intents WHERE id=NEW.signed_intent_id)
   AND state='ACTIVE'
   AND (sign_count=0 OR (SELECT verified_sign_count FROM hitl_verified_commit_intents WHERE id=NEW.signed_intent_id)=0
        OR (SELECT verified_sign_count FROM hitl_verified_commit_intents WHERE id=NEW.signed_intent_id)>sign_count);
 SELECT CASE WHEN changes()!=1 THEN RAISE(ABORT,'hitl_sign_counter_update_failed') END;
END;
-- This event-ID snapshot rejects intervening append operations but does not
-- cryptographically validate the chain head or bind all signed review fields.
-- Only trusted server code after verified assertion may create an intent.
