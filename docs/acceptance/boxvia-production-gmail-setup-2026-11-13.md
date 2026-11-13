# BoxVia Production Gmail notifier — setup and acceptance

**Status:** Prepared, not installed or enabled. Production Worker unchanged. Draft PR #3 remains HOLD.

## Architecture

Production Worker `/api/service-request` stores requests in Production D1 `boxvia-claims`. Authorized `GET /api/owner-notifications?claims_after=0&services_after=N` returns only `id` and `service_code`. A **separate** Production Apps Script project polls this queue and sends an owner email via MailApp. Preview script and Preview cursor remain independent.

Source: `integrations/apps-script/boxvia-production-service-notifier.gs`.

## One-time configuration (after Worker release and explicit approval)

1. Create a new standalone Google Apps Script project named `BoxVia Production Service Notifications`. Do not reuse the Preview project.
2. Paste the source file. In **Project Settings → Script properties**, set:
   - `BOXVIA_PROD_BASE_URL` = `https://boxvia.andeks.workers.dev`
   - `BOXVIA_PROD_OWNER_TOKEN` = the existing Production Worker `OWNER_NOTIFICATION_TOKEN` value (minimum 32 characters), entered privately
   - `BOXVIA_PROD_NOTIFY_TO` = intended owner email
   - `BOXVIA_PROD_SERVICES_AFTER` = `0` for the clean Production table
3. Check that the Worker secret `OWNER_NOTIFICATION_TOKEN` exists in Production and matches the Script Property, **without logging or sharing its value**.
4. After Production deployment, execute `boxViaProductionPoll` manually and grant Google authorization. Confirm that the endpoint returns 200; an empty queue is a valid initial result.
5. Submit **one approved synthetic Production request** and run the poller. Verify exactly one email `[PRODUCTION] BoxVia service request #N` and that cursor becomes `N`.
6. Run again without new requests: no new email. Confirm Production D1 record count and no Preview notification.
7. Only then create one time-driven trigger for `boxViaProductionPoll` (for example every 5 minutes), with separate monitoring of execution failures.

## Failure semantics

Cursor advances **after** `MailApp.sendEmail` succeeds, per message. If Google sends the email but Script Properties update fails, a retry can resend that notification. Therefore delivery is **at least once**, not exactly once. The email subject contains the D1 request ID to identify duplicates. A stronger outbox/acknowledgement mechanism would be needed for exactly-once guarantees.

Do not send customer emails or request contents in notification messages. The owner reviews details through authorized D1 access. The endpoint's `claims_after=0` is only a required query parameter; this script ignores claims and does not modify claim notification cursors.

## Go/no-go

Production D1 schema: PASS. Release unit tests: PASS. Apps Script source: PREPARED. Production secret, Turnstile and live notification E2E: OPEN. Production Worker deployment: **HOLD** pending explicit authorization.
