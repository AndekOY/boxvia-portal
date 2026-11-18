# HITL-Minimax — Bitwarden Free custody and activation (2026-11-18)

**APPROVED PROVIDER: Bitwarden Free (personal password manager). STATUS: PREPARED / ARCHIVE HOLD.**

This is a **manual, zero-subscription workflow**. Bitwarden Free Password Manager is a vault, **not** an automated Secrets Manager or KMS. No Bitwarden account, vault entry, GitHub Actions secret, archive, or recovery verification has been created by this repository change. The optional 1Password bridge is superseded for this deployment and must not be used.

## 1. Establish custody first (operator action)

1. Sign up or sign in at https://vault.bitwarden.com/ (use the correct regional Bitwarden cloud if applicable). Enable strong account authentication and MFA. Save the Bitwarden recovery code securely outside the vault. Confirm access from a second trusted device before creating the key.
2. Create a vault item named `BoxVia / HITL-Minimax / Preview AES-256 key / v1` (Secure Note or other protected item). Limit access to the owner; do not share via messages or Send.
3. In a **trusted local environment**, generate exactly 32 cryptographically random bytes and encode as **unpadded base64url (43 characters)**. Do not use a password, website key generator, CI-generated key, ChatGPT, or GitHub logs. Save the value **directly in the Bitwarden item**. Clear clipboard/history after saving. Avoid storing plaintext key files.
4. Prepare a separate, encrypted recovery backup with a recovery method not solely dependent on the Bitwarden account. Test that the item can be recovered without exposing the key in logs or screenshots. Document custodian and recovery procedure, not the key value.

## 2. Configure GitHub Actions manually (operator action)

1. Open https://github.com/AndekOY/boxvia-portal/settings/secrets/actions and authenticate with appropriate repository permissions.
2. Choose **New repository secret** and enter exactly `HITL_ARCHIVE_AES256_KEY_B64URL` as the secret name.
3. Retrieve the value from Bitwarden on the trusted device and paste it into the secret value field. Avoid terminal commands, browser extensions on untrusted devices, clipboard synchronization, and screenshots. Save and confirm **only the secret name** appears in the list. GitHub does not allow reading the secret value back.
4. Do not configure `HITL_EXTERNAL_KEY_CUSTODY_CONFIRMED`, `HITL_INDEPENDENT_RESTORE_CONFIRMED`, or `HITL_INDEPENDENT_DURABLE_COPY_CONFIRMED` as true merely because the key was saved. These are acceptance assertions, not evidence.

## 3. Activate isolated Preview only

1. Run workflow `hitl-passkey-one-pass-preview.yml` on branch `draft/hitl-site-alignment-20261115` (or push an authorized Preview-only change).
2. Verify that CI shows **PASS** for encrypt, decrypt, anchored SHA-256, and offline WebAuthn replay; check artifact inventory for `hitl-minimax-encrypted-proof-preview` (nonzero size, not expired).
3. Download the encrypted artifact into a trusted environment, independently recover it with the Bitwarden-held key using `tests/hitl-minimax-recover-archive.mjs`, and run `tests/hitl-minimax-verify-portable.mjs` with anchored digest `756a82522ae9f4442eb4e9582e408c2fa32aa762c75f3cd51af47dcadbbd155e`. Remove temporary plaintext files securely. Avoid saving plaintext into synced or backed-up directories.
4. Keep an independently governed, access-controlled, encrypted durable copy beyond the **30-day GitHub Actions artifact retention**. Record evidence of independent restoration, retention, and recovery responsibility. Only then review archive acceptance.

## Cost and scope

- Bitwarden Free personal vault: no required subscription for this manual path. GitHub Actions free usage and artifact quotas are subject to account/repository limits; **zero total operating cost is not guaranteed**.
- This design intentionally avoids paid Bitwarden Secrets Manager, paid automation, or KMS.
- External custody does **not** establish independent provenance of the underlying D1 records. **PROVENANCE UNESTABLISHED**.
- No Production D1/Worker/main modifications; real H3/H4/H5 remain **HOLD**.
