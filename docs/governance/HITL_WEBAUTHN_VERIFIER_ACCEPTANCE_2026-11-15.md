# HITL WebAuthn ES256 verifier - implementation evidence
Date: 2026-11-15
Status: COMPONENT PASS / END-TO-END UNESTABLISHED / PRODUCTION HOLD
CI: https://github.com/AndekOY/boxvia-portal/actions/runs/43709756335

## Completed
- ES256 (P-256) WebAuthn assertion verification primitive implemented in cloudflare/hitl-webauthn-verify.js.
- Verification includes expected challenge, RP ID hash, exact origin, credential ID, signature, UP/UV flags, expiry, active credential and signature counter checks.
- Eleven local Node 22 CI tests pass, including valid signed assertion and negative-path cases.
- Preview D1 schema for credential, challenge and proof metadata already applied.

## Explicit non-claims
- The verification primitive is not wired into the HTTP registry or any browser ceremony.
- No authentic human passkey has been enrolled.
- No human identity has been established.
- No cryptographically authenticated H3/H4/H5 event has been recorded.
- The existing bearer-only registry remains a technical demonstrator; the separate hold Worker blocks H3-H5 PASS.
- Database proof tables alone do not atomically bind WebAuthn proof and HITL event.

## Required next engineering work
1. Implement owner-approved enrollment ceremony using WebAuthn create() and server-side registration response verification, including CBOR/COSE parsing through an audited library. Bind credential to an independently verified owner and correct RP origin. Never accept client-provided public keys as proof of enrollment.
2. Implement server-created one-time challenge tied to canonical digest of case, gate, decision, evidence review, event chain head and final deliverable version/hash.
3. Implement WebAuthn get() browser ceremony and verification with this module; server must derive expected values from D1, never request body.
4. Atomically consume challenge, update sign counter, write HITL event and immutable proof in a single transaction with unique replay constraints; validate concurrency.
5. Require H3 evidence review, H4 human finding and H5 report digest; reject signature without required review artifacts.
6. Add tests for wrong credential, origin, RP, challenge, digest, replay, expiration, counter rollback, concurrent submission and report mutation.
7. Perform supervised owner enrollment and acceptance; obtain explicit approval before production.

## Security caveat
A valid WebAuthn signature demonstrates control of an enrolled authenticator with user verification. It cannot independently prove that the person read or understood the underlying evidence. Review evidence and explicit approval must remain separate controls.
