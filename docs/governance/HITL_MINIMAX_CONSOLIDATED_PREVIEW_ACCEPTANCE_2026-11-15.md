# HITL MINIMAX consolidated Preview acceptance
Date: 2026-11-15
Status: CONSOLIDATED COMPONENT + REMOTE SQL PASS / REAL PASSKEY ENROLLMENT NOT DONE / HTTP END-TO-END UNESTABLISHED / PRODUCTION HOLD

## Evidence
Successful workflow: https://github.com/AndekOY/boxvia-portal/actions/runs/43720026668

The first consolidated workflow run 43719941427 failed because it checked out a commit created before the remote test script existed; migrations had already succeeded on the allowlisted Preview D1. The corrected v2 workflow at commit 99edd3e0c953eb163f970d00fde686df3d53dd8e succeeded.

## Completed in consolidated acceptance
- Local Node ES256 assertion verification, canonical decision binding, challenge preparation, signed preflight and signed coordinator tests.
- Local SQLite v4 signed snapshot regression.
- Remote Preview D1 schema confirmed: public_key_spki, expected_last_event_id, verified_sign_count; guard_v4, counter_v4, consume_v2 triggers.
- Remote synthetic case H1/H2, ACTIVE synthetic credential, challenge and intent.
- Two concurrent remote SQL H3 PASS writes with same intent: exactly one succeeded.
- Exactly one H3 PASS event and linked proof; challenge CONSUMED; sign_count advanced to 1.
- Replayed same SQL write rejected.
- No main merge, production Worker deployment or production D1 change.

## Explicitly not completed
- No real human passkey enrollment or verified owner identity. An actual WebAuthn registration ceremony requires owner-controlled authenticator interaction and independent identity verification; it cannot be simulated as genuine enrollment.
- Remote SQL concurrency used a synthetic forged intent without a cryptographic signature; it validates DB behavior only.
- The signed commit coordinator was tested with a mock D1, not over a deployed authenticated HTTP route.
- No end-to-end browser get()/create() ceremony, authenticated session or production-grade challenge issuance endpoint.
- No independent evidence of substantive human review for H3/H4/H5.

## Minimax next blocking step
Implement owner-controlled passkey enrollment with RP/origin validation and independently verified activation, then an authenticated Preview-only HTTP challenge+signed-commit endpoint; test with real passkey, exact report binding, replay and concurrent requests. Preserve bearer-only H3-H5 HOLD.

Final status: TECHNICAL PREVIEW PARTIAL PASS / HUMAN IDENTITY UNESTABLISHED / PRODUCTION HOLD.
