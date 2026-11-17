# HITL Passkey lifecycle — controlled activation and revocation (Preview v0.1)

Status: **DRAFT / HOLD**. Scope: isolated Preview only. No Production changes.

## Trust boundaries
- Cloudflare Access JWT authenticates the permitted owner; WebAuthn verifies possession and user verification for the registered key.
- Enrollment creates `PENDING`. A successful login remains `PENDING`.
- An activation request requires a **fresh, one-time WebAuthn assertion** and explicit owner confirmation. The request and challenge consumption are committed atomically in Preview D1.
- `ACTIVATION_REQUESTED` is an immutable audit event, **not approval or activation**.
- No route or workflow in this change can set `ACTIVE`, authorize HITL PASS, or change Production.
- Independent approval must not be self-asserted by the same Access identity. Approval authority, evidence policy, separation of duties and recovery process require an explicit separate design and acceptance before implementing a transition.

## Proposed transition acceptance (not yet enabled)
1. Identify a specific credential by exact ID and verify ownership, RP, and `PENDING` state.
2. Validate fresh WebAuthn proof and bind it to a single activation request and credential.
3. Require an independently authenticated approver, explicit approval of the exact request, and recorded evidence reference.
4. Use an atomic conditional D1 update `PENDING → ACTIVE` and append-only audit entry. Concurrency and replay must fail closed.
5. Confirm decision authorization remains separately gated and requires per-decision signed assertion; activating a key never grants H3/H4/H5 PASS.

## Revocation design (not yet enabled)
- Explicit owner request or independent security action, with authenticated identity and evidence.
- Atomic `ACTIVE/PENDING → REVOKED` plus immutable event; no automatic reactivation.
- Deny new challenges and all HITL signed decisions from revoked credentials.
- Recovery is a new enrollment with separate approval, not restoration of revoked credentials.

## Acceptance before any real activation
- Unit + integration tests for owner impersonation, replay, duplicate approval, cross-credential mismatch, concurrent updates, stale challenge, Access session expiry, revocation and recovery.
- Remote **Preview D1 only** acceptance, negative and positive HTTP tests, independent approver identity, and explicit authorization for activation.
- Production deployment remains outside scope.

## Independent reviewer onboarding — blocked pending nomination
- Obtain a real, distinct reviewer email address from the project owner; never invent an identity or assign the owner as reviewer.
- Create a separate Cloudflare Access self-hosted application/policy for reviewer role. Do **not** add reviewer to the owner-only enrollment application. Require identity verification and exact email allowlist.
- Bind an independently verified Access JWT to that reviewer identity and compare it to the configured reviewer email. A client-supplied role or email is not authority.
- Reviewer can examine a specific immutable activation request and its evidence. Review does not automatically activate a key.
- Keep approval HTTP endpoint, credential activation and revocation disabled until reviewer nomination, policy setup, acceptance tests and explicit approval to enable.
