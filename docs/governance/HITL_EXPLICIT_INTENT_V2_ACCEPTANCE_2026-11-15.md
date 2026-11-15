# HITL signed intent v2 - acceptance record
Date: 2026-11-15
Status: LOCAL SQLITE PASS / WEB AUTHENTICATION UNESTABLISHED / PRODUCTION HOLD
Evidence: https://github.com/AndekOY/boxvia-portal/actions/runs/43714388597

## Change
A new preview-only migration adds hitl_events.signed_intent_id and replaces the ambiguous first-match signed-intent triggers with explicit intent selection. The guard checks exact intent ID, case, gate, pending challenge, matching credential and payload digest, expiry and active credential. An AFTER INSERT trigger consumes the selected intent and challenge and creates immutable proof in the same SQLite statement.

## Tested
Two pending H3 intents were created. H3 PASS without intent or with nonexistent intent was rejected. Selecting the second intent consumed only the second and left the first pending. Reuse of the consumed intent was rejected. H4/H5 proof pairing and final case PASS passed. These tests use synthetic credential and intent records, not actual WebAuthn signatures.

## Remaining blockers
- Browser WebAuthn registration and verification of attestation response/COSE public key.
- Trusted challenge issuance from D1, case-bound review data and live chain head.
- HTTP signed-commit endpoint verifying the actual assertion and enforcing exact payload binding.
- Authenticated enrollment and verified owner identity; user physical participation.
- Remote Preview D1 concurrency/replay acceptance and recovery controls.
- Security review of privileged DB writes, report integrity and event-chain anchoring.

This migration has NOT been applied to Preview D1 or production D1. It is a local SQL component. The bearer-only API must remain fail-closed for H3-H5 PASS in identity-HOLD Preview Worker. No production release is authorized.
