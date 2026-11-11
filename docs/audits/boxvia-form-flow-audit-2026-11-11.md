# BoxVia form flow audit — 2026-11-11

Status: SOURCE REVIEW / NOT DEPLOYED. Branch: `audit/service-forms-20261111`.

## Scope and evidence
Reviewed on GitHub `main`: `cloudflare/worker.js`, `cloudflare/service-request.js`, `cloudflare/paypal.js`, `assets/service-request.js`, `evidence-check/index.html`, `evidence-check/thank-you/index.html`, `contact/index.html`, and six service page forms. Production availability for the six service forms has **not** been independently tested.

## Routing matrix

| Form | Client endpoint | Server destination | Owner alert |
| --- | --- | --- | --- |
| Check a Claim | `POST /api/claim` | D1 `claims` | `GET /api/owner-notifications` → Apps Script → Gmail; test claim #24 delivered |
| One Question Review | `POST /api/service-request` | Resend email only; no D1 insert | Resend only |
| Focused AI Governance Review | same | same | same |
| Technical Pilot | same | same | same |
| Independent Pre-Decision Review | same | same | same |
| AI Governance & Compliance Gap Assessment | same | same | same |
| FAAR Stage 1 | same | same | same |
| Contact page | `mailto:` link | Sender's mail client | Email, not a site form |

## Critical finding: service request delivery
`handleServiceRequest` fails closed with HTTP 503 if any of `TURNSTILE_SECRET_KEY`, `RESEND_API_KEY`, `NOTIFICATION_FROM`, `NOTIFICATION_TO` is absent. The production deployment history showed the Resend secret and notification variables removed. Therefore service requests are **expected** to fail, unless the bindings were restored since that history. The client correctly does not claim success on HTTP 503.

`/api/owner-notifications` returns `services: []` unconditionally. Existing Google Apps Script expects `services` entries shaped `{id, code}` and tracks `SERVICES_AFTER`. There is no D1-backed service queue in the reviewed code.

## Other observations
- Check a Claim markup still carried legacy Netlify form attributes and hidden `form-name` despite Cloudflare submission; removed in this audit branch only. Verify `/api/claim` JS flow before any deployment.
- The service request handler verifies Origin, JSON content type, Turnstile action and hostname, and bounded fields.
- The frontend shows a failure on HTTP 503; no false success was found.
- Notification emails intentionally include only IDs; they are not proof of payment.

## Proposed remediation — separate, approval-gated implementation
1. Specify D1 `service_requests` schema, migration and retention policy. Avoid logging or emailing personal details through the metadata-only owner API.
2. After Turnstile verification, persist each request transactionally in D1, return a server-generated request ID, and fail closed if persistence fails.
3. Extend `GET /api/owner-notifications` with paginated `services: [{id, code}]` and preserve the existing Apps Script contract. Ensure no skipped IDs when >100 records are pending.
4. Agree on a secure owner-only retrieval workflow for full request details, since an ID-only notification is not sufficient to process a service request.
5. Add tests for valid submission, Turnstile failure, DB failure, cursor pagination, replay and privacy boundaries.
6. Test in isolated D1 Preview; **do not deploy** or enable paid intake before explicit production and legal approval.

No changes to PayPal, secrets, production D1, or live notification triggers in this audit.
