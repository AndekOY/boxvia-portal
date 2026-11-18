# HITL-Minimax — Preview evidence retention policy v1.0

Date: 2026-11-18. Scope: isolated Preview only. **Policy adopted for this Preview workstream; operational controls not yet independently attested.**

## Custody and storage
- Custodian: BoxVia owner (individual account holder); no delegated custodian has been evidenced.
- Key: Bitwarden Free personal vault; AES-256 key value must never enter this document, GitHub commits, chat, logs or Drive. GitHub Actions secret is a separate execution copy, not a recovery substitute.
- Archive: encrypted `hitl-minimax-encrypted-artifact.json` in owner-controlled Google Drive [folder](https://drive.google.com/drive/folders/19lTb18Rht32lM5rkrJfDMAs7tbRxQhh_). Do not upload plaintext, decrypted outputs, key exports or vault recovery material.
- File SHA-256 baseline: `61D496F7220742CB42C15C1F531010D73859E5C8C910BC33FE4DFA46B1DA2F16`; anchored plaintext package SHA-256: `756a82522ae9f4442eb4e9582e408c2fa32aa762c75f3cd51af47dcadbbd155e`.
- Retain encrypted archive for **at least 12 months from 2026-11-18 (review by 2027-11-18)**, subject to applicable law, privacy and evidence minimization. This is a working retention rule, not a guarantee of immutable storage or a legal retention opinion. At review, extend or securely dispose according to recorded decision.
- Google Drive is not WORM. Protect against accidental deletion, account loss and unauthorized sharing; inspect sharing/access settings each check.

## Scheduled manual checks (not yet automated)
- Every **90 days** from 2026-11-18: download a fresh Drive copy, compute SHA-256 locally, compare with the baseline, verify file visibility/access and log date, result and operator. First due **2027-02-16**.
- Every **180 days** from 2026-11-18: restore the archive locally using the separately held Bitwarden key, verify authenticated decrypt, anchored plaintext digest and offline WebAuthn replay; delete temporary plaintext. First due **2027-05-17**.
- Before changing the key, vault, device or storage provider: test recovery, document migration and preserve access to existing archive.
- No recurring automation is claimed by this document. Missing, failed or overdue checks are **RETEST/HOLD**, never silently PASS.

## Recovery contingency
- Confirm vault two-step login, access to recovery codes and vault master-password recovery plan **without recording secrets in GitHub or Drive**.
- An independently usable emergency recovery method is **not yet evidenced**; account loss remains a residual risk.
- If either vault or Drive access is lost, freeze acceptance, preserve available ciphertext and request controlled recovery. Do not rotate or overwrite the sole recoverable key.
- Evidence handling: record only non-sensitive hashes, file IDs, operator, dates, outcomes, and links to protected records; no authentication payloads.

## Boundaries
Local restore and Drive copy integrity were observed on 2026-11-18. No independently audited third-party restore, immutable retention, independent D1/source custody or real H3/H4/H5 authorization was established. Production and `main` are out of scope.
