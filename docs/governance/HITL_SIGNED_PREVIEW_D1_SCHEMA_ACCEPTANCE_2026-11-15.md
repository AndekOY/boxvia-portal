# HITL signed schema v3 - remote Preview D1 acceptance
Date: 2026-11-15
Status: REMOTE PREVIEW SCHEMA PASS / END-TO-END WEBAUTHN UNESTABLISHED / PRODUCTION HOLD
Run: https://github.com/AndekOY/boxvia-portal/actions/runs/43715240321

## Executed
- GitHub Actions first executed local SQLite signed-guard, atomic, exact-intent and evidence-v3 regression scripts.
- The workflow allowlisted Preview D1 ID baf79e93-cbea-4786-8779-974f3b3afbcc and explicitly excluded production D1 ID 9e860945-027b-4fe9-8a43-c02206b88617.
- Applied signed-commit-guard, signed-atomic, explicit-intent-v2 and evidence-v3 migrations to Preview D1.
- Checked trigger names hitl_signed_event_guard_v3 and hitl_signed_event_consume_v2 and columns hitl_events.signed_intent_id and hitl_verified_commit_intents.evidence_ref.
- Workflow completed successfully.

## What this does not prove
- No real WebAuthn passkey was registered, no signature was verified in a live HTTP request, and no authenticated owner was established.
- No remote D1 synthetic signed-event replay or concurrency acceptance was run in this workflow.
- The existing owner API does not yet create trusted signed intents; the identity-HOLD Worker must continue blocking bearer-only H3-H5 PASS.
- The database trigger verifies matching stored values, not that those values were cryptographically authenticated.

## Next
Build server-side registration and challenge issuance, align COSE public keys with verifier, implement signed-commit HTTP flow with exact intent and review/report digest checks, then run remote Preview D1 replay/concurrency acceptance.

Production remains HOLD; no main merge, production Worker deploy, or production D1 migration.
