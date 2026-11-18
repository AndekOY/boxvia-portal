# HITL-Minimax — independent provenance assessment

Date: 2026-11-18. Scope: isolated Preview; assessment of **source-origin evidence**, not signature mathematics.

## Evidence considered
1. Synthetic H3 Preview Passkey APPROVE proof `51cd4000-9a23-4aac-8d74-7d45a97f8188`, decision `MINIMAX-SYNTH-DECISION-001`, version 1; `legacyGateAuthorized=false`.
2. Four exported Preview D1 records: proof, bundle, challenge and snapshot, anchored as plaintext package SHA-256 `756a82522ae9f4442eb4e9582e408c2fa32aa762c75f3cd51af47dcadbbd155e`.
3. Offline ES256 WebAuthn replay and negative mutation tests; local AES-256-GCM archive recovery and replay PASS.
4. GitHub Actions run [44318117973](https://github.com/AndekOY/boxvia-portal/actions/runs/44318117973); encrypted artifact and locally matched Google Drive copy SHA-256 `61D496F7220742CB42C15C1F531010D73859E5C8C910BC33FE4DFA46B1DA2F16`.

## Claim-by-claim disposition

| Claim | Finding | Reason |
| --- | --- | --- |
| Exported package remained byte-identical across observed archive round-trip | PASS | Operator-computed matching ciphertext SHA-256 and anchored plaintext replay |
| WebAuthn proof verifies against supplied record bundle | PASS | Offline cryptographic replay; negative mutations rejected |
| Records originated from an independently controlled authoritative system | UNESTABLISHED | Source records and snapshot exported from same isolated Preview D1/control domain; no independent ingestion receipt |
| Enrollment, device identity and timestamps independently attested | UNESTABLISHED | Local replay and GitHub commit do not establish external trust anchor or trusted time |
| Snapshot/business claims independently true | UNESTABLISHED | Signature authenticates a recorded action over data; not the truth of external facts |
| Real H3/H4/H5 gates authorized | HOLD | Synthetic test `APPROVE` explicitly does not authorize legacy gates |

## Minimal path to independent provenance (not required to close technical Preview)
- Identify the specific provenance claim and an independent authority/custodian for it.
- Capture an externally controlled receipt for the exact bytes or hash, authenticated source identity and capture time; preserve verifiable signature, audit trail and independent retrieval route.
- Reproduce verification without relying solely on Preview D1 or the same operator's assertions.
- Record counter-evidence and scope limits. Until then keep `UNESTABLISHED`, not `FAIL` or `PASS`.

**Conclusion:** Cryptographic integrity and operator-local recovery PASS. Independent source provenance **UNESTABLISHED**. No escalation to Production, no real gate approval.
