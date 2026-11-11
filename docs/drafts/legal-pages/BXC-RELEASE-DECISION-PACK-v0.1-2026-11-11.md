# BXC Check a Claim — Release decision pack v0.1
Date: 2026-11-11
Status: INTERNAL / HOLD / NOT A RELEASE AUTHORIZATION
Product: Check a Claim, USD 20.00 final customer price, human-performed independent assessment, intended 24-hour execution subject to lawful commencement and operational readiness.
Provider: Andrey Ekhmenin – BoxVia (Poland).

## Scope freeze
No additional synthetic regression tests unless a specific release-blocking defect is identified. Existing GitHub Actions run #14 is green according to the owner's screenshot; this does not constitute production integration or legal sign-off. No changes to production, payment activation, or real customer email are authorized by this pack.

## Four controlled English documents
1. docs/releases/candidates/BXC-001-v0.1-EN.md — General Service Terms.
2. docs/releases/candidates/BXC-002-v0.1-EN.md — Consumer and Protected Sole Trader Schedule.
3. docs/releases/candidates/BXC-WD-001-v0.1-EN.md — Withdrawal Notice and Model Form.
4. docs/releases/candidates/BXC-PRIV-001-v0.1-EN.md — Privacy Notice.

All remain unpublished release candidates. The source map is NOT a deployable trusted contract catalog; real frozen document bytes, hashes and immutable URLs remain to be established.

## Mandatory final decisions and evidence
| Gate | Required evidence or decision | Status |
|---|---|---|
| L-01 | Owner confirms provider particulars, product scope, customer price, delivery rule and consumer-facing checkout wording | OPEN |
| L-02 | Legal review of withdrawal, optional early-performance request, proportional payment and loss-of-withdrawal-right conditions under applicable Polish/EU law | OPEN |
| P-01 | Verify actual processors, recipients, data transfers, retention, cookies, analytics, rights workflow and security controls (BXC-PRIV-002) | OPEN |
| T-01 | Freeze four EN documents; assign versions, exact SHA-256 and immutable access paths; match server-side trusted catalog and durable attachments | OPEN |
| T-02 | One real-environment sandbox walkthrough using synthetic data: consent, archive, session finalization, durable confirmation preparation, no live payment/email | OPEN |
| M-01 | Approve Gmail manual dispatch operating procedure, immutable attachment handling, dispatch evidence and lawful start conditions | OPEN |
| R-01 | Express owner authorization to publish and separately activate production/payment/email steps | NOT GIVEN |

## Operational release sequence
1. Close factual privacy inventory; edit only statements supported by evidence.
2. Complete consumer-law and protected-sole-trader legal review; freeze four EN texts.
3. Publish immutable approved legal versions and compute byte-exact hashes, then build trusted server catalog. Do not treat source map as catalog.
4. Verify one end-to-end sandbox order with synthetic identity, no real payment and no real email.
5. Prepare manual Gmail confirmation packet and dispatch evidence form; confirm who sends, when, and from which account.
6. Owner reviews a concise go/no-go record and explicitly authorizes each production action.

## Final minimum viable launch configuration (proposed, not activated)
- One product only: Check a Claim, USD 20.00 final, scope fixed in each order.
- One operator: BoxVia proprietor; human prepares and checks the deliverable.
- One confirmation channel: owner-controlled Gmail, manual send with all four accepted immutable documents attached.
- One customer-input boundary: public claim or minimal statement; no confidential attachments or special-category data through checkout by default.
- No automatic start of work merely on payment; commencement requires legally effective conditions and any required durable-medium confirmation.
- No additional regression suite; the next technical evidence is one synthetic sandbox walkthrough, not another collection of unit tests.

## Owner input needed to resolve factual release blockers
These facts cannot be established from source code alone. Do not invent or mark complete:
1. Confirm which real external services will process customer data on launch (Cloudflare, PayPal, Gmail, AI assistant, analytics if any), and whether any other services are enabled.
2. Confirm actual storage/retention and access arrangement for D1 acceptance records, customer submissions, sent Gmail and backups.
3. Confirm whether public checkout uses analytics, cookies or tracking beyond strictly necessary technical operation.

The operator can draft language and code without these confirmations, but cannot truthfully finalize GDPR disclosures or release the checkout.

## Release decision
GO: prohibited until every gate above is evidenced and owner explicitly approves.
NO-GO/HOLD: current status. No new testing program is required merely to increase test count.

## Technical translation
The controlling public legal text is English. Any Russian working translation must be checked for technical equivalence before use and must not silently change consumer obligations or legal effect.
