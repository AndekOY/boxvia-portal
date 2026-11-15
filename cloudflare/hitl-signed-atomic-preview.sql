-- PREVIEW-ONLY experimental atomic event/proof pairing.
-- Trusted server must verify WebAuthn before inserting intent; this schema DOES NOT verify signatures.
-- Apply after hitl-signed-commit-guard-preview.sql. Do not deploy to production.
-- A signed H3-H5 event consumes exactly one pending intent and its challenge,
-- and inserts a linked proof inside the same SQLite statement/transaction.
-- Existing hitl_signed_event_guard checks presence of pending eligible intent.
CREATE TRIGGER IF NOT EXISTS hitl_signed_event_consume AFTER INSERT ON hitl_events
WHEN NEW.gate IN ('H3','H4','H5') AND NEW.decision='PASS'
BEGIN
  UPDATE hitl_verified_commit_intents
    SET state='CONSUMED',event_id=NEW.id
    WHERE id=(
      SELECT i.id FROM hitl_verified_commit_intents i
      JOIN hitl_auth_challenges c ON c.id=i.challenge_id
      JOIN hitl_authenticators a ON a.credential_id=i.credential_id
      WHERE i.case_id=NEW.case_id AND i.gate=NEW.gate AND i.state='PENDING'
        AND i.event_id IS NULL AND c.state='PENDING'
        AND c.expires_at>CAST(strftime('%s','now') AS INTEGER)
        AND c.case_id=NEW.case_id AND c.gate=NEW.gate
        AND c.payload_sha256=i.payload_sha256 AND a.state='ACTIVE'
      ORDER BY i.created_at,i.id LIMIT 1
    ) AND state='PENDING';
  SELECT CASE WHEN changes()<>1 THEN RAISE(ABORT,'hitl_intent_consume_failed') END;
  UPDATE hitl_auth_challenges SET state='CONSUMED',consumed_at=CURRENT_TIMESTAMP
    WHERE id=(SELECT challenge_id FROM hitl_verified_commit_intents WHERE event_id=NEW.id)
      AND state='PENDING';
  SELECT CASE WHEN changes()<>1 THEN RAISE(ABORT,'hitl_challenge_consume_failed') END;
  INSERT INTO hitl_auth_proofs(challenge_id,case_id,event_id,credential_id,signed_payload_sha256,assertion_sha256,uv)
    SELECT i.challenge_id,NEW.case_id,NEW.id,i.credential_id,i.payload_sha256,i.assertion_sha256,1
    FROM hitl_verified_commit_intents i WHERE i.event_id=NEW.id AND i.state='CONSUMED';
  SELECT CASE WHEN changes()<>1 THEN RAISE(ABORT,'hitl_proof_insert_failed') END;
END;
-- Hardening: no accidental reuse of a challenge or credential proof.
-- IMPORTANT: concurrent different pending intents for same case/gate are not disambiguated
-- by the HITL event insert itself. The production design MUST use a uniquely identified
-- commit intent, transaction-bound review digest, and authenticated owner session.
-- This is an experimental DB atomicity fixture, NOT a deployable approval flow.
