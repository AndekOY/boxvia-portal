# HITL MINIMAX signed preflight acceptance
Date: 2026-11-15
Status: COMPONENT PASS / END-TO-END UNESTABLISHED / PRODUCTION HOLD
CI: https://github.com/AndekOY/boxvia-portal/actions/runs/43718886196

## Implemented
Added a non-routed, read-only preflight function. It retrieves challenge and credential from server-side D1, checks case HOLD, canonical decision digest, current event chain head and expiry, compares the signed clientDataJSON challenge hash to the stored challenge hash, and invokes ES256 WebAuthn assertion verification with origin, RP ID and UV checks. It returns a verified preflight result but does NOT insert an intent, event, proof or update a signature counter.

Added a preview-only schema migration to store SPKI for WebCrypto verification. It has not been applied remotely.

## Evidence
Seven Node tests PASS: valid synthetic ES256 assertion, altered evidence, wrong challenge, invalid signature, stale chain head, expired challenge, and absent SPKI. Tests use mock D1 and synthetic keys, not a registered human passkey.

## Security limitations
1. This is preflight only; no trusted atomic signed-commit endpoint or replay-safe transaction is implemented.
2. No owner enrollment, registration ceremony, independently verified identity or real authenticator interaction.
3. Challenge and credential data are read separately; commit must revalidate chain and challenge atomically.
4. The verifier does not yet reject duplicate security-critical JSON keys using an audited parser.
5. No authenticated owner session or public HTTP route has been enabled.
6. No production changes, no main merge, no production Worker or D1 modifications.

Next: implement transactionally checked signed-commit with exact intent ID and evidence, counter update and replay/concurrency tests on Preview D1, after secure credential enrollment. Production HOLD.
