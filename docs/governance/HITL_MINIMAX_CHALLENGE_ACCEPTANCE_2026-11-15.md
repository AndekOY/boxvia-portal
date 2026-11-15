# HITL minimax challenge preparation acceptance
Date: 2026-11-15
Status: COMPONENT PASS / END-TO-END UNESTABLISHED / PRODUCTION HOLD
CI: https://github.com/AndekOY/boxvia-portal/actions/runs/43718534501

## Minimal change
Added cloudflare/hitl-challenge-prepare.js, a non-routed trusted-server primitive. It verifies case HOLD and credential ACTIVE from DB, reads event history directly from DB, rejects caller-supplied history, checks the canonical decision's case/gate and current chain head, generates a random short-lived challenge and inserts a PENDING row into hitl_auth_challenges. It never inserts a HITL PASS event, verified intent or proof.

## Tests
Five Node tests passed: pending challenge insertion, client-supplied history rejection, wrong case rejection, stale chain head rejection, nonhuman gate rejection. Mock database only: no remote D1 test and no browser/passkey interaction.

## Minimax safety boundary
No new public endpoint, no credential enrollment and no authorization escalation. The challenge alone does not establish owner identity or authorize H3-H5 PASS. A race between reading event history and writing the challenge remains possible; signed commit must recheck current chain head transactionally. The current module also requires independent owner authentication before invocation and robust D1 result checking. Real WebAuthn registration, COSE/SPKI key alignment, assertion verification and atomic signed commit are not implemented.

Do not merge to main or deploy production. Production HOLD.
