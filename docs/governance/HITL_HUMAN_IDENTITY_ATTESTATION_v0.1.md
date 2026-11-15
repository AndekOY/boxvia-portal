# BOXVIA HITL HUMAN IDENTITY & DECISION ATTESTATION - v0.1 DRAFT
Date: 2026-11-15
Status: DRAFT / NOT APPROVED / PRODUCTION HOLD
Authority: HITL POLICY v1.0 and HITL EXECUTION PROTOCOL v1.0

## Assurance claim and boundaries
A bearer token proves possession of a shared credential, not that Andrey Ekhmenin personally reviewed evidence or authorized release. A case's assessor label is not authentication. Automated test events labeled with the assessor name must never be described as actual human review.

The goal is to establish two distinct propositions:
A. An enrolled human-controlled authenticator approved a specific immutable decision record.
B. The human substantively reviewed evidence. A proves neither B nor the correctness of the finding. B requires a review checklist and references to the underlying reviewed evidence, subject to BCAF access controls.

## Proposed production architecture
1. Owner enrolls a phishing-resistant WebAuthn/FIDO2 passkey in an owner-controlled session. Enrollment must be approved manually and bound to an independently verified owner identity. Store credential ID, public key, RP ID, user verification policy and enrollment audit metadata. No private key leaves the authenticator.
2. Before H3, H4 or H5 PASS, server creates a one-time challenge bound to: case ID, gate, decision, exact evidence-reference digest, object/version, current event-chain head, timestamp and intended deliverable hash/version for H5. Challenges expire quickly and are single-use.
3. Browser calls navigator.credentials.get with userVerification='required' and an exact RP ID. Server verifies challenge, origin, RP ID hash, signature, UP and UV flags, credential ownership and challenge expiry. Do not trust client-reported user identity.
4. In one D1 transaction, consume challenge and append the decision with a unique assertion ID/digest, credential reference and reviewed-artifact digest. Concurrency must not allow duplicate acceptance. Preserve immutable audit history.
5. H3 includes evidence verification checklist and source/version references. H4 includes independently selected finding and limitations. H5 includes final report digest and explicit human release approval. A valid signature without the required review record cannot pass.
6. Fail closed on absent, stale, replayed, mismatched or unverifiable assertions. Recovery and authenticator replacement require a separately documented identity re-verification and two-person or equivalent owner-controlled change record.
7. Use dedicated operator authentication for GET as well; the existing bearer token may remain as a secondary layer, not as sole proof of human approval.
8. External signed timestamp/append-only export and periodic integrity checks are recommended to address privileged D1 administrator tampering; SQLite triggers alone cannot guarantee tamper evidence against database administrators.

## Security and privacy constraints
- Never log challenges, bearer tokens, assertion raw blobs, or restricted evidence.
- Keep only minimal proof metadata and hashes in D1; restricted underlying evidence stays under approved BCAF controls.
- Use strict TLS, same-origin, CSP, rate limits and anti-CSRF protections; WebAuthn assertion binds to the RP origin, not to arbitrary API clients.
- Explicitly label all synthetic CI assessments as TEST_ONLY, with a non-human test principal. Test passkeys must not be trusted for production release.
- Existing synthetic preview records labeled 'Andrey Ekhmenin' are technical tests, not authenticated approvals. Retain them as evidence but do not mix with real attestations.

## Acceptance tests before release
- Enrollment approved with real owner participation; verify attestation metadata and RP origin.
- Correct UV WebAuthn assertion approves a bound H3/H4/H5 record only once.
- Wrong origin, RP, credential, challenge, digest, case, gate or version rejected.
- Missing UV or expired/replayed challenge rejected.
- Two concurrent submissions of one assertion result in exactly one decision event.
- Report changed after approval invalidates H5 release.
- H3 review evidence absent -> HOLD, even with valid authenticator assertion.
- No synthetic or legacy bearer-only record is treated as verified human release.
- Recovery and revocation tested; audit export checked.

## Decision
Current preview SQL and HTTP PASS results prove technical gate behavior, not personal identity or substantive human review. No assertion of human-verified release is authorized until the above is implemented, independently tested and approved by the owner.
