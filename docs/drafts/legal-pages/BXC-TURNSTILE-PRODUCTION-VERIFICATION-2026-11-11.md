# BXC — Turnstile production verification
Date: 2026-11-11
Status: VERIFIED — ONE SUCCESSFUL PATH; NOT A GENERAL SECURITY CERTIFICATION

## Evidence
- User-provided Cloudflare Turnstile widget dashboard screenshot, 2026-11-11 approximately 14:44 Europe/Warsaw: boxvia-claim-form; 14 challenges solved in 24h; Siteverify requests = 1; valid tokens = 1; invalid tokens = 0.
- Prior user-provided Cloudflare PDF reports showed Siteverify requests = 0 before test.
- User-provided production browser screenshot showed /evidence-check/thank-you/?request=23 with REQUEST RECEIVED, Request verified, payment not yet confirmed, and PayPal payment CTA. No payment was made in this test as far as screenshots establish.
- Repository cloudflare/worker.js calls https://challenges.cloudflare.com/turnstile/v0/siteverify with TURNSTILE_SECRET_KEY and requires success === true before inserting claim in D1.

## Finding
One server-side Siteverify request and one valid token were recorded after test submission. In conjunction with production request #23 accepted, the intended successful Turnstile validation path is supported. No need to change Turnstile configuration based on the previous dashboard warning.

## Limitations
- The dashboard does not expose a request-level trace linking Siteverify request to D1 claim #23; association is temporal and supported by source behavior, not independently traced.
- This does not test invalid/replayed tokens, production build equivalence, or all security cases.
- Payment status is not confirmed beyond the browser message; no PayPal transaction test performed.

## Next MINIMAX action
Verify claim #23 remains unpaid in D1; then remove this synthetic claim and associated claim_access and any related records in correct referential order, only after reviewing dependencies and preserving no genuine customer data. Do not run a blind DELETE. No production changes or payment required.
