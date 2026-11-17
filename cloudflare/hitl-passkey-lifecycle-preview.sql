-- Preview only. Activation/revocation requests are audit records, not permission grants.
CREATE TABLE IF NOT EXISTS hitl_passkey_lifecycle_events (
 id TEXT PRIMARY KEY,
 credential_id TEXT NOT NULL REFERENCES hitl_authenticators(credential_id),
 owner_id TEXT NOT NULL,
 action TEXT NOT NULL CHECK(action IN ('ACTIVATION_REQUESTED','ACTIVATED','REVOCATION_REQUESTED','REVOKED','DENIED')),
 from_state TEXT NOT NULL CHECK(from_state IN ('PENDING','ACTIVE','REVOKED')),
 to_state TEXT NOT NULL CHECK(to_state IN ('PENDING','ACTIVE','REVOKED')),
 evidence_ref TEXT NOT NULL,
 actor_type TEXT NOT NULL CHECK(actor_type IN ('VERIFIED_OWNER','INDEPENDENT_APPROVER','SYSTEM')),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_hitl_passkey_lifecycle_credential ON hitl_passkey_lifecycle_events(credential_id,created_at);
CREATE TRIGGER IF NOT EXISTS hitl_passkey_lifecycle_no_update BEFORE UPDATE ON hitl_passkey_lifecycle_events BEGIN SELECT RAISE(ABORT,'immutable_lifecycle'); END;
CREATE TRIGGER IF NOT EXISTS hitl_passkey_lifecycle_no_delete BEFORE DELETE ON hitl_passkey_lifecycle_events BEGIN SELECT RAISE(ABORT,'immutable_lifecycle'); END;
-- No automatic PENDING -> ACTIVE transition is defined here.
-- Activation requires a separate independently approved, audited procedure.
