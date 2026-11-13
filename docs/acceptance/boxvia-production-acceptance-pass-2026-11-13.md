# BoxVia — Production Service Requests Acceptance

**Result: PRODUCTION ACCEPTANCE — PASS**  
**Date:** 2026-11-13 (Europe/Warsaw)  
**Scope:** Technical Pilot service-request intake, Production D1 persistence, Google Apps Script Gmail notification polling.  
**Approval:** Owner authorized controlled Production deployment and subsequently approved acceptance closure.

## Release evidence

- GitHub PR #3 merged to `main`: https://github.com/AndekOY/boxvia-portal/pull/3
- Merge commit: `43fd8cb3007af82ff058af267866cabe5cd448b6`.
- GitHub Actions service request release checks: PASS, https://github.com/AndekOY/boxvia-portal/actions/runs/43409439228 .
- Cloudflare Worker `boxvia` deployment displayed **Ready**, version prefix `3a5825fe`, linked to the release commit message on `main`. No manual redeployment was needed.
- Cloudflare Production binding `DB` points to D1 `boxvia-claims`. Required `TURNSTILE_SECRET_KEY` and `OWNER_NOTIFICATION_TOKEN` were present as encrypted secrets (values not disclosed).
- Turnstile Production hostname `boxvia.andeks.workers.dev` and action `service-request` were observed in the widget analytics.

## Owner-observed acceptance checks

| Check | Evidence | Result |
|---|---|---|
| Form submission | Production Technical Pilot displayed “Request received. BoxVia will follow up by email.” | PASS |
| D1 persistence | `service_requests`: `id=1`, `service_code=technical-pilot`, `status=new`, `created_at=2026-11-13 10:58:09` UTC | PASS |
| Manual Apps Script poll | `boxViaProductionPoll` completed without error at 12:05:15 local time | PASS |
| Gmail notification | Message subject `[PRODUCTION] BoxVia service request #1`, service `technical-pilot`, no customer PII in notification body | PASS |
| Cursor | Owner confirmed `BOXVIA_PROD_SERVICES_AFTER=1` | PASS |
| Repeat poll | Owner confirmed no duplicate email after second manual run | PASS |
| Scheduled execution | Two time-driven executions completed at 12:16:53 and 12:21:53 local time, each successful | PASS |
| Schedule interval | Observed 5 minutes between the two scheduled runs | PASS |

Evidence source: owner-provided screenshots and explicit confirmations during 2026-11-13 release acceptance. This record does not imply independent Cloudflare or Google admin API access.

## Operational state and boundaries

**Operational:** Production service request intake → Worker → D1 → isolated Production Apps Script → Gmail. The notifier is configured for five-minute polling. Preview remains a separate project and queue; no Preview deployment was requested. PayPal and `claims` were outside the authorized change scope.

**Delivery guarantee:** at least once, not exactly once. A failure after sending an email but before saving the cursor may produce a duplicate. Use the request ID in the email subject for reconciliation.

**Monitoring:** periodically review Apps Script executions for failures, confirm new service requests in Production D1 and verify Gmail delivery. A successful empty poll proves execution, not delivery of a future message.

**Scope limitation:** this acceptance covers the demonstrated Technical Pilot service request and notification chain, not all forms, PayPal end-to-end payments, general site availability or security certification.

**Release decision:** PASS. Close the Production D1 + Gmail release task. No additional Production deployment or schema migration is authorized by this closure.
