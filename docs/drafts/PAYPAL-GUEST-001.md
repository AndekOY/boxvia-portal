# PAYPAL-GUEST-001 — Guest checkout draft and controlled test protocol
Date: 2026-11-09
Status: DRAFT / NOT DEPLOYED / RELEASE HOLD

## Evidence
- Owner reports card guest checkout worked several days earlier without manually changing PayPal settings.
- PayPal Business Website Preferences: PayPal Account Optional is already On.
- Production Runtime and Builds are reported configured for PAYPAL_ENV=live with newly updated Live credentials.
- Current live PayPal redirect reached paypal.com/pay, but initial screen offered login or account creation, not a visible card button.
- In main cloudflare/paypal.js, Orders v2 create payload had user_action=PAY_NOW, return_url and cancel_url, but no landing_page.
- Comparison of 39 recent commits up to 0ce7cdb found no changes to cloudflare/paypal.js or wrangler.jsonc; this does NOT prove PayPal's own eligibility or customer/session behavior remained unchanged.
- Production deployments after changing secrets were dashboard-initiated. No successful captured payment is established by screenshots.

## Code delta
In payment_source.paypal.experience_context, request landing_page="GUEST_CHECKOUT". Keep PAY_NOW, return/cancel URLs, amount, D1 binding, idempotency and capture verification unchanged. No new configuration variables, credentials or third-party code.

## Static review checks
1. Diff against main: only intended PayPal code and this draft document.
2. Verify create-order payload includes landing_page exactly once and maintains user_action and both URLs.
3. Verify capture-order logic, verifiedCapture, $20 USD, custom_id, access-token authorization, and D1 updates remain identical.
4. Ensure no credentials, order IDs, tokens or PII in commits.

## Release preconditions — all HOLD
- Confirm PayPal official Orders v2 documentation supports this exact parameter and value for the intended integration; confirm account eligibility and whether guest checkout is available for this merchant's country.
- Reconcile production and Builds settings and secrets after next deployment; verify environment=live without exposing values.
- Owner separately authorizes a controlled release after legal checkout/consent gate (BXC) is cleared.
- Test with a fresh authorized synthetic request and browser session, no real card charge without explicit approval.
- Compare: (A) current main/production vs (B) draft version, holding country/browser/device/amount constant where possible. Record screenshot of guest button presence/absence, redirect host, PayPal response status and whether any customer payment was captured. Do not infer eligibility from a single screen.
- Confirm cancel/return/status behavior; paid capture only in separately authorized controlled test.
- Rollback: revert this isolated commit and redeploy only on owner authorization.

## Important limits
Guest checkout is a preference, not a guarantee. A disappearing guest-card option may be PayPal risk/session/account-country behavior or a changed configuration; adding landing_page is a hypothesis to test, not a proven root-cause fix.


## Official PayPal documentation verification — 2026-11-09
- Orders v2 experience_context landing_page permits LOGIN, GUEST_CHECKOUT, NO_PREFERENCE, BILLING; default NO_PREFERENCE. GUEST_CHECKOUT asks PayPal to show card-entry checkout; deprecated BILLING maps to GUEST_CHECKOUT.
  https://developer.paypal.com/api/orders/v2/definitions/order_capture_request/
  https://developer.paypal.com/sdk/orders/v2/definitions/order_request
- The deprecated application_context landing_page must NOT be used for new Orders v2 code; use payment_source.paypal.experience_context.landing_page.
- user_action PAY_NOW is supported for known final amounts.
- PayPal Checkout guest/card eligibility and the screen actually displayed are subject to PayPal's checkout behavior. Syntax validation is not a production eligibility test.

## Static source review — 2026-11-09
- Read cloudflare/paypal.js from draft branch: landing_page=GUEST_CHECKOUT is inside payment_source.paypal.experience_context next to existing PAY_NOW and return/cancel URLs.
- CAPTURE intent, USD 20.00 amount, claim custom_id, both Live and Sandbox API base URLs, and capture handler remain present.
- The diff contains only cloudflare/paypal.js and this draft protocol. No secret values committed.
- Static review PASSED for API field placement and non-invasive code delta.
- Runtime / buyer eligibility / payment capture tests NOT RUN. No Cloudflare deployment authorized.

## Controlled runtime test plan (not executed)
1. With owner-approved isolated staging, configure sandbox credentials ONLY in staging and create a synthetic claim; do not touch production D1 or credentials.
2. Inspect sanitized create-order request/response for valid experience_context and PayPal approval link; record no tokens, email addresses, claim texts or card data.
3. Compare baseline vs draft in identical buyer environment. Check whether card-entry is offered, not only API success.
4. Verify cancellation and return URLs and no false payment confirmation; payment must remain pending until verified capture.
5. Before production release, obtain explicit owner approval, complete BXC legal checkout gates, and plan rollback. Do not use a real card charge without separate approval.
6. If staging is unavailable, stop at static verification and request approval for a defined safe test environment.

## Verification result
API PARAMETER SUPPORTED; STATIC CHECK PASSED; LIVE GUEST ELIGIBILITY UNESTABLISHED; RELEASE HOLD.
