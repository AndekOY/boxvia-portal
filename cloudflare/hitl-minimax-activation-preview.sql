-- Preview D1 only: action-specific owner activation challenges.
CREATE TABLE IF NOT EXISTS hitl_minimax_activation_challenges (
 id TEXT PRIMARY KEY,
 owner_id TEXT NOT NULL,
 credential_id TEXT NOT NULL REFERENCES hitl_authenticators(credential_id),
 challenge_sha256 TEXT NOT NULL UNIQUE CHECK(length(challenge_sha256)=64),
 purpose TEXT NOT NULL CHECK(purpose='OWNER_ACTIVATE_MINIMAX_V1'),
 rp_id TEXT NOT NULL,
 origin TEXT NOT NULL,
 expires_at INTEGER NOT NULL,
 state TEXT NOT NULL DEFAULT 'PENDING' CHECK(state IN ('PENDING','CONSUMED')),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 consumed_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_hitl_minimax_activation_owner ON hitl_minimax_activation_challenges(owner_id,state,expires_at);
