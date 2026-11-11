# BXC Cloudflare runtime verification — user-provided dashboard evidence
Date: 2026-11-11
Status: VERIFIED FROM DASHBOARD SCREENSHOTS; GDPR ACCOUNT FACTS STILL OPEN; HOLD

## Evidence
Dashboard screenshot supplied by owner, Cloudflare Workers & Pages > boxvia-bxc-sandbox > Production > Settings > Runtime variables and secrets / Bindings, 2026-11-11 approximately 11:12 local screen time.

Observed runtime values:
- BXC_SANDBOX_ONLY = true
- PAYPAL_CHECKOUT_ENABLED = false
- PAYPAL_ENV = sandbox
- D1 binding DB = boxvia-bxc-sandbox

Separate overview screenshot showed:
- worker domain boxvia-bxc-sandbox.andeks.workers.dev
- Assets binding ASSETS and D1 DB
- Workers Logs and Workers Traces displayed Disabled
- 16 invocations and 0 errors in last 24h on the screenshot

## Interpretation and boundaries
These are direct observations of the Cloudflare UI for the Sandbox Production environment and are stronger than repository-only configuration evidence.
No real PayPal checkout is enabled by the shown PAYPAL_CHECKOUT_ENABLED setting.
This does NOT prove absence of all other processing or platform logging, nor retention/region, cookie behavior, provider subprocessors, DPA or transfer safeguards.
Do not infer current production BoxVia Worker settings from the BXC Sandbox screenshot.
No user secrets or customer records were requested or collected for this review.

## Next verification
Open Cloudflare D1 > boxvia-bxc-sandbox > Overview/Settings and provide a screenshot of metadata and location/region, without opening row contents or revealing customer data.
Then inspect actual retention/backup settings and Cloudflare account data processing terms.
No deployment or release authorization.
