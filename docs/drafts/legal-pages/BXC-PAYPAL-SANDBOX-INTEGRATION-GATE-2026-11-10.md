# BXC — isolated PayPal Sandbox integration gate (draft)

Status: NOT EXECUTED against PayPal Sandbox or a real isolated D1. This is an execution protocol, not evidence of completion.

## Safety boundary
- Branch: `draft/bxc-legal-trust-v01`; do not import draft handlers into production `worker.js`.
- Use a separate Cloudflare Worker, a newly created **isolated D1 database**, and PayPal **Sandbox** client credentials only.
- Explicitly set `PAYPAL_ENV=sandbox`; never supply live credentials or production DB bindings.
- No real buyer, real payment, production email, production R2, or live PayPal capture.
- Do not apply draft migrations to production. Do not store client secrets or access tokens in Git.
- A green GitHub Actions run proves mocked/unit checks only, not provider/D1 integration.

## Preconditions (must be evidenced before execution)
1. Independent staging Worker route and bindings, with proof that its D1 ID differs from production.
2. Applied and reviewed staging schema for claims, claim_access, paypal_orders, outbox, contract sessions, acceptance archive, links, and create attempts.
3. Trusted, immutable versioned service catalog and annex digests; explicit synthetic customer identity and acceptance evidence.
4. Sandbox-only credentials, PayPal sandbox payer account, and a callback URL owned by staging.
5. Explicit operator approval of test capture and a rollback/disposal plan.

## Execution matrix
| ID | Action | Expected evidence |
| --- | --- | --- |
| S01 | Submit synthetic claim | One claim, pending, capability hash; no payment |
| S02 | Create checkout session with trusted catalog | One open session, server-generated ID, digest and expiry |
| S03 | Accept consent and archive exact documents | Immutable archive and accepted session; matching SHA-256 |
| S04 | Create PayPal Sandbox Order | Durable reserved attempt before network call; provider order ID; one-to-one D1 link |
| S05 | Approve with sandbox payer and capture | PayPal order/capture COMPLETED, USD 20.00, matching claim ID |
| S06 | Read claim status | paid only after verified capture and D1 commit |
| S07 | Retry capture and create | No duplicate capture, order, claim payment, or outbox |
| S08 | Inject D1 link failure after provider create | Reserved attempt retained, no second provider create, operator reconciliation |
| S09 | Inject interrupted acceptance | consuming held; only verified archive permits finalization |
| S10 | Tamper amount, claim ID, session, archive | Fail closed; no paid state |
| S11 | Simulate notification outage | Paid state remains authoritative; outbox incident visible |
| S12 | Verify provider and D1 logs | Sanitized evidence, timestamps, IDs, no secrets or PII in report |

## Acceptance criteria
- Every S01–S12 has a timestamp, expected/actual result, redacted evidence, and PASS/FAIL.
- No unlinked PayPal order is capturable; no legacy unlinked order can bypass contract gate.
- No ambiguous provider-create response triggers a second create.
- All schema changes and tests occur in isolated resources.
- Payment and legal release are separate decisions. Production remains blocked until legal, tax, GDPR, and deployment approvals.

## Current findings
- GitHub Actions #107 was reported green for commit `3acab9a`; this is mocked/unit coverage.
- `paypal-contract-wired-draft.js` still uses fixed USD 20.00 Check a Claim values; the wider three-product catalog is not yet covered by that payment handler.
- `contract-checkout-orchestrator-draft.js` explicitly documents a non-atomic multi-step acceptance; interrupted states require reconciliation.
- This document does not assert access to a PayPal Sandbox account, a deployed staging Worker, or an isolated D1.
