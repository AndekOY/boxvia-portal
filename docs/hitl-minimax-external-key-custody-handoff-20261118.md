# HITL-Minimax external secret custody — operator handoff

**2026-11-18 | APPROVED ARCHITECTURE / PROVIDER NOT YET SELECTED / ARCHIVE HOLD**

The owner approved an external secret manager. No provider account, vault, key, or GitHub Actions secret has been created or verified by this document. The repository provides an **optional 1Password CLI integration**, not a claim that 1Password was chosen or connected.

## Security boundary

- Key: one cryptographically random 32-byte AES-256 key, unpadded base64url, 43 characters. Generated **inside a trusted operator environment**, not inside CI or chat.
- Custody: external vault with owner access, separate recovery method, protected audit trail, and explicit recovery verification. GitHub Actions secret is an execution copy, **not the primary custody location**.
- Never paste the key into chat, repository, logs, issues, command arguments, or unencrypted artifacts.
- Avoid generating a key until the vault and recovery mechanism are configured. Rotation must preserve older keys while historical encrypted archives remain under retention.
- The key permits decryption of the private WebAuthn proof package. Treat it as sensitive.

## Optional 1Password bridge (only if the operator selects this provider)

1. Configure an external 1Password account and vault, including a verified recovery mechanism.
2. Generate a 32-byte random key in the operator's trusted local environment and save it in a dedicated vault item field. Record the item reference, not its value.
3. Install and authenticate the 1Password CLI (`op`) and GitHub CLI (`gh`) locally. Ensure GitHub access is authorized for `AndekOY/boxvia-portal`.
4. Set `HITL_1PASSWORD_SECRET_REFERENCE` to the `op://...` field reference and run `bash scripts/hitl-minimax-configure-1password-secret.sh` locally from the repository. The bridge validates length and streams the key to GitHub Actions without printing it. **Do not execute it in a CI job.**
5. Verify the **name** `HITL_ARCHIVE_AES256_KEY_B64URL` appears in GitHub repository Actions secrets (never reveal the value).
6. Re-run the isolated Preview workflow on `draft/hitl-site-alignment-20261115`; confirm artifact upload and successful recovery verification.
7. Independently download the encrypted artifact, restore it using the separately controlled vault key, and run the offline SHA-256 + WebAuthn verifier. Archive an encrypted copy in independently governed long-term storage. Record custodian, retention policy, recovery evidence, and audit record **without** storing the key in GitHub.

## Non-acceptance conditions

The CI run is green without a key, or the encrypted artifact is only in GitHub's 30-day Actions retention, or the operator asserts custody without demonstrating recovery: **ARCHIVE HOLD**.

Independent record/source provenance: **UNESTABLISHED**. Real H3/H4/H5: **HOLD**. Production: **NOT TOUCHED**.
