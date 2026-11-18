# HITL-Minimax Preview — evidence digest anchor (2026-11-18)

Status: **DIGEST RECORDED / SOURCE PROVENANCE UNESTABLISHED / LEGACY GATES HOLD**.

## Exact commitment

- Evidence format: `BOXVIA-HITL-MINIMAX-EVIDENCE-v1`.
- SHA-256 (UTF-8 JSON package): `756a82522ae9f4442eb4e9582e408c2fa32aa762c75f3cd51af47dcadbbd155e`.
- CI source: [successful isolated Preview run 44114551369](https://github.com/AndekOY/boxvia-portal/actions/runs/44114551369).
- CI source commit: `cea47e9edc797d2d4b9fd020b46d54ecccc82930`.
- Synthetic proof ID: `51cd4000-9a23-4aac-8d74-7d45a97f8188`.
- Dataset: one row each from Preview D1 `hitl_minimax_proofs`, `hitl_minimax_proof_bundles`, `hitl_minimax_challenges`, `hitl_minimax_snapshots`.
- Serialization: `JSON.stringify({format:'BOXVIA-HITL-MINIMAX-EVIDENCE-v1',proof,bundle,challengeRecord,snapshotRow})` where each row is the exact JSON object returned by Wrangler D1 `SELECT *`; UTF-8 bytes are hashed with SHA-256. Column order and JSON serialization are therefore part of this version's byte-level commitment.

## Verification boundary

The commit containing this digest provides an externally observable GitHub repository reference to the claimed package hash. It does **not** provide a qualified timestamp, independent origin authentication, proof that the D1 records existed at an earlier time, or a permanent copy of the private package. Reproduction requires the exact four private rows and the same serialization. GitHub history and workflow logs can be modified or deleted by authorized administrators; this is not a tamper-proof public transparency log.

The 2026-11-17 synthetic owner APPROVE WebAuthn signature was independently replay-verified against Preview D1 data. This establishes cryptographic consistency relative to those data, not independent enrollment provenance or source artifact provenance. Production D1 and Production Worker were not targeted. No real H3/H4/H5 approval was authorized. **HOLD** remains in force.

## Retention / recovery gap

The archive key `HITL_ARCHIVE_AES256_KEY_B64URL` was absent in run 44114551369. CI printed `HOLD durable archive` and the run returned no uploaded artifacts. The private package was deleted after hashing. A future encrypted artifact requires an independently stored recovery key and a retention policy; do not confuse a 30-day Actions artifact with long-term archival or an independent evidence authority.
