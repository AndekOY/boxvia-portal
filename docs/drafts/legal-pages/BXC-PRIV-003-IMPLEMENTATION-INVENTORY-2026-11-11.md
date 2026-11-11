# BXC-PRIV-003 — Implementation-grounded data processing inventory
Date: 2026-11-11
Status: INTERNAL FACT-FINDING / RELEASE HOLD
Method: repository source review only. Not a production configuration audit or vendor DPA review.

## Directly observed in repository
| Component | Evidence | Supported conclusion | Not established |
|---|---|---|---|
| Cloudflare Worker | wrangler.jsonc main cloudflare/worker.js | Existing BoxVia worker entrypoint | Current deployed version, subprocessor inventory |
| Cloudflare D1 | wrangler.jsonc binding DB, database_name boxvia-claims | Database configured in repository | Actual stored rows, region, retention, access policy |
| Static assets | wrangler.jsonc ASSETS binding | Worker serves static assets | Current cookies, browser network requests |
| BXC sandbox | cloudflare/bxc-sandbox-worker-draft.js | Separate draft entrypoint; sandbox-only checks; checkout routes and server catalog | Deployment, active secrets, public availability |
| Customer intake | cloudflare/bxc-sandbox-public/checkout/index.html | Draft collects claim ID and capability token, requires affirmative contract acknowledgments | Real-client use; browser telemetry or logs |
| Payment | cloudflare/bxc-sandbox-worker-draft.js imports paypal-contract-wired-draft.js | Draft payment handler integration with PayPal sandbox requirement | Production PayPal processor arrangement, DPA, actual payment flows |
| Email | docs/drafts/legal-pages/BXC-MAIL-003-MANUAL-GMAIL-CONFIRMATION-2026-11-10.md | Owner-approved manual Gmail plan | Actual Gmail dispatch, retention and access controls |
| AI | docs/releases/candidates/BXC-PRIV-001-v0.1-EN.md | Draft disclosure says human-performed analysis with AI aid | Exact AI provider/account, processing geography, DPA, actual inputs |

## Minimum-data design decision for initial release
- Intake must accept only a public claim reference or minimal textual statement; no attachments or sensitive third-party files by default.
- No real personal data to an AI provider unless an independently documented lawful exception is approved.
- Checkout must not send access tokens or claim materials to analytics or third-party scripts.
- This is a proposed operating restriction, not proof that current deployment enforces it.

## Open confirmations required from owner / service dashboards
1. Cloudflare account processing terms and any applicable subprocessors and transfer documentation.
2. PayPal business processing terms, actual merchant entity, data categories, recipient countries.
3. Google/Gmail account and retention/access configuration for contract confirmations.
4. Actual AI assistance provider and mode used for service fulfillment; any third-party transfers.
5. Observed browser requests, cookies and analytics for the intended public checkout.
6. Retention/deletion schedule for D1 rows, accepted document snapshots, email evidence and backups.
7. Data subject request and security incident operating procedure.

## Privacy Notice drafting rule
The current BXC-PRIV-001 candidate must not be represented as fully verified. Amend only after items above are confirmed; do not claim absence of cookies or international transfers without evidence.

## Release boundary
No additional generic regression suite is needed. Finish the release gates and one controlled end-to-end sandbox walkthrough. HOLD until legal review and express owner authorization.
