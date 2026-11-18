# HITL-Minimax — archive acceptance register

Date: 2026-11-18. Scope: isolated Preview. **Technical archive recovery and external copy integrity: PASS. Full archive governance acceptance: HOLD.**

## Confirmed technical evidence

- Anchored plaintext evidence package SHA-256: `756a82522ae9f4442eb4e9582e408c2fa32aa762c75f3cd51af47dcadbbd155e`.
- GitHub Actions isolated Preview run [44318117973](https://github.com/AndekOY/boxvia-portal/actions/runs/44318117973): SUCCESS; encrypted artifact `hitl-minimax-encrypted-proof-preview` present (3,448 bytes reported by GitHub).
- Bitwarden Free selected as the external **primary key custody** system; operator reported saving the key and configuring `HITL_ARCHIVE_AES256_KEY_B64URL` in GitHub Actions. Key value not retained in this register.
- Independent local Windows/Node.js recovery: operator PowerShell screenshot (2026-11-18) displayed `PASS authenticated archive recovery and anchored SHA-256` and `PASS offline digest and WebAuthn replay`. This establishes an **operator-executed restore outside CI**, not an independently audited third-party attestation.
- Encrypted artifact uploaded by operator to Google Drive folder [BoxVia / HITL-Minimax / Encrypted Evidence Archive](https://drive.google.com/drive/folders/19lTb18Rht32lM5rkrJfDMAs7tbRxQhh_). Google Drive screenshot showed file `hitl-minimax-encrypted-artifact.json`, owner-only, approximately 4 KB, created 2026-11-18. Connector folder search did not independently enumerate the file; the screenshot supports the upload claim.
- **External copy integrity: PASS (operator-local SHA-256 comparison).** PowerShell screenshot showed both the original at `C:\BoxVia-HITL-Recovery\hitl-minimax-encrypted-artifact.json` and the re-downloaded Drive copy at `$HOME\Downloads\hitl-minimax-encrypted-artifact.json` have SHA-256:
  `61D496F7220742CB42C15C1F531010D73859E5C8C910BC33FE4DFA46B1DA2F16`.
  This supports byte identity **at the time of the operator's test**. It does not prove immutability, long-term retention, or independent provenance.

## Remaining acceptance boundaries

| Control | State | Qualification |
| --- | --- | --- |
| Preview encrypted artifact | PASS | GitHub Actions inventory |
| Bitwarden key custody setup | OPERATOR-REPORTED | Recovery contingency and independent access test not separately evidenced |
| Offline archive recovery + WebAuthn | PASS | Operator-executed, screenshot-observed; no third-party attestation |
| External Google Drive copy integrity | PASS | Matching SHA-256 of original and re-downloaded copy |
| Durable retention / immutability / access audit | HOLD | Google Drive personal storage alone is not WORM or guaranteed immutable retention |
| Source/D1 record provenance | UNESTABLISHED | Signature replay does not prove independent source custody |
| Real H3/H4/H5 authorization | HOLD | Synthetic Preview APPROVE cannot authorize production gates |
| Production change | NONE | Isolated Preview only |

`tests/hitl-minimax-archive-acceptance.mjs` remains a **local consistency gate**, not an independent attestation. Operator-provided flags are not independently authenticated. Do not set all acceptance flags to true merely because the encrypted Drive copy matched.

## Next controlled milestone

Document a recovery custodian and an access-controlled retention policy with periodic restore checks. If formal immutable retention is required, obtain an independent storage control before upgrading full governance acceptance. Keep real gates HOLD. Do not modify Production D1, Production Worker, or `main`.
