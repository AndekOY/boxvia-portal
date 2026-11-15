# HITL signed atomic SQL prototype acceptance
Date: 2026-11-15
Status: LOCAL SQL COMPONENT PASS / HUMAN AUTHENTICATION UNESTABLISHED / PRODUCTION HOLD
CI: https://github.com/AndekOY/boxvia-portal/actions/runs/43714014009

## Observed
- SQLite local tests passed for unsigned H3 rejection, single-event intent/challenge consumption and proof insertion, replay rejection, H4/H5 completion, immutable proof.
- The AFTER INSERT trigger executes in the same SQLite statement as the HITL event insert. An abort rolls back changes to that statement.
- Tests use fabricated ACTIVE credential and intent fixtures; they DO NOT verify WebAuthn signatures or attest a human.

## Blocking issues before any preview deployment
1. Multiple eligible pending intents for one case/gate are ambiguous; the trigger selects the first, not an explicit verified challenge ID.
2. The current intent table can be written directly by privileged database clients. An intent row is not proof of a verified WebAuthn signature.
3. No server-side enrollment ceremony, challenge issuance endpoint, authenticated session or owner identity binding.
4. No end-to-end API transaction enforcing current event-chain head, payload digest, reviewed evidence and exact report version at commit time.
5. No replay/concurrency acceptance on remote Preview D1.
6. The signed-event trigger does not prove that an assertion and its intent correspond to the event's evidence_ref. Bind an explicit intent ID and payload hash to the event before release.
7. The earlier preview schema stores public_key_cose, whereas the verifier imports SPKI; audited COSE conversion and registration verification are required.

## Decision
Do not apply this prototype migration to production or describe any synthetic PASS as human approval. Remain HOLD. Next design revision should remove ambiguous intent selection, bind event to one explicit challenge, and validate signature before atomic commit.
