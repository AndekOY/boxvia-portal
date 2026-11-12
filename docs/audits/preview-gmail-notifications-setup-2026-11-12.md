# BoxVia Preview Gmail notification integration

Status: PREPARED / NOT INSTALLED / NOT E2E VERIFIED.

Source: `integrations/apps-script/boxvia-preview-notifications.gs`.
Environment: `boxvia-service-preview.andeks.workers.dev` only.
Do not paste this code into the existing Production Apps Script project. Create a separate project.

## Evidence
- The Preview Worker GET `/api/owner-notifications` accepts bearer auth and `services_after` and returns `services: [{id, code}]`.
- The Preview Worker has an `OWNER_NOTIFICATION_TOKEN` secret binding (name verified previously; its value is not in GitHub).
- Technical Pilot form -> Turnstile -> Worker -> sandbox D1 was confirmed by E2E submission and a read-only count of one record.
- Existing Production Gmail poller source and its Apps Script project identifier have not been obtained, so no changes were made to it.

## Installation (separate Google Apps Script project)
1. Create a new Apps Script project and paste the complete `.gs` file.
2. Under Project Settings -> Script Properties, set `BOXVIA_PREVIEW_OWNER_TOKEN` to the existing Preview Worker `OWNER_NOTIFICATION_TOKEN` value (not the Turnstile secret), and set `BOXVIA_PREVIEW_RECIPIENT` to the intended mailbox. Never share these values in chat or GitHub.
3. Run `setupBoxViaPreviewNotifications` and approve required permissions. It creates only a Preview poller trigger every five minutes and initializes `BOXVIA_PREVIEW_SERVICES_AFTER=0` if unset.
4. Run `boxViaPreviewPoll` once to test the existing Technical Pilot request #1. Expect a `[PREVIEW] BoxVia service request #1` email, without PII.
5. Verify message receipt and that the Preview cursor advanced to `1`. Confirm a second poll does not resend the same ID.

## Safety and limits
- The script reads no Production data and does not change Production's trigger or cursor.
- Only metadata is emailed. No payment claim is made.
- The cursor advances after GmailApp.sendEmail returns; in an unusual crash between send and cursor persistence, a duplicate email can occur. This is at-least-once, not exactly-once delivery.
- A failed API call or failed Gmail send does not advance the cursor.
- Do not claim delivery verified until an actual email and cursor advance are observed.
- The integration source is excluded from public Worker assets by `.assetsignore`.
