# Isolated website visual Preview — 2026-11-18
Status: CONFIG PREPARED / DEPLOYMENT NOT VERIFIED
Source: work/technical-pilots-first-20261118
Worker: boxvia-site-preview-20261118
Configuration: wrangler.site-preview.jsonc

## Authority
Follows the existing BoxVia separation protocol documented in the 2026-11-11 forms brief and 2026-11-18 site brief:
GitHub work branch -> isolated Worker Preview -> tests and evidence -> owner acceptance -> explicit Production GO.
Production worker boxvia, main, PayPal and production D1 must not be modified.

## Isolation
This Preview is for website presentation and navigation only.
It intentionally has no D1 binding, no production secrets and no notification integration.
Claim intake and PayPal are explicitly disabled. Other service form submissions cannot be accepted without a configured backend; do not submit real customer information.
No claim is made that service forms, payments or E2E operations have passed.
Do not reuse or overwrite the existing boxvia-service-preview Worker or its sandbox D1.

## Deployment procedure (authorized Preview only)
1. Check out the exact work branch.
2. Inspect wrangler.site-preview.jsonc and ensure the target is boxvia-site-preview-20261118.
3. Execute: npx.cmd wrangler deploy --config wrangler.site-preview.jsonc
4. Verify the deployed URL reported by Wrangler; do not infer success from GitHub commits.
5. Inspect the rendered homepage, mobile navigation, links and HITL copy.
6. Record deployment version, URL, screenshots and checks. Production remains HOLD.

## HITL boundary
The site describes the approved HITL Policy v1.0; a visual Preview does not prove individual case H1–H5 execution.
