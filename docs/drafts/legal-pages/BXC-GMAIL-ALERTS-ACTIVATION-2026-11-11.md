# BoxVia Gmail alerts — minimal activation checklist (2026-11-11)

Status: IMPLEMENTED IN DRAFT BRANCH ONLY. NOT DEPLOYED. NO REAL NOTIFICATIONS SENT.

## Architecture
- Existing Worker and D1 only; no new Worker, database, paid Cloudflare plan or Resend.
- New read-only `GET /api/owner-notifications` returns request IDs and service codes, never customer email, claim text, source, access token, payment details or report.
- Endpoint is disabled unless `OWNER_NOTIFICATIONS_ENABLED=true`; authenticated with a high-entropy secret `OWNER_NOTIFICATION_TOKEN` (Cloudflare Worker secret).
- Gmail Apps Script polls this endpoint on a user-created time trigger and sends one summary email to the owner's Gmail via `MailApp`.
- The same secret must be placed in Apps Script **Script Properties**, not source code or shared screenshots.
- Duplicate alerts may occur if mail is sent but cursor persistence fails. D1 remains authoritative; alerts are not guaranteed delivery.

## Activation steps (not yet performed)
1. Review and merge draft branch only after separate release approval. Ensure `wrangler.jsonc` preserves account variables (`keep_vars: true`).
2. In Cloudflare Production Worker Settings, create secret `OWNER_NOTIFICATION_TOKEN` (random 32+ bytes, never publish) and variable `OWNER_NOTIFICATIONS_ENABLED=false` initially. Do not change `CLAIM_INTAKE_ENABLED` or `PAYPAL_CHECKOUT_ENABLED` as part of this change.
3. Create standalone project at https://script.google.com/ under the Gmail account receiving notifications. Paste `integrations/google-apps-script/boxvia-owner-notifications.gs`.
4. In Apps Script > Project Settings > Script properties add `BOXVIA_API_URL=https://boxvia.andeks.workers.dev`, `BOXVIA_API_TOKEN` (same secret), `OWNER_EMAIL` (verified owner address). Set `CLAIMS_AFTER=0` and `SERVICES_AFTER=0` only when test tables are confirmed empty. Never paste secrets into chat.
5. Set `OWNER_NOTIFICATIONS_ENABLED=true` only for a controlled synthetic test, verify 401 without token and successful read with token, create synthetic claim and service requests using existing validated intake, run `pollBoxViaRequests` manually, verify a single email and updated cursors. Do not make a real PayPal payment.
6. Remove synthetic records safely (respect foreign keys), reset cursors to 0 only if all relevant tables are empty, then create time-driven trigger for `pollBoxViaRequests` (e.g., every 5–15 minutes, within Apps Script quotas). Test again and monitor failures.
7. After launch, monitor Apps Script execution errors and D1 daily until reliable. A 24h fulfillment commitment requires owner acknowledgement; a Gmail alert alone is not confirmation of a paid order.

## Security and limitations
- Apps Script project and Script Properties must be private to the owner; enable 2FA on Google and Cloudflare accounts.
- Polling endpoint has no personal data, but request metadata still reveals volume and service category. Keep token secret; rotate if compromised.
- This implementation is **notification only**. It does not email customers, confirm payments, satisfy EU consumer-law durable confirmation, or activate a service contract.
- Existing code routes and D1 writes are unchanged apart from the new disabled GET route.
- Apps Script free quotas and Google permissions must be checked in the owner's account. Do not promise permanent free or guaranteed delivery.
