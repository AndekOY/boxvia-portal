# HITL-MINIMAX — FULL NORMATIVE ACCEPTANCE DECISION v1.0

**Assessment date:** 2026-11-18  
**Scope:** BoxVia HITL-Minimax isolated Preview, synthetic H3 Passkey decision, portable encrypted evidence archive  
**Decision:** **FULL NORMATIVE ACCEPTANCE — HOLD**  
**Bounded technical Preview acceptance:** **PASS**  
**Disposition:** **ASSESSMENT CLOSED; REMEDIATION DEFERRED; NO PRODUCTION AUTHORIZATION**

## 1. Decision authority and meaning
This document is a documented evidence-based assessment outcome, not a third-party certification, independent attestation or authorization to operate real gates. It closes the present normative **assessment**, not the unmet normative acceptance criteria. No evidence permits converting HOLD to PASS.

## 2. Positive findings

| Control | Outcome | Basis |
| --- | --- | --- |
| Synthetic owner Passkey H3 APPROVE | PASS within Preview | Proof `51cd4000-9a23-4aac-8d74-7d45a97f8188`, `legacyGateAuthorized=false` |
| Offline WebAuthn ES256 signature replay | PASS | Anchored package and independent local verifier |
| Encrypted portable archive | PASS | AES-256-GCM, GitHub Actions [run 44318117973](https://github.com/AndekOY/boxvia-portal/actions/runs/44318117973) |
| Operator-executed recovery outside CI | PASS | Local authenticated decryption, anchored digest and WebAuthn replay, 2026-11-18 |
| Encrypted Google Drive copy integrity | PASS | Re-downloaded copy SHA-256 matches original: `61D496F7220742CB42C15C1F531010D73859E5C8C910BC33FE4DFA46B1DA2F16` |
| Evidence package SHA-256 | PASS | `756a82522ae9f4442eb4e9582e408c2fa32aa762c75f3cd51af47dcadbbd155e` |

## 3. Blocking findings

| Requirement | Finding | Missing evidence |
| --- | --- | --- |
| Independent origin and chain of custody of Preview D1 source records | **UNESTABLISHED** | External authority/receipt for source identity, capture time and exact bytes |
| Independent enrollment / trusted timing | **UNESTABLISHED** | Verifiable external attestation/trust anchor |
| Enforced durable immutable evidence retention | **HOLD** | WORM-equivalent enforcement, independent retention/access audit or accepted alternative |
| Emergency key recovery / loss-of-access contingency | **RETEST** | Tested recovery independent of the active owner's current vault session |
| Real H3/H4/H5 gate authorization | **HOLD** | Separate production-specific evidence, review and explicit authorization |

A self-reported custody flag, GitHub Actions success, Drive upload, synthetic APPROVE or matching hash does **not** resolve these gaps.

## 4. Normative disposition and stop rule

1. **ACCEPT** isolated Preview technical demonstrator only, within the scope of [Preview Acceptance Report](hitl-minimax-preview-acceptance-report-v1-20261118.md).
2. **DO NOT ACCEPT** full normative governance conformity. Retain **HOLD**.
3. **DO NOT** authorize real H3/H4/H5, modify Production D1 or Worker, or merge to `main` on this basis.
4. **STOP** further implementation under the current work order. Reopen only upon new independently verifiable evidence, a material risk change, or explicit owner instruction.
5. Apply manual retention checks under [Retention Policy](hitl-minimax-retention-policy-v1-20261118.md): 90-day integrity check (first due 2027-02-16), 180-day restore (first due 2027-05-17), retention review by 2027-11-18. These checks are documented, **not scheduled automations**.

## 5. Minimum evidence for reconsideration
- Independent signed or otherwise authenticated source provenance receipt for precise records and time.
- Demonstrated vault-loss/emergency key recovery with nonsecret evidence log.
- Independently verifiable retention enforcement or a formally approved alternative with documented residual risk.
- Separate, explicitly authorized production-specific acceptance case for any real gate.

**No deadline is imposed for reopening.** This HOLD is a defensible final decision for the present assessment, not a promise of eventual PASS.

## 6. Evidence references
- [Technical Preview Acceptance Report](hitl-minimax-preview-acceptance-report-v1-20261118.md)
- [Provenance Assessment](hitl-minimax-provenance-assessment-20261118.md)
- [Archive Acceptance Register](hitl-minimax-archive-acceptance-register-20261118.md)
- [Retention Policy](hitl-minimax-retention-policy-v1-20261118.md)

**Status:** NORMATIVE REVIEW COMPLETED / FULL ACCEPTANCE HOLD / WORKSTREAM PAUSED.
