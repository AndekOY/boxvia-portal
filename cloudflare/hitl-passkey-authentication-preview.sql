-- Isolated Preview only: login challenge does not authorize HITL decisions.
CREATE TABLE IF NOT EXISTS hitl_passkey_login_challenges (
 id TEXT PRIMARY KEY,
 owner_id TEXT NOT NULL,
 credential_id TEXT NOT NULL REFERENCES hitl_authenticators(credential_id),
 challenge_sha256 TEXT NOT NULL UNIQUE CHECK(length(challenge_sha256)=64),
 rp_id TEXT NOT NULL,
 origin TEXT NOT NULL,
 expires_at INTEGER NOT NULL,
 state TEXT NOT NULL DEFAULT 'PENDING' CHECK(state IN ('PENDING','CONSUMED','EXPIRED')),
 consumed_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_hitl_passkey_login_owner ON hitl_passkey_login_challenges(owner_id,state,expires_at);
