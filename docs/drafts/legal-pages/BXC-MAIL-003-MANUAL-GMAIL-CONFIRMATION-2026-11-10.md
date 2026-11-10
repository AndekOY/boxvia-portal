# BXC-MAIL-003 — Owner decision: manual Gmail contract confirmation
Date: 2026-11-10
Status: OWNER-APPROVED INTERIM DELIVERY MODEL / RELEASE HOLD
Scope: BXC Check a Claim, USD 20 final
Sender: andrzej.ekhmenin@gmail.com
Public contract language: English only

## Decision
For the initial operational phase, BoxVia will send contract confirmations **manually** from the owner-controlled Gmail account. Automated Resend and Gmail API contract dispatch are deferred. No Google Cloud OAuth setup, API credentials, sender-domain purchase, or new mail service is required for this phase.

## Manual fulfillment control
1. A paid order is not a substitute for recorded acceptance. Confirm that the accepted contract snapshot and exact approved versions of Terms, Consumer Schedule, Withdrawal Notice and Privacy Notice are available.
2. Prepare a customer-specific English confirmation with order ID, acceptance date/time, provider contact, exact scope, USD 20 final price and applicable tax disclosure, performance/withdrawal status, delivery channel and the versions of all applicable documents.
3. Attach **complete immutable copies** of the accepted Terms, Schedule and Withdrawal Notice, plus the applicable Privacy Notice. Do not replace attachments with changeable web links alone. Verify attachment version and hash against the order record.
4. Send manually from andrzej.ekhmenin@gmail.com to the customer email on the verified order. Double-check the recipient and avoid including other customers' data.
5. Record the sending timestamp, recipient, Gmail sent-message reference, attachment names and SHA-256 hashes in the restricted order evidence record. Preserve a copy of the sent message and attachments as appropriate under the approved retention policy. A Sent-folder entry is evidence of dispatch, not necessarily delivery.
6. Where legally required, send durable-medium confirmation **before beginning service performance**. The 24-hour service promise does not override consumer withdrawal rules or early-performance conditions.
7. If any accepted document, recipient, early-performance evidence, tax disclosure or delivery proof is missing, stop and resolve before starting performance.

## Not authorized by this decision
- No automatic email sending, Gmail API or Resend integration.
- No real-client processing in sandbox.
- No release of unapproved EN legal texts or placeholder catalog.
- No PayPal activation, production deployment, or removal of BXC HOLD.
- No claim of GDPR certification; full BXC GDPR Compliance Protocol remains deferred.

## Next release gates
- Final legal review and frozen public EN documents.
- Verified checkout acceptance and payment evidence.
- A controlled manual send-and-log procedure with an owner-approved retention/access rule.
- Synthetic dry run of confirmation assembly and attachment hash checks.
- Explicit owner authorization for release.
