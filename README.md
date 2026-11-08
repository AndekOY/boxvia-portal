# BoxVia Portal

Public website: https://boxvia.andeks.workers.dev/  
Repository: https://github.com/AndekOY/boxvia-portal

## Architecture and deployment

- Static HTML, CSS and JavaScript pages are served through Cloudflare Workers static assets.
- Worker entry point: `cloudflare/worker.js`.
- Wrangler configuration: `wrangler.jsonc`; Worker name: `boxvia`; `keep_vars: true` preserves runtime variables and secrets across deployments.
- Cloudflare D1 binding: `DB`, database `boxvia-claims`.
- Default GitHub branch: `main`. Verify Cloudflare deployment/build status independently after commits; a GitHub commit alone is not proof of a successful production deployment.
- The live website is the Cloudflare Workers URL above. Netlify Forms is not the current claim intake backend.

## Main public sections

- `/` - Home
- `/services/` - Commercial analytical services
- `/products/` - Products
- `/technology/` - Technology overview
- `/research/` - Research
- `/andeks/` - ANDEKS normative system
- `/are/` and `/era/` - ARE and ERA
- `/faar/` - FAAR
- `/reports/` - Illustrative report library
- `/services/technical-pilot/` - Technical Pilot
- `/evidence-check/` - Check a Claim
- `/evidence-check/thank-you/` - Request-specific payment/confirmation page (excluded from indexing)
- `/legal/`, `/about/`, `/contact/` - Legal information, About, Contact

For the full public URL inventory, see `sitemap.xml`.

## Check a Claim - current request and payment flow

1. Customer submits an email address, one precise claim, a public primary-source URL and required confirmations via `/evidence-check/`.
2. The frontend submits to `POST /api/claim`. Cloudflare Turnstile is verified server-side. The Worker stores the request in D1 `claims` and issues a request-specific access token.
3. The confirmation page at `/evidence-check/thank-you/?request=<id>` initiates PayPal Checkout for that verified request. The payment is **$20 USD**.
4. PayPal order creation and capture are handled server-side. Payment status is associated with the request in D1; submission alone does not prove payment.
5. Work starts only after server-side payment confirmation. The intended deliverable is a bounded English PDF report, normally about two pages, sent by email within **24 hours after confirmed payment**.

Possible findings: SUPPORTED, NOT SUPPORTED, or UNESTABLISHED within the defined evidence boundary. The three published examples are illustrative, not customer engagements. Check a Claim is a limited commercial evidence check and **not** formal ANDEKS certification or a comprehensive audit.

## Worker API and background processing

- `GET /api/health` - Worker health
- `GET /api/db-health` - D1 connection and `claims` table check
- `POST /api/claim` - Verified claim intake
- `POST /api/paypal/create-order` - PayPal order creation
- `POST /api/paypal/capture-order` - PayPal capture and server-side payment recording
- `POST /api/claim-status` - Request/payment status
- `POST /api/service-request` - Other service requests, implemented separately in `cloudflare/service-request.js`

PayPal integration: `cloudflare/paypal.js`.  
Notification delivery: `cloudflare/notifications.js`, invoked by the Worker's scheduled handler.  
D1 schema/migrations: see files under `cloudflare/`, including `paypal-orders-migration.sql`.

The D1 payment flow uses `claims`, `paypal_orders`, `claim_access`, and notification outbox records. Operational status must be verified in D1 and PayPal, not inferred from a checkout redirect.

## Cloudflare runtime configuration

Set and inspect **production runtime** variables and secrets in Cloudflare Workers & Pages > `boxvia` > Settings > Variables and secrets. Build-time variables are a separate configuration surface.

Runtime variables:
- `CLAIM_INTAKE_ENABLED=true`
- `PAYPAL_CHECKOUT_ENABLED=true`
- `PAYPAL_ENV=live` (production; `sandbox` is for testing)
- `NOTIFICATION_FROM` and `NOTIFICATION_TO` - notification email routing

Encrypted secrets (never commit values to GitHub):
- `PAYPAL_CLIENT_ID`
- `PAYPAL_CLIENT_SECRET`
- `TURNSTILE_SECRET_KEY`
- `RESEND_API_KEY`

D1 database binding `DB` must reference `boxvia-claims`. The notification sender currently uses a Resend onboarding/test address; verify delivery restrictions before relying on it for customer communications. The scheduled notification trigger is configured in Cloudflare; verify its active schedule and outbox delivery in the production environment.

## Indexing and analytics

- `robots.txt` allows public crawling, while excluding `/api/` and `/evidence-check/thank-you/`.
- `sitemap.xml` lists public pages for search engines.
- Cloudflare Web Analytics is used for site visits, page views and Core Web Vitals. Worker request counts are **not** equivalent to human visits. Own browsing may be counted in Web Analytics.

## Operational checks

- Check production deployment status, `/api/health`, and `/api/db-health`.
- Test claim intake on desktop and mobile; a successful Turnstile challenge alone does not mean a request was stored.
- Confirm payment in PayPal and D1 before marking a claim paid or starting work; avoid duplicate charges when the checkout result is unclear.
- Check the notification outbox and delivery logs; a successful Cron invocation alone does not prove email delivery.
- Verify the 24-hour service promise, report delivery process and customer communications.
- Review current legal/privacy disclosures, retention rules, consumer information and permitted use of illustrative reports before scaling.

## Methodological boundaries

ANDEKS, ARE, ERA and commercial BoxVia evidence checks have different scopes and readiness/evidence statuses. Technology pages describe ongoing development; a demonstrator or synthetic example does not establish production execution or independent verification. No certification, legal opinion, security audit or guaranteed regulatory outcome is implied.

## Historical archive

The original BoxFinTech website is preserved under `archive/boxfintech-before-portal-2026-10-31`. Do not delete the archive without verification.
