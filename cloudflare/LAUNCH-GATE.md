# Check a Claim - Cloudflare launch gate

Current state: production site works, but the claim form is still Netlify-based. The Cloudflare adapter is staged in `assets/claim-cloudflare.js` and MUST NOT be loaded until the backend is ready.

## Operator notification

Recipient: andrzej.ekhmenin@gmail.com. Never expose the API key to browser code.

## Setup required in Cloudflare and Resend

1. In Cloudflare create a D1 database, execute `cloudflare/schema.sql`, and bind it to the **separate API Worker** as `CLAIMS_DB`.
2. Verify an authorized sender domain in Resend. Add `RESEND_API_KEY` as an encrypted Worker secret and `MAIL_FROM` as a variable containing a sender email on that verified domain.
3. Deploy `cloudflare/claim-api.js` to the API Worker. Route `/api/claim` from the site hostname to that Worker. Do not replace the existing static BoxVia Worker.
4. Before production, configure request rate limiting and bot protection; review the privacy notice, retention policy, and access controls for submitted personal data.
5. Test one valid submission, invalid email, invalid URL, missing consent, a database failure, and an email provider failure. Confirm a D1 row is written and an email arrives at the recipient. A successful API response currently confirms storage, **not** delivery of the notification.
6. Only after these checks, remove the Netlify-specific form attributes and hidden `form-name` input, add `<p id="claim-submission-status" role="status" hidden></p>` inside the form, and load `/assets/claim-cloudflare.js` with defer. Retest on desktop and mobile.
7. Submit a real test order and confirm that the thank-you page shows the existing $20 PayPal link. Payment is verified manually and is not connected to D1.

## Rollback

If the API fails, revert the form to the Netlify implementation from the previous commit. Do not tell users their claim was received unless the server confirms it. Do not send a customer to PayPal when storage fails.

## Outstanding technical considerations

- The API is currently a staging implementation, not hardened for public traffic.
- Add monitoring and retries for records with `notification_sent=0`.
- Prevent duplicate requests from repeat submissions and establish a retention/deletion process.
- The API's origin validation and route need to be checked against the actual Cloudflare deployment topology.
