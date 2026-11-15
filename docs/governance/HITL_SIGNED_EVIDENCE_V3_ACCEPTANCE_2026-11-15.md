# HITL signed evidence v3 - local acceptance
Date: 2026-11-15
Status: LOCAL SQLITE PASS / END-TO-END WEB AUTHENTICATION UNESTABLISHED / PRODUCTION HOLD
CI: https://github.com/AndekOY/boxvia-portal/actions/runs/43714865416

## Change
The preview-only v3 migration adds hitl_verified_commit_intents.evidence_ref and replaces the v2 guard. For H3-H5 PASS, the event must supply an explicit signed_intent_id, and the event evidence_ref must exactly match the pending intent's evidence_ref. The v2 atomic AFTER INSERT trigger remains in effect, consuming the exact challenge and writing a linked proof.

## Local tests
Synthetic H3, H4 and H5 PASS with altered evidence_ref rejected. H3 without intent rejected. Exact intent and matching evidence allowed. Reuse rejected. Final case status PASS and exactly three proof rows verified. These tests do not contain actual WebAuthn assertions.

## Unresolved
- Server must verify actual WebAuthn assertion and bind its challenge to the same canonical review and report digest before creating any intent.
- Browser enrollment, credential public-key registration, origin/RP validation and human owner verification are not implemented.
- v3 SQL does not check event note, review digest, report digest, object version or chain head at insert time; these remain server-side design obligations.
- No remote Preview D1 v2/v3 migration or end-to-end HTTP signed commit has occurred.
- DB privileged writes could forge intent records; signing verification is external to D1.

Production release remains HOLD; do not merge to main.
