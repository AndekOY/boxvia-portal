# HITL MINIMAX signed commit coordinator acceptance
Date: 2026-11-15
Status: COMPONENT PASS / REMOTE END-TO-END UNESTABLISHED / PRODUCTION HOLD
CI: https://github.com/AndekOY/boxvia-portal/actions/runs/43719502473

## Change
Added non-routed cloudflare/hitl-signed-commit-preview.js. It invokes the server-derived signed preflight before constructing a verified intent and HITL PASS event, then submits both in a D1 batch transaction. The SQL v4 event guard requires exact intent, current last-event snapshot, evidence, pending challenge and counter validity; existing triggers consume intent/challenge, insert proof and update counter. No public HTTP endpoint is exposed.

## Tests
Synthetic ES256 signed-preflight tests plus valid coordinator batching and invalid-signature rejection passed with a mock D1 interface. Local SQLite v4 regression passed. This is not a combined real D1 end-to-end acceptance: mock batch does not prove D1 atomic behavior and local SQL uses synthetic intents.

## Blocking issues
- Owner identity and passkey enrollment are not implemented.
- Preview D1 v4 migration and SPKI migration are not yet applied remotely.
- Server-side authenticated challenge issuance and secure HTTP signed commit are not wired.
- The coordinator trusts a server-controlled origin/RP ID and caller authentication; these are not enforced inside the module.
- The assertion digest uses JSON serialization, not a standardized raw-byte canonical assertion format.
- No remote concurrency, replay or signed commit acceptance.
- Credential activation, report review and substantive human judgment remain unestablished.
- The database permits a privileged writer to forge intents; database guard alone is not proof of human verification.

PRODUCTION HOLD. No main merge, production Worker deploy or production D1 modification.
