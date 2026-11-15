# HITL owner passkey enrollment — preview preparation
Date: 2026-11-15
Status: BROWSER CLIENT PREPARED / SERVER REGISTRATION NOT IMPLEMENTED / OWNER CEREMONY NOT PERFORMED / PRODUCTION HOLD

Created cloudflare/hitl-passkey-enroll-preview.html as a fail-closed browser client. It does not expose a functional registration button until a same-origin HTTPS server responds with ready=true, ownerVerified=true, previewOnly=true. It expects authenticated POST /api/owner/hitl/passkey/begin and /finish, verifies RP ID equals the Preview hostname, invokes navigator.credentials.create() and submits attestationObject/clientDataJSON for server-side verification. A response state=PENDING never claims activation.

No corresponding server endpoints are routed or deployed. In particular, a bearer token alone is not an independent owner identity verification. The server must implement owner-controlled authenticated enrollment, cryptographically random expiring single-use registration challenge, WebAuthn attestation parsing and verification, RP ID hash, origin and UV, credential ID uniqueness, COSE P-256 public key extraction, SPKI conversion, verified challenge consumption, pending enrollment, independently authorized activation and recovery/revocation. Only after that should the browser be enabled on an isolated Preview Worker.

Owner must personally complete the browser passkey ceremony. No assistant-generated synthetic signature can establish a human identity. No main merge, production Worker deployment or production D1 change.
