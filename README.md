# BoxVia Portal - live static website

Public site: https://boxvia.andeks.workers.dev/
Repository: https://github.com/AndekOY/boxvia-portal

## Deployment
Static HTML/CSS/JavaScript. The default branch is `main`. The public website is served at the Cloudflare Workers domain above. The current deployment pipeline and its linkage to `main` should be verified separately; this README does not assert that a GitHub commit automatically deploys to Cloudflare.

## Pages
- `/` - Home
- `/services/` - Professional services
- `/technology/` - Technology and research
- `/about/` - About
- `/contact/` - Contact
- `/legal/` - Service boundaries and data-handling information
- `/evidence-check/` - Check a Claim ($20 USD)
- `/evidence-check/thank-you/` - Submission acknowledgement and external PayPal payment link

## Check a Claim
Netlify Forms collects the customer's email, precise claim and public source URL. The confirmation page links to a fixed-price PayPal checkout. Payment is verified manually; a form submission does not prove payment. Delivery is a bounded English PDF report, normally around two pages. The three illustrative reports are linked from the product page. The product is **not** a formal ANDEKS™ normative assessment or certification.

## Operational checks
- Verify Netlify Forms submissions and email notifications.
- Verify PayPal payment and manually match it to the submitted request before starting work.
- Confirm external sample-PDF sharing permissions.
- Keep website, PayPal product description and report template consistent.
- Review the legal/privacy disclosures and applicable requirements before scaling customer acquisition.
- `robots.txt` intentionally blocks all crawling pending an explicit indexing decision; change only with approval.

## Boundaries
ANDEKS™, ARE and ERA have distinct scopes and evidence statuses. No ARE/ERA execution is implied by a BoxVia report unless independently documented.

## Historical archive
Original BoxFinTech website was preserved in `archive/boxfintech-before-portal-2026-10-31`; do not delete the archive without verification.
