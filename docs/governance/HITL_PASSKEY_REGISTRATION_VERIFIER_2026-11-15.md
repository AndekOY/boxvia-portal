# HITL owner passkey registration verifier — preview implementation
Date: 2026-11-15
Status: COMPONENT PASS / PREVIEW DEPLOYMENT NOT DONE / REAL OWNER ENROLLMENT NOT DONE / PRODUCTION HOLD
CI: https://github.com/AndekOY/boxvia-portal/actions/runs/43720683142

## Implemented
- Strict constrained CBOR decoder and COSE ES256 public-key extraction from WebAuthn fmt=none registration, with challenge, exact origin, RP hash, UV/UP, attested credential ID, and duplicate-map-key rejection.
- Public key converted to SPKI for the existing ES256 assertion verifier.
- Preview registration gateway finish validates one-time enrollment challenge and stores new authenticator in PENDING state only; never activates it automatically.
- Added Preview-only SQL registration guard requiring consumed same-owner enrollment challenge for credential insertion.
- Preview worker source now routes /api/owner/hitl/passkey/* to Access-JWT-gated gateway. Feature is disabled unless explicit HITL_PASSKEY_ENROLLMENT_ENABLED=true and HITL_HUMAN_ATTESTATION_REQUIRED=true.
- Six synthetic registration verifier tests passed (valid, origin, challenge, UV, RP hash, CBOR duplicate key).

## Remaining gates
- Preview D1 enrollment and guard migrations are NOT applied remotely.
- Access application, JWT issuer/audience and independently verified owner email must be configured by the owner; no secrets or owner email are hardcoded.
- Preview Worker was NOT deployed with these routes, and the HTML registration page was NOT hosted on a protected same-origin URL.
- The server has not been tested with a real authenticator/browser, and no physical owner confirmation has occurred.
- Review registration verifier security with additional malformed CBOR/COSE cases and validate Access JWT session/revocation behavior before enabling.
- Credential activation requires an independent owner-identity verification process and controlled approval; never automatically promote PENDING to ACTIVE.
- The signed H3/H4/H5 flow still lacks complete authenticated browser-to-D1 acceptance.

Do not merge to main, modify production Worker or production D1. PRODUCTION HOLD.
