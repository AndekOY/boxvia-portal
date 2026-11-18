# HITL-MINIMAX PREVIEW ACCEPTANCE REPORT v1.0

**Date:** 2026-11-18  
**Object:** BoxVia HITL-Minimax, isolated Preview evidence archive and synthetic H3 Passkey flow  
**Branch:** `draft/hitl-site-alignment-20261115`  
**Disposition:** **TECHNICAL PREVIEW ACCEPTANCE — PASS (bounded); FULL GOVERNANCE ACCEPTANCE — HOLD.**  
**Production:** no changes authorized or made by this report.

## Scope and acceptance basis
This report assesses the demonstrated synthetic Preview approval path, authenticated archive encryption, portable offline verification, owner-executed restore and externally stored encrypted copy. It does not assess actual enterprise approval authority, independent source custody, production operations or real H3/H4/H5.

## Verified outcomes

| Requirement | Result | Evidence and qualification |
| --- | --- | --- |
| Synthetic owner Passkey decision | PASS | Preview H3 APPROVE proof `51cd4000-9a23-4aac-8d74-7d45a97f8188`, `legacyGateAuthorized=false` |
| Offline ES256 WebAuthn replay | PASS | Anchored portable package and mutation-negative checks; replay also passed outside CI |
| AES-256-GCM encrypted artifact | PASS | GitHub Actions run [44318117973](https://github.com/AndekOY/boxvia-portal/actions/runs/44318117973) |
| Owner-local authenticated archive restore | PASS | Windows/Node.js PowerShell screenshot on 2026-11-18; independently executed from CI, not third-party audited |
| Plaintext package SHA-256 anchor | PASS | `756a82522ae9f4442eb4e9582e408c2fa32aa762c75f3cd51af47dcadbbd155e` |
| External encrypted copy byte integrity | PASS | Re-downloaded Drive copy SHA-256 matched local ciphertext: `61D496F7220742CB42C15C1F531010D73859E5C8C910BC33FE4DFA46B1DA2F16` |
| Long-term immutable retention | HOLD | Owner-controlled Google Drive exists; no WORM, retention enforcement or third-party audit |
| Independent source provenance | UNESTABLISHED | No independent D1/source chain-of-custody receipt |
| Vault loss / emergency recovery | RETEST | Bitwarden custody established by operator report; independent contingency not tested |
| Real H3/H4/H5 | HOLD | Synthetic APPROVE cannot authorize legacy gates |

## Decision
**Accept the isolated Preview technical demonstrator within the listed boundary.** Do not infer full archival governance, independent provenance, regulatory compliance or Production authorization. Continue to hold real H3/H4/H5. No deployment to Production or `main`.

## Follow-up and owner controls
1. Apply [retention policy](hitl-minimax-retention-policy-v1-20261118.md): 90-day ciphertext SHA-256 check, 180-day authenticated restore, 12-month review. These are **manual obligations**, not already completed future tests.
2. Maintain [provenance assessment](hitl-minimax-provenance-assessment-20261118.md) with `UNESTABLISHED` until independent primary evidence exists.
3. Maintain [archive acceptance register](hitl-minimax-archive-acceptance-register-20261118.md) and never upgrade the CI acceptance gate solely on self-asserted environment flags.
4. Review vault recovery contingency and access privileges; protect key and private evidence separately.

## References
- [Archive acceptance register](hitl-minimax-archive-acceptance-register-20261118.md)
- [Archive activation runbook](hitl-minimax-archive-activation-runbook.md)
- [Retention policy](hitl-minimax-retention-policy-v1-20261118.md)
- [Provenance assessment](hitl-minimax-provenance-assessment-20261118.md)

**Status vocabulary:** PASS = evidenced within stated boundary; RETEST = further controlled verification required; HOLD = no authorization/acceptance; UNESTABLISHED = evidence insufficient for the stated claim.
