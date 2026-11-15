-- HITL human-attestation preparation v0.1. Preview only; not an identity-verification implementation.
-- Credentials must only be activated after owner-controlled WebAuthn enrollment and independent verification.
CREATE TABLE IF NOT EXISTS hitl_authenticators (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 credential_id TEXT NOT NULL UNIQUE,
 owner_id TEXT NOT NULL,
 public_key_cose TEXT NOT NULL,
 rp_id TEXT NOT NULL,
 sign_count INTEGER NOT NULL DEFAULT 0 CHECK(sign_count >= 0),
 user_verified_required INTEGER NOT NULL DEFAULT 1 CHECK(user_verified_required = 1),
 state TEXT NOT NULL DEFAULT 'PENDING' CHECK(state IN ('PENDING','ACTIVE','REVOKED')),
 enrolled_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 activated_at TEXT,
 revoked_at TEXT,
 enrollment_ref TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS hitl_auth_challenges (
 id TEXT PRIMARY KEY,
 case_id INTEGER NOT NULL REFERENCES hitl_cases(id),
 gate TEXT NOT NULL CHECK(gate IN ('H3','H4','H5')),
 decision TEXT NOT NULL CHECK(decision = 'PASS'),
 payload_sha256 TEXT NOT NULL CHECK(length(payload_sha256)=64),
 chain_head_sha256 TEXT NOT NULL CHECK(length(chain_head_sha256)=64),
 credential_id TEXT REFERENCES hitl_authenticators(credential_id),
 challenge_sha256 TEXT NOT NULL UNIQUE CHECK(length(challenge_sha256)=64),
 expires_at INTEGER NOT NULL,
 state TEXT NOT NULL DEFAULT 'PENDING' CHECK(state IN ('PENDING','CONSUMED','EXPIRED')),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 consumed_at TEXT
);
CREATE TABLE IF NOT EXISTS hitl_auth_proofs (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 challenge_id TEXT NOT NULL UNIQUE REFERENCES hitl_auth_challenges(id),
 case_id INTEGER NOT NULL REFERENCES hitl_cases(id),
 event_id INTEGER NOT NULL UNIQUE REFERENCES hitl_events(id),
 credential_id TEXT NOT NULL REFERENCES hitl_authenticators(credential_id),
 signed_payload_sha256 TEXT NOT NULL CHECK(length(signed_payload_sha256)=64),
 assertion_sha256 TEXT NOT NULL UNIQUE CHECK(length(assertion_sha256)=64),
 uv INTEGER NOT NULL CHECK(uv=1),
 verified_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_hitl_auth_challenges_case ON hitl_auth_challenges(case_id,state,expires_at);
CREATE INDEX IF NOT EXISTS idx_hitl_auth_proofs_case ON hitl_auth_proofs(case_id,event_id);
CREATE TRIGGER IF NOT EXISTS hitl_auth_proofs_immutable_update BEFORE UPDATE ON hitl_auth_proofs BEGIN SELECT RAISE(ABORT,'hitl_proof_immutable'); END;
CREATE TRIGGER IF NOT EXISTS hitl_auth_proofs_immutable_delete BEFORE DELETE ON hitl_auth_proofs BEGIN SELECT RAISE(ABORT,'hitl_proof_immutable'); END;
-- This schema does not by itself prevent unsigned event writes. A subsequent
-- verified-assertion transactional integration and DB-level guard are mandatory.
