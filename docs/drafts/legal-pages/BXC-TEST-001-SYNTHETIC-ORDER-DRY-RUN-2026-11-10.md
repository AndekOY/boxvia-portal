# BXC-TEST-001 — Synthetic order dry-run specification and static review
Date: 2026-11-10
Status: STATIC REVIEW COMPLETE / END-TO-END EXECUTION NOT PERFORMED
Scope: BXC Check a Claim, USD 20.00, English-only, manual Gmail confirmation.

## Synthetic scenario (no real client or payment)
Order: BXC-TEST-20261110-001 (illustrative only; not a real checkout session ID)
Customer: synthetic-test@example.invalid (non-deliverable reserved domain)
Claim: Evaluate whether a synthetic claim is supported by a fictional public technical statement.
Inputs: fabricated; no personal data.
Price: USD 20.00 final; payment: NOT ATTEMPTED.
Early performance: NOT REQUESTED.
Result: no actual report; no service clock started.
Email: NOT SENT.

## Static verification against candidate legal texts
- BXC-001 v0.1 EN: states human-performed analytical service, final price, conditional 24h start and no blanket withdrawal waiver.
- BXC-002 v0.1 EN: optional unchecked early-performance control and durable confirmation obligations.
- BXC-WD-001 v0.1 EN: model form and conditional proportionate payment / loss of right.
- BXC-PRIV-001 v0.1 EN: NOT PUBLICATION-READY; unverified processors, transfers and retention remain expressly open.
- Sandbox checkout UI now presents separate optional early-performance and consequences acknowledgment controls.
- Acceptance evidence builder rejects mismatch between the two controls and checks the timestamp/version in the snapshot.
- BXC-MAIL-004 provides a manual confirmation template, but no validated final order can yet be populated from a live checkout.

## Fail-closed test cases to execute before release
1. Both early-performance checkboxes false => accepted contract can be recorded, but no automatic 24h early start.
2. Only one early-performance checkbox true => reject before accepting the contract.
3. Both true => require server-side version and timestamp evidence; not a general withdrawal waiver.
4. Wrong claim capability => reject.
5. Missing accepted document or changed document SHA-256 => reject confirmation package.
6. Missing exact scope, tax disclosure or lawful delivery trigger => block order/confirmation.
7. Wrong recipient => do not send.
8. Missing sent-message reference or document hashes => do not mark confirmation evidence complete.
9. PayPal checkout disabled => cannot create a real PayPal order.
10. No actual consumer data or payment must enter this synthetic test.

## Current blocker register
- Final legal review of English documents, including mandatory disclosures.
- Verified provider inventory, GDPR Article 13 disclosure, retention and transfer safeguards.
- Frozen approved document bytes, exact version hashes and deployable catalog.
- Manual Gmail sent-evidence storage process and retention policy.
- Sandbox checkout/payment/confirmation end-to-end test not yet executed.
- Explicit owner authorization for publication and production deployment absent.

## Disposition
RELEASE HOLD. Static review and synthetic scenario documented; **no assertion of successful runtime testing**. No email, payment, deployment or production changes.
