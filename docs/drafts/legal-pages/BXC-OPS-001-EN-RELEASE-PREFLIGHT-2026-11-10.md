# BXC-OPS-001 — Minimal release preflight, English-only
Date: 2026-11-10
Status: INTERNAL WORKING GATE / RELEASE HOLD
Product: Check a Claim (USD 20 final)
Decision basis: BXC-GDPR-DEC-001; BXC-REL-001/002; BXC-DATA-001; actual draft code inspection.

## Approved baseline
- Public legal/checkout language: EN only; RU is an internal technical translation.
- Check a Claim: substantive human analysis, ChatGPT as assistant, final human responsibility.
- ChatGPT input: genuinely anonymous analytical data by default (C); pseudonymized only under a documented GDPR exception (B); identifiable source documents not transferred by default (A).
- Final price payable to BoxVia USD 20.00, BoxVia-chargeable taxes included; mandatory buyer-specific disclosures still apply.
- Full GDPR Compliance Protocol deferred, but mandatory GDPR disclosures and operational safeguards are NOT waived.

## Concrete code findings
1. `cloudflare/bxc-sandbox-public/checkout/index.html` has required Terms/Schedule/Withdrawal/Privacy checkboxes but **no distinct early-performance request or separate consequence acknowledgment**. A required checkbox acknowledging a privacy notice is not itself a GDPR consent basis.
2. `cloudflare/bxc-sandbox-worker-draft.js` sends only `affirmative`, `termsAccepted`, `scheduleAccepted`, `withdrawalNoticeAcknowledged`, `privacyNoticeAcknowledged` to acceptance; no early-performance choice is submitted.
3. `cloudflare/contract-confirmation.js` can represent `earlyPerformanceRequest` if supplied but cannot create that evidence from the current checkout UI. It renders confirmation text but **does not dispatch durable-medium confirmation**.
4. `wrangler.bxc-sandbox.jsonc` keeps PayPal checkout disabled (`PAYPAL_CHECKOUT_ENABLED=false`); sandbox is isolated and not a production release.
5. `cloudflare/catalog/bxc-check-a-claim-source-map-v0.1.json` is explicitly a source map, not a deployable trusted catalog: required contract fields and released SHA-256 values remain null.

## Minimal execution sequence
**G1 — Data handling, before any real client input.**
Document that raw client files remain outside ChatGPT by default. Create a case-level transformation check: remove direct identifiers, examine indirect identification, and use an abstract analytical question whenever possible. If anonymity cannot be established, STOP or use a separately authorized GDPR exception. Confirm actual ChatGPT settings and service terms before using identifiable/pseudonymized client data.

**G2 — Consumer checkout.**
Implement separate, initially unchecked early-performance request and required informed acknowledgment (when applicable). Persist exact wording/version and timestamps on the server, and record whether the consumer declined early performance. Do not imply 24-hour commencement when lawful start conditions are absent. Review protected sole trader and mandatory consumer language requirements.

**G3 — Durable contract confirmation.**
Verify actual email/durable-medium delivery of the accepted complete documents and statutory notices, with exact version/hash evidence, before performance where required. A rendered one-page summary alone is insufficient without the full documents and proof of dispatch.

**G4 — Privacy and tax disclosures.**
Verify actual production processors (Cloudflare, PayPal, email provider, ChatGPT), data flows, retention, transfers, analytics/cookies, and any mandatory buyer-specific tax information. Update EN Privacy Notice to reflect only verified operations. No invented retention period or training-use claim.

**G5 — Controlled EN release.**
After legal review and G1–G4: finalize four EN documents; calculate SHA-256 of exact immutable bytes; record publicly accessible HTTPS URLs; generate deployable catalog from those approved bytes; perform one sandbox end-to-end acceptance/payment/confirmation check. Obtain explicit owner authorization for external publication and separate production authorization.

## Current release decision
**HOLD.** This document authorizes drafting and internal review only. No production change, no PayPal activation, no legal release.
