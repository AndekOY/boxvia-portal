-- Isolated Preview D1: independently replayable WebAuthn evidence.
-- Exact clientDataJSON, authenticatorData and signature are preserved as base64url.
-- Public key is a snapshot at signing time, not a mutable credential lookup.
CREATE TABLE IF NOT EXISTS hitl_minimax_proof_bundles (
 proof_id TEXT PRIMARY KEY REFERENCES hitl_minimax_proofs(id),
 canonical_decision TEXT NOT NULL,
 challenge TEXT NOT NULL,
 public_key_spki TEXT NOT NULL,
 client_data_json TEXT NOT NULL,
 authenticator_data TEXT NOT NULL,
 signature TEXT NOT NULL,
 rp_id TEXT NOT NULL,
 origin TEXT NOT NULL,
 sign_count_before INTEGER NOT NULL,
 sign_count_after INTEGER NOT NULL,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TRIGGER IF NOT EXISTS hitl_minimax_bundle_no_update BEFORE UPDATE ON hitl_minimax_proof_bundles BEGIN SELECT RAISE(ABORT,'immutable_bundle'); END;
CREATE TRIGGER IF NOT EXISTS hitl_minimax_bundle_no_delete BEFORE DELETE ON hitl_minimax_proof_bundles BEGIN SELECT RAISE(ABORT,'immutable_bundle'); END;
