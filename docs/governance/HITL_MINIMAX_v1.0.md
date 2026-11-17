# HITL-Minimax v1.0 — owner decision attestation

Status: APPROVED DESIGN / IMPLEMENTATION IN DRAFT. Scope: isolated Preview only.

## Objective
One human — the ANDEKS methodology owner — reviews an immutable decision snapshot and confirms an explicit APPROVE or REJECT using the already registered WebAuthn Passkey and verified Cloudflare Access session.

## Minimal flow
1. Server prepares a canonical decision snapshot with case ID, gate, decision version, payload hash and chain head. The snapshot is read-only for this attestation.
2. Owner reviews exactly that snapshot and chooses APPROVE or REJECT.
3. Server generates a one-use random WebAuthn challenge bound server-side to SHA-256 of the canonical snapshot and chosen action, plus owner, credential, RP, origin and expiry.
4. Browser requests a fresh WebAuthn assertion with user verification.
5. Server validates Access JWT (owner identity, issuer, audience, signature, expiry), WebAuthn signature, UV, RP, origin, challenge, credential state and replay protections.
6. One atomic transaction consumes the challenge and appends a proof containing the canonical snapshot hash, action, credential ID, assertion digest and timestamp. A uniqueness constraint rejects duplicate attestation of the same decision version.
7. Output is an evidence record with verification status, not a qualified electronic signature or an assertion of legal eIDAS status.

## Existing state and minimal migration
- Existing enrolled credential is PENDING; prior activation request was audit-only.
- v1.0 must not pretend PENDING is ACTIVE or silently authorize existing H3/H4/H5 gates.
- The simplest future activation is owner-only, fresh WebAuthn confirmation, atomic PENDING to ACTIVE and audit trail. It must be explicitly scoped to owner decision attestation, not independent approval.
- Keep the current owner Access application; reviewer Access application is unused. No additional MFA infrastructure or second person required.
- Reuse existing WebAuthn verification primitive, isolated Preview D1 and owner page.
- Legacy H3/H4/H5 decision acceptance remains HOLD until end-to-end checks and a separate acceptance decision.

## Required acceptance
- Exact snapshot/action binding and canonical serialization.
- Wrong owner/AUD, wrong RP/origin, wrong credential, expired/replayed challenge, modified payload, duplicate decision, revoked credential, missing UV and bad signature must fail closed.
- Test D1 atomicity and no unsigned proof insertion.
- Preview only. No production Worker, production D1 or main branch changes.

## Explicitly deferred
Independent reviewer, approval hierarchy, external identity verification, legal e-signature certification, complicated key lifecycle and external trust services.

## Division of labor
Engineering and tests can proceed without operator intervention. Human action is needed only for the final interactive Passkey acceptance test and any later explicit production authorization.
