# HITL signed snapshot v4 acceptance
Date: 2026-11-15
Status: LOCAL SQLITE PASS / END-TO-END UNESTABLISHED / PRODUCTION HOLD
CI: https://github.com/AndekOY/boxvia-portal/actions/runs/43719280112

## Implemented
Preview-only SQL v4 migration extends verified commit intent with expected_last_event_id and verified_sign_count. A BEFORE INSERT trigger for H3-H5 PASS checks that the latest case event ID equals the snapshot captured for the verified intent, that the evidence and exact intent match, that the challenge remains pending and valid, and that the authenticator counter has not regressed. An AFTER INSERT trigger updates the authenticator counter in the same SQLite statement; existing v2 trigger consumes intent/challenge and writes proof.

## Tested
Synthetic H3 signed event accepted and counter advanced. Reuse rejected. An intervening H4 HOLD event invalidated a prepared H4 intent. A lower counter rejected. Fresh H4 and H5 signed events accepted, with final case PASS and three proofs. CI succeeded.

## Limits
This is a synthetic local SQLite test, not actual human WebAuthn enrollment or verified identity. Intent creation is not protected by an end-to-end authenticated signing API. Event-ID snapshot is not a cryptographic chain-head validation; an immutable event append is the assumed change mechanism. Zero-counter authenticators remain a special case, with single-use challenge as replay protection. No remote Preview D1 v4 migration or signed HTTP transaction tested. Never treat these synthetic PASS records as actual human approval.

Next: owner enrollment and secure server-side signed commit coordinator, with full digest/chain binding, atomic counter and proof persistence and remote Preview replay/concurrency tests.

No main merge, production Worker deploy or production D1 migration. PRODUCTION HOLD.
