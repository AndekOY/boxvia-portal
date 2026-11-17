# HITL-Minimax v1.0 — Preview acceptance boundary (2026-11-17)

## Observed

- Isolated Preview D1 synthetic decision: `MINIMAX-SYNTH-DECISION-001`, version 1, gate H3.
- Owner WebAuthn activation completed via authenticated Preview UI.
- Owner APPROVE returned `verified:true` and proof ID `51cd4000-9a23-4aac-8d74-7d45a97f8188`.
- CI run 44108354932 successfully replayed the WebAuthn signature using D1 proof, proof bundle, consumed challenge and snapshot. Signature-tampering negative check passed.
- Subsequent regression extends negative checks to decision action, snapshot payload hash and challenge hash; separate CI confirmation required.

## Trust boundary

WebAuthn signs `authenticatorData || SHA256(clientDataJSON)`, which includes a server challenge. It **does not directly sign** the canonical decision. The linkage from the challenge to the decision digest is established by server-side D1 records. The replay validates their internal consistency but **does not independently authenticate their origin or history**.

The synthetic snapshot uses placeholder hashes (`aa…`, `bb…`) and does not establish source evidence provenance. The public key in the proof bundle comes from D1 and is not independently anchored to a registration certificate or external identity authority. Thus the replay demonstrates cryptographic and internal-record consistency, **not** end-to-end independent evidentiary provenance.

## Status

- Isolated Preview WebAuthn signing and replay: **PASS** (subject to extended regression).
- Immutable D1 triggers and one-time challenge controls: implemented and tested within Preview workflow; independent external audit not claimed.
- Independent record provenance: **UNESTABLISHED**.
- Legacy H3/H4/H5 PASS: **HOLD**.
- Production and main: **NOT MODIFIED**.

## Next acceptance condition

Anchor the exact immutable proof package to a trusted external digest/attestation, preserve credential enrollment provenance, and bind real source artifact bytes to snapshot hashes before any production or governance claim. Keep raw proof material owner-only and never place it in CI logs or public artifacts.
