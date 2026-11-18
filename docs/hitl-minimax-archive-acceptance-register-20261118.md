# HITL-Minimax — archive acceptance register

Date: 2026-11-18. Scope: isolated Preview. Status: **HOLD**.

## Technical readiness

- Offline digest and WebAuthn replay: PASS in CI 44288113705.
- Archive encryption/recovery synthetic checks: PASS in CI 44288731051.
- Conditional encrypt → decrypt → offline replay gate: implemented; CI 44289081649 PASS on the configured branch, but the conditional path requires the long-term secret and has **not** been demonstrated with it.
- SHA-256 anchor: `756a82522ae9f4442eb4e9582e408c2fa32aa762c75f3cd51af47dcadbbd155e`.

## Independent acceptance evidence (currently absent)

| Condition | State | Evidence required |
| --- | --- | --- |
| Encrypted artifact exists | UNESTABLISHED | Real GitHub artifact inventory showing one non-expired encrypted Preview proof |
| Separate recovery key custody | UNESTABLISHED | Custodian confirmation outside the CI trust domain |
| Independent recovery test | UNESTABLISHED | Recorded offline decrypt, SHA-256 and WebAuthn verification outside CI |
| Durable independent storage | UNESTABLISHED | Retention location, immutable/versioned copy, recovery procedure and responsible custodian |

`tests/hitl-minimax-archive-acceptance.mjs` is a **local consistency gate only**. Its environment flags are operator-provided assertions and are **not authenticated attestations**. The CI workflow intentionally passes an empty artifact inventory, thereby reporting HOLD without claiming independent custody or storage. A green CI run must not be interpreted as archive acceptance. Do not set these flags to true without inspecting external evidence. This is not a production acceptance mechanism.

No production D1 or Worker modifications. H3/H4/H5 remain HOLD. Independent D1 record/source provenance remains UNESTABLISHED.
