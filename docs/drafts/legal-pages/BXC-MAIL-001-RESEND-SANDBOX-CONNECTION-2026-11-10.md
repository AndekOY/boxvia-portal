# BXC-MAIL-001 — Resend confirmation channel (sandbox)
Date: 2026-11-10
Status: ADAPTER IMPLEMENTED / NOT CONNECTED / NO EMAIL SENT

## Evidence and owner decision
Owner selected Resend based on an Outlook screenshot showing a BoxVia Technical Pilot notification from onboarding@resend.dev, received 2026-11-09. This demonstrates receipt of an existing test notification; it does not verify the sender domain, the BXC account/API key, or permission to send contractual emails to arbitrary customer addresses.

## Draft implementation
- `cloudflare/contract-confirmation-dispatch-gate-draft.js`: prepares full accepted Terms, Schedule, Withdrawal and Privacy text attachments, checks hashes of accepted contractual documents, requires a real provider acceptance response.
- `cloudflare/bxc-resend-confirmation-adapter-draft.js`: sends through Resend HTTPS API using a server-side secret; restricted to BXC sandbox and an exact test recipient; idempotency key derived from order ID and snapshot hash; no email to real clients without a separate release.
- This adapter is NOT imported into the BXC sandbox Worker or production Worker. No secret was created and no email was sent.

## Minimum required sandbox settings (secrets except non-sensitive flags)
- `RESEND_API_KEY`: Resend secret, server-side only, never committed.
- `BXC_CONFIRMATION_FROM`: a sender permitted by the Resend account and verified domain, or Resend-authorized test sender only for supported test scenarios.
- `BXC_CONFIRMATION_TEST_RECIPIENT`: one owner-controlled test inbox; exact allowlist.
- `BXC_CONFIRMATION_PROVIDER=resend`
- `BXC_CONFIRMATION_EMAIL_ENABLED=true` — only after explicit sandbox-test approval.
- `BXC_SANDBOX_ONLY=true`, `PAYPAL_ENV=sandbox`.

## Release and safety boundaries
- No production integration, no PayPal activation, no automatic customer dispatch.
- Resend API message acceptance does NOT establish mailbox delivery; a delivery webhook and immutable receipt ledger are needed before claiming delivery.
- A sender such as `onboarding@resend.dev` must not be assumed suitable for live customer contracts; verify sender domain and account restrictions.
- Review data processing terms, transfer safeguards, retention, and the BXC Privacy Notice before processing real client email addresses.
- Avoid exposing contract files or PII in logs, error messages, analytics or public storage.
- The sender currently sends complete English text attachments. A final legal check must establish whether the selected durable-medium method and attachments meet applicable consumer requirements.

## Next sandbox test
1. Verify Resend account and approved sender; create a sandbox-scoped API key and a dedicated test recipient.
2. Confirm immutable document bytes and reviewed contract catalog; produce a synthetic accepted order and attachment bundle.
3. Run a single explicit sandbox dispatch; record Resend message ID, webhook delivery status, timestamp and immutable attachment hashes.
4. Run negative tests for absent key, disabled flag, wrong recipient, incomplete attachments and provider error.
5. Keep BXC release HOLD until all other legal/technical gates are closed.
