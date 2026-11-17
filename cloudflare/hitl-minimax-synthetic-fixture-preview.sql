-- Preview-only synthetic acceptance fixture. Not a real ANDEKS decision.
-- Deterministic 64-character hashes represent synthetic data only.
INSERT OR IGNORE INTO hitl_minimax_snapshots
 (case_id,decision_id,version,gate,payload_sha256,chain_head_sha256,state)
VALUES
 ('MINIMAX-SYNTH-20261117','MINIMAX-SYNTH-DECISION-001',1,'H3',
  'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb','READY');
