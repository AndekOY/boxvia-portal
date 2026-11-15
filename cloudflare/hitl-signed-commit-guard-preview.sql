-- Preview-only HITL signed-commit hardening. Not sufficient by itself to establish human identity.
-- Requires hitl-registry-migration.sql and hitl-human-attestation-migration.sql.
-- The existing bearer-only HTTP path MUST remain in HOLD mode for H3-H5 PASS.
CREATE TABLE IF NOT EXISTS hitl_verified_commit_intents (
 id TEXT PRIMARY KEY,
 challenge_id TEXT NOT NULL UNIQUE REFERENCES hitl_auth_challenges(id),
 case_id INTEGER NOT NULL REFERENCES hitl_cases(id),
 gate TEXT NOT NULL CHECK(gate IN ('H3','H4','H5')),
 payload_sha256 TEXT NOT NULL CHECK(length(payload_sha256)=64),
 assertion_sha256 TEXT NOT NULL UNIQUE CHECK(length(assertion_sha256)=64),
 credential_id TEXT NOT NULL REFERENCES hitl_authenticators(credential_id),
 event_id INTEGER UNIQUE REFERENCES hitl_events(id),
 state TEXT NOT NULL DEFAULT 'PENDING' CHECK(state IN ('PENDING','CONSUMED')),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
-- Intent creation is NOT evidence of verified signature: only trusted server code
-- may create it after WebAuthn verification. D1 itself cannot verify ES256.
CREATE TRIGGER IF NOT EXISTS hitl_signed_event_guard BEFORE INSERT ON hitl_events
WHEN NEW.gate IN ('H3','H4','H5') AND NEW.decision='PASS'
BEGIN
 SELECT CASE WHEN NOT EXISTS (
   SELECT 1 FROM hitl_verified_commit_intents i
   JOIN hitl_auth_challenges c ON c.id=i.challenge_id
   JOIN hitl_authenticators a ON a.credential_id=i.credential_id
   WHERE i.case_id=NEW.case_id AND i.gate=NEW.gate AND i.state='PENDING'
     AND i.event_id IS NULL AND c.state='PENDING'
     AND c.expires_at > CAST(strftime('%s','now') AS INTEGER)
     AND c.case_id=NEW.case_id AND c.gate=NEW.gate
     AND c.payload_sha256=i.payload_sha256
     AND a.state='ACTIVE'
 ) THEN RAISE(ABORT,'hitl_verified_intent_required') END;
END;
-- The intent must be consumed and proof inserted in the SAME D1 transaction as
-- the event. This schema cannot guarantee that pairing: implement a trusted
-- transaction coordinator before enabling production release.
