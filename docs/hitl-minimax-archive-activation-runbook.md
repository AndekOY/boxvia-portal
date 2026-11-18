# HITL-Minimax — encrypted evidence archive activation runbook

Status: **PREPARED / NOT ACTIVATED**. Scope: isolated Preview only. No Production changes or legacy H3/H4/H5 authorization.

## Preconditions

1. An authorized custodian establishes a recovery and access policy outside GitHub Actions. Keep the encryption key in a separately controlled, recoverable secret store. Document custody, access control, rotation, and recovery verification. Do not paste the key in issues, commits, chat, CI logs, or public documentation.
2. Generate a cryptographically random 32-byte key using an approved local secure environment. Encode it as unpadded base64url (43 characters). Never use a password or a key generated ephemerally by CI for an archive expected to be recoverable.
3. Configure the repository Actions secret `HITL_ARCHIVE_AES256_KEY_B64URL` using GitHub's secret management UI or a suitably authorized secret-management integration. Do not commit the key or expose it in tool output.
4. Re-run only the isolated Preview workflow `hitl-passkey-one-pass-preview.yml` on branch `draft/hitl-site-alignment-20261115`. Confirm the private package SHA-256 matches the anchored digest `756a82522ae9f4442eb4e9582e408c2fa32aa762c75f3cd51af47dcadbbd155e`, that offline WebAuthn replay passes, and that the encrypted artifact is uploaded.
5. Retrieve the encrypted artifact into a controlled environment and test decryption with the independently retained key. Recompute plaintext SHA-256 and run `node tests/hitl-minimax-verify-portable.mjs <private-package.json> 756a82522ae9f4442eb4e9582e408c2fa32aa762c75f3cd51af47dcadbbd155e`. Protect and securely delete temporary plaintext copies.
6. Move the encrypted artifact to an independently governed retention system with versioning/immutability controls, restore tests, and retention policy. GitHub Actions artifacts are configured for **30 days only** and do not constitute permanent evidence storage.

## Current technical boundary

- AES-256-GCM with a 96-bit random IV, authenticated additional data `BOXVIA-HITL-MINIMAX-EVIDENCE-v1`, and a 128-bit authentication tag.
- CI performs an encryption/decryption self-test and a negative test with a wrong key on synthetic data.
- Missing archive key causes the upload step to be skipped; no plaintext archive is uploaded.
- The exported private package includes sensitive authentication material and must not be committed or uploaded unencrypted.
- GitHub commit/hash is an observable commitment, **not** a trusted timestamp, independent enrollment proof, independent source provenance, or approval of real gates.

## Acceptance conditions

**ARCHIVE PASS** only after an encrypted artifact exists, a separate custodian has demonstrated recovery and offline replay, and an independent durable retention location is confirmed. Otherwise **ARCHIVE HOLD**. **PROVENANCE UNESTABLISHED** and **H3/H4/H5 HOLD** remain separate and unaffected.
