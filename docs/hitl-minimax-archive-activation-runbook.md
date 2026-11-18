# HITL-Minimax — encrypted evidence archive activation runbook

Status: **ACTIVATED FOR ISOLATED PREVIEW / TECHNICAL RESTORE PASS / GOVERNANCE HOLD**. Scope: isolated Preview only. No Production changes or legacy H3/H4/H5 authorization.

## Preconditions

1. An authorized custodian establishes a recovery and access policy outside GitHub Actions. Keep the encryption key in a separately controlled, recoverable secret store. Document custody, access control, rotation, and recovery verification. Do not paste the key in issues, commits, chat, CI logs, or public documentation.
2. Generate a cryptographically random 32-byte key using an approved local secure environment. Encode it as unpadded base64url (43 characters). Never use a password or a key generated ephemerally by CI for an archive expected to be recoverable.
3. Configure the repository Actions secret `HITL_ARCHIVE_AES256_KEY_B64URL` using GitHub's secret management UI or a suitably authorized secret-management integration. Do not commit the key or expose it in tool output.
4. Re-run only the isolated Preview workflow `hitl-passkey-one-pass-preview.yml` on branch `draft/hitl-site-alignment-20261115`. Confirm the private package SHA-256 matches the anchored digest `756a82522ae9f4442eb4e9582e408c2fa32aa762c75f3cd51af47dcadbbd155e`, that offline WebAuthn replay passes, and that the encrypted artifact is uploaded.
5. Retrieve the encrypted artifact into a controlled environment and test decryption with the independently retained key. Recompute plaintext SHA-256 and run `node tests/hitl-minimax-verify-portable.mjs <private-package.json> 756a82522ae9f4442eb4e9582e408c2fa32aa762c75f3cd51af47dcadbbd155e`. Protect and securely delete temporary plaintext copies.
6. Move the encrypted artifact to an independently governed retention system with versioning/immutability controls, restore tests, and retention policy. GitHub Actions artifacts are configured for **30 days only** and do not constitute permanent evidence storage.

## Activation evidence (2026-11-18)

- Isolated Preview CI run [44318117973](https://github.com/AndekOY/boxvia-portal/actions/runs/44318117973) produced an encrypted archive.
- Operator independently restored the archive locally and verified anchored SHA-256 and offline WebAuthn replay (PowerShell screenshot).
- Owner uploaded the encrypted artifact to Google Drive and re-downloaded it; original and Drive copy both SHA-256 `61D496F7220742CB42C15C1F531010D73859E5C8C910BC33FE4DFA46B1DA2F16`.
- This proves observed technical integrity, **not** immutable retention, independent source provenance, or third-party audited custody.
- See [retention policy](hitl-minimax-retention-policy-v1-20261118.md), [provenance assessment](hitl-minimax-provenance-assessment-20261118.md), and [Preview acceptance report](hitl-minimax-preview-acceptance-report-v1-20261118.md).

## Current technical boundary

- AES-256-GCM with a 96-bit random IV, authenticated additional data `BOXVIA-HITL-MINIMAX-EVIDENCE-v1`, and a 128-bit authentication tag.
- CI performs an encryption/decryption self-test and a negative test with a wrong key on synthetic data.
- Missing archive key causes the upload step to be skipped; no plaintext archive is uploaded.
- The exported private package includes sensitive authentication material and must not be committed or uploaded unencrypted.
- GitHub commit/hash is an observable commitment, **not** a trusted timestamp, independent enrollment proof, independent source provenance, or approval of real gates.

## Acceptance conditions

**Technical archive restore PASS** is established by the owner-executed offline recovery and matching external copy hash. **Full archive governance HOLD** remains until recovery contingency, retention enforcement and independent controls are evidenced; the owner is not a separate third-party custodian. **PROVENANCE UNESTABLISHED** and **H3/H4/H5 HOLD** remain separate and unaffected.
