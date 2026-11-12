# Service request D1 integration — Preview-only acceptance checklist

Branch: `audit/service-forms-20261111`. No production deployment or migration performed.

## Changes
- `cloudflare/service-request.js`: Turnstile-verified request is stored in D1, with email and bounded text; HTTP 201 only after confirmed insertion. No Resend dependency.
- `cloudflare/worker.js`: authenticated owner poll returns service request `{id, code}` only. Customer email and text are never included in the poll response.
- `cloudflare/migrations/0001_service_requests.sql`: table definition; must be applied to isolated Preview D1 before testing.
- `evidence-check/index.html`: removed obsolete Netlify form attributes.

## Preview gate
1. Apply migration **only** to isolated Preview D1 database configured in `wrangler.jsonc`. Confirm production DB is unchanged.
2. Test all six service forms with valid Turnstile, including required fields and technical pilot review format.
3. Confirm a unique positive ID and 201 response, plus exact D1 row content.
4. Confirm invalid origin, missing token, invalid action/hostname, oversized fields, and absent DB do not persist data.
5. Confirm bearer-token rejection 401 and correct `services_after` cursor pagination, including >100 requests; confirm only `id, code` are exposed.
6. Verify the installed Apps Script actually accepts `{id, code}` before merge.
7. Agree an owner-only retrieval method for full details. Without this, alerts alone are not an operational intake solution.
8. Approve retention and deletion workflow for personal data in `service_requests` (proposed unpaid/inquiry retention: 30 days, subject to policy approval). No automated deletion is installed.
9. Validate build and runtime in Preview; **do not merge** before gates are passed.

## Current limitations
- No authenticated owner detail endpoint; full data currently requires authorized Cloudflare D1 console access.
- No automated retention cleanup.
- D1 migration is not automatically executed by a Workers build.
- No payment confirmation or paid service launch implied.
- No live Preview integration test has been performed.
