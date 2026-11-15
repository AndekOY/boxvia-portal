# HITL WebAuthn decision binding - component acceptance
Date: 2026-11-15
Status: COMPONENT PASS / END-TO-END UNESTABLISHED / PRODUCTION HOLD
CI: https://github.com/AndekOY/boxvia-portal/actions/runs/43710327841
Branch: draft/hitl-site-alignment-20261115

## Verified
- Added canonical decision envelope and SHA-256 digest with case, gate, decision, evidence reference, review digest, object version and event-chain head.
- H5 requires both final report digest and report version.
- Random 32-byte WebAuthn challenge generated and challenge SHA-256 calculated, with 30-300 second bounded lifetime.
- Pure check rejects expired or consumed challenges, changed decision payload and modified event chain.
- Combined CI suite: 19 tests PASS, 0 FAIL (11 ES256 WebAuthn verifier tests and 8 decision binding tests).

## Scope limitations
- The binding module is not connected to HTTP endpoints or D1 transactions.
- There is no WebAuthn registration ceremony, credential ownership verification or owner enrollment.
- There is no atomic D1 consume+event+proof transaction. Existing SQL triggers do not establish proof of human approval.
- The challenge generator is a component only; no issued challenge is yet persisted to D1.
- The event-chain digest is derived from current database records, not an externally anchored tamper-evident audit log.
- No human-approved report or personal identity claim is established by these tests.

## Next required engineering milestone
Implement audited WebAuthn registration and browser ceremony, then server-side challenge issuance from trusted D1 records and atomic proof/event commit with DB-level enforcement. Validate concurrency and recovery. Only after independent review and actual owner enrollment may a real human release be considered.

Decision: HOLD production. No main merge or production D1 changes.
