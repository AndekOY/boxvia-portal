# BXC-MAIL-002 — Gmail API option for sandbox contract confirmations
Status: DRAFT IMPLEMENTED / NOT AUTHORIZED / NOT DEPLOYED / NO EMAIL SENT
Date: 2026-11-10
Owner-selected sender: andrzej.ekhmenin@gmail.com

## Purpose
Use the actual Gmail account as From for BXC contract confirmation, without buying or verifying a custom domain. This is an alternative to Resend, which cannot generally send as an arbitrary gmail.com address.

## Implemented
- cloudflare/bxc-gmail-confirmation-adapter-draft.js prepares MIME multipart/mixed with a confirmation body and four full English text attachments (Terms, Schedule, Withdrawal, Privacy).
- Uses Gmail API users.messages.send with a Google OAuth bearer access token.
- Fail-closed conditions: BXC sandbox only, provider=gmail, email-enabled flag, exact owner sender, exact allowlisted test recipient, complete attachment set and accepted snapshot hash.
- No silent retries; Gmail message ID is evidence of API acceptance, not inbox delivery.
- Compatible with the existing prepareDurableConfirmationDraft / dispatchDurableConfirmationDraft boundary as a supplied sendReviewedEmail function.
- Not imported into a Worker entrypoint; no endpoint or deployment.

## Owner steps required before a sandbox send
1. In Google Cloud Console, select or create a Google Cloud project under the owner's control.
2. Enable Gmail API and configure the OAuth consent screen, audience/test-user restrictions and a supported OAuth client.
3. Explicitly authorize the account and request only https://www.googleapis.com/auth/gmail.send; review Google's current OAuth app verification and sensitive-scope requirements before production.
4. Arrange secure server-side token acquisition and refresh. Never commit access/refresh tokens, OAuth client secrets or email contents to GitHub.
5. In sandbox-only environment, set BXC_GMAIL_FROM=andrzej.ekhmenin@gmail.com, BXC_CONFIRMATION_PROVIDER=gmail, BXC_CONFIRMATION_TEST_RECIPIENT=<owner-controlled inbox>, BXC_CONFIRMATION_EMAIL_ENABLED=true only after explicit test authorization; BXC_SANDBOX_ONLY=true and PAYPAL_ENV=sandbox.
6. Verify sender account access and send a single synthetic confirmation to the allowlisted test inbox. Preserve message ID, timestamp, accepted document hashes and delivery evidence.
7. Check applicable Google account quotas, account policy, Google OAuth app requirements and GDPR disclosures before processing actual client data.

## Open gates
- OAuth consent, credentials and token refresh are not configured.
- No durable delivery receipt ledger or mailbox delivery confirmation is implemented.
- No integration into BXC sandbox Worker and no end-to-end test.
- Final approved legal bytes/catalog and release gates remain HOLD.
- Gmail personal account usage, terms, data processing and suitability for business contract notifications require review; this implementation does not establish GDPR compliance.

## Security note
Do not use a Gmail password or app password in this module. The Gmail API requires OAuth authorization. Do not use the Google account's existing Outlook session as authorization for the Worker.
