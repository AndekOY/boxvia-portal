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


## D1 Settings screenshot — 2026-11-11, approximately 11:15 screen time
Owner-provided Cloudflare Dashboard screenshot: D1 Database > boxvia-bxc-sandbox > Settings.
- General > Jurisdiction: None.
- General > Region: Eastern Europe.
- Read replication: Disabled.
- No retention or backup duration displayed on this Settings screen.
Interpretation: the selected primary database region is Eastern Europe; no jurisdictional restriction is configured; global read replication is disabled. This is **not** evidence that all personal data, backups or provider processing remain within the EU/EEA. Do not claim EU-only residency.
Next: inspect Time Travel tab for the displayed recovery window; do not open table records or change settings.


## D1 Time Travel screenshot — 2026-11-11, approximately 11:16 screen time
Owner-provided dashboard screenshot: D1 Database > boxvia-bxc-sandbox > Time Travel.
- UI states: "Restore your database to any point in time within the past 7 days".
- Actual restore window shown: 10 November 2026 16:24 through 11 November 2026 11:16.
- Restore warning: restoring to an older version overwrites the current database.
Interpretation: seven days is the maximum advertised point-in-time recovery horizon, not a customer-data retention policy or a guarantee of exactly seven days of retained backups. The visible window is shorter, consistent with recent database history but creation time is not independently verified. Deleted records may remain recoverable during the available window. Do not execute restore. Provider-side backups, logs and deletion semantics remain unverified.
