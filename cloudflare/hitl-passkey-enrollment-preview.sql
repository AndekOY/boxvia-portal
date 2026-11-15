-- Preview only. Registration challenges never authorize HITL decisions.
CREATE TABLE IF NOT EXISTS hitl_passkey_enrollments (
 id TEXT PRIMARY KEY,
 owner_id TEXT NOT NULL,
 challenge_sha256 TEXT NOT NULL UNIQUE CHECK(length(challenge_sha256)=64),
 rp_id TEXT NOT NULL,
 origin TEXT NOT NULL,
 expires_at INTEGER NOT NULL,
 state TEXT NOT NULL DEFAULT 'PENDING' CHECK(state IN ('PENDING','CONSUMED','EXPIRED')),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 consumed_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_hitl_passkey_enrollments_owner ON hitl_passkey_enrollments(owner_id,state,expires_at);
