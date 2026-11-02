# Cloudflare claim intake - deployment checklist

This is a staged backend, NOT active on the live site. The existing HTML form still submits to Netlify. Do not switch it until end-to-end tests succeed.

- Create a Cloudflare D1 database for claim requests and execute `cloudflare/schema.sql`.
- Bind it to a separate Cloudflare Worker as `CLAIMS_DB`. Deploy `cloudflare/claim-api.js` as its entry point. The main static-site Worker is a separate deployment; do not replace the static site with this API-only script.
- Configure Worker secret `RESEND_API_KEY` and environment variable `MAIL_FROM` (a verified sender address in Resend). The notification recipient is `andrzej.ekhmenin@gmail.com`. Do not commit credentials.
- Expose the API at the same origin as the website, e.g. by routing `/api/claim` to the API Worker. Cross-origin deployment requires additional design; this code rejects non-matching Origin.
- Test validation, database insertion, email delivery, error handling and the PayPal thank-you redirect before changing `evidence-check/index.html` to POST JSON to `/api/claim`.
- Test spam/rate limiting and establish data retention, access control and privacy notice before production.
- Payment is manually verified and never marked paid by this endpoint.

Important: If the notification provider fails, the request remains stored with notification_sent=0. Monitor and retry those records; do not assume email delivery.
