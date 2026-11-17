-- Canonical decision snapshot must be provisioned by a trusted server-side process.
-- Never accept arbitrary hashes from a browser as authoritative evidence.
CREATE TABLE IF NOT EXISTS hitl_minimax_snapshots (
 case_id TEXT NOT NULL,
 decision_id TEXT NOT NULL,
 version INTEGER NOT NULL CHECK(version>0),
 gate TEXT NOT NULL CHECK(gate IN ('H1','H2','H3','H4','H5')),
 payload_sha256 TEXT NOT NULL CHECK(length(payload_sha256)=64),
 chain_head_sha256 TEXT NOT NULL CHECK(length(chain_head_sha256)=64),
 state TEXT NOT NULL DEFAULT 'READY' CHECK(state='READY'),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY(decision_id,version)
);
CREATE TRIGGER IF NOT EXISTS hitl_minimax_snapshots_no_update BEFORE UPDATE ON hitl_minimax_snapshots BEGIN SELECT RAISE(ABORT,'immutable_snapshot'); END;
CREATE TRIGGER IF NOT EXISTS hitl_minimax_snapshots_no_delete BEFORE DELETE ON hitl_minimax_snapshots BEGIN SELECT RAISE(ABORT,'immutable_snapshot'); END;
-- HITL-Minimax v1.0: isolated Preview D1 only. No production migration.
-- Evidence rows are immutable. This schema is NOT an authorization endpoint.
CREATE TABLE IF NOT EXISTS hitl_minimax_challenges (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  credential_id TEXT NOT NULL REFERENCES hitl_authenticators(credential_id),
  case_id TEXT NOT NULL,
  decision_id TEXT NOT NULL,
  decision_version INTEGER NOT NULL CHECK(decision_version > 0),
  action TEXT NOT NULL CHECK(action IN ('APPROVE','REJECT')),
  snapshot_sha256 TEXT NOT NULL CHECK(length(snapshot_sha256)=64),
  challenge_sha256 TEXT NOT NULL UNIQUE CHECK(length(challenge_sha256)=64),
  rp_id TEXT NOT NULL,
  origin TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  state TEXT NOT NULL DEFAULT 'PENDING' CHECK(state IN ('PENDING','CONSUMED')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  consumed_at TEXT
);
CREATE TABLE IF NOT EXISTS hitl_minimax_proofs (
  id TEXT PRIMARY KEY,
  challenge_id TEXT NOT NULL UNIQUE REFERENCES hitl_minimax_challenges(id),
  owner_id TEXT NOT NULL,
  credential_id TEXT NOT NULL REFERENCES hitl_authenticators(credential_id),
  case_id TEXT NOT NULL,
  decision_id TEXT NOT NULL,
  decision_version INTEGER NOT NULL CHECK(decision_version > 0),
  action TEXT NOT NULL CHECK(action IN ('APPROVE','REJECT')),
  snapshot_sha256 TEXT NOT NULL CHECK(length(snapshot_sha256)=64),
  assertion_sha256 TEXT NOT NULL UNIQUE CHECK(length(assertion_sha256)=64),
  user_verified INTEGER NOT NULL CHECK(user_verified=1),
  verified_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(decision_id,decision_version)
);
CREATE TRIGGER IF NOT EXISTS hitl_minimax_proofs_no_update BEFORE UPDATE ON hitl_minimax_proofs BEGIN SELECT RAISE(ABORT,'immutable_proof'); END;
CREATE TRIGGER IF NOT EXISTS hitl_minimax_proofs_no_delete BEFORE DELETE ON hitl_minimax_proofs BEGIN SELECT RAISE(ABORT,'immutable_proof'); END;
CREATE INDEX IF NOT EXISTS hitl_minimax_pending ON hitl_minimax_challenges(owner_id,state,expires_at);
