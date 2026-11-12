# BoxVia Preview — Technical Pilot acceptance record

**Date:** 2026-11-12 (Europe/Warsaw)  
**Scope:** isolated Preview Worker `boxvia-service-preview`, Sandbox D1 `boxvia-bxc-sandbox`, separate Preview Apps Script poller.  
**Status:** PARTIALLY ACCEPTED — first E2E delivery proven; repeat-delivery/idempotence still pending.  
**Production:** no deployment or database changes authorized or performed in this acceptance.

## Verified evidence

1. **Browser submission:** the user-provided screenshot shows `Request received. BoxVia will follow up by email.` after Technical Pilot submission on the Preview hostname. This is user-visible evidence of successful submission, not by itself proof of database persistence.
2. **Remote D1 persistence:** GitHub Actions read-only audit [run 43285958233](https://github.com/AndekOY/boxvia-portal/actions/runs/43285958233) completed successfully. Its log shows `technical_pilot_total=1` and `latest_id=1`. The same audit enumerated columns `id, service_code, service_title, customer_email, request_json, status, created_at, updated_at`, the statuses `new/reviewing/closed/deleted`, and indexes `idx_service_requests_created_at` and `idx_service_requests_review`. No customer fields were selected by the audit.
3. **Owner notification:** user-provided Outlook screenshot shows message `[PREVIEW] BoxVia service request #1`, received 2026-11-12 19:35 local time, with `ID: 1`, `Service: technical-pilot`, and explicit reference to isolated Preview D1. No customer data was present in the email.
4. **Separate Preview cursor:** user-provided Apps Script property screenshot shows `BOXVIA_PREVIEW_SERVICES_AFTER=1` after notification #1. This supports cursor advancement for the first processed notification. The separate Production cursor was not modified during this acceptance.
5. **Fresh schema and unit regression:** GitHub Actions [run 43286494678](https://github.com/AndekOY/boxvia-portal/actions/runs/43286494678), commit `bd49e1a`, passed `Verify fresh D1-compatible schema with SQLite`, `Verify migration in fresh local Wrangler D1`, and `Run service request unit tests`. The fresh-install SQL is a reference contract only; it was **not** applied to the existing remote Sandbox D1.

## Not yet proven

- **Second new Technical Pilot request:** no evidence yet of a second successful submission with ID > 1.
- **Second independent Gmail notification:** no evidence yet of `[PREVIEW] BoxVia service request #2` or another new ID.
- **Cursor idempotence:** no evidence yet of rerunning the poller without generating duplicate notifications after a second request.
- **Long-running scheduled poller:** an immediate Apps Script execution and first email are proven; continued unattended five-minute operation is not established by the cited evidence.
- **Production release readiness:** not established; no merge or Production deployment is approved.

## Safe next acceptance procedure

1. Submit **one** new synthetic Technical Pilot request via the isolated Preview form, using only non-sensitive test text. Do not reuse a completed Turnstile token.
2. Verify that the form reports success. Check the new row **by ID and service code only** in isolated Sandbox D1 using a read-only query; do not output customer email or request JSON.
3. Run the existing `boxViaPreviewPoll` Apps Script function once (or wait for its configured trigger). Verify an email titled `[PREVIEW] BoxVia service request #<new ID>`.
4. Verify `BOXVIA_PREVIEW_SERVICES_AFTER` advanced to the new ID. Run the poller a second time **without submitting another request**; verify no duplicate email is generated.
5. Check the existing Production `BOXVIA_API_URL` and `SERVICES_AFTER` properties remain unchanged. Never paste notification tokens into chats, logs or GitHub.
6. Only after these checks, update this record to `ACCEPTED` with evidence references. Production deployment remains a separate approval.

## Security and evidence boundaries

No token values, Turnstile responses, customer email addresses, or request payloads belong in this public repository. GitHub Actions green status alone must not be represented as real browser-to-email E2E proof. The first E2E result is supported by separate browser, D1 and mailbox evidence.
