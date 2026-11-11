# BXC — Manual PayPal verification and Gmail confirmation
Date: 2026-11-11
Status: OWNER-APPROVED OPERATING MODEL / LEGAL RELEASE HOLD

## Current decision
Until BoxVia acquires a controlled email domain, the owner will receive PayPal payment notifications, independently verify payments in PayPal, and manually send customer contract confirmations and the four legally approved documents from the owner's ordinary Gmail account. Resend is rejected for BXC; do not configure its API, DNS or sending. Historical Resend approval is superseded.

## Required operating sequence
1. Capture the customer's order and affirmative legal acknowledgments in the controlled checkout; no payment before approved contract catalog and required legal disclosures.
2. PayPal notifies the owner; an email notification alone is NOT proof of payment.
3. Independently verify merchant-side transaction ID, capture status COMPLETED, amount/currency, order linkage and no duplicate fulfillment, using PayPal merchant records or verified server capture.
4. Record formation and immutable document identifiers, versions/hashes, required consent choices, PayPal capture reference and timestamps in the BXC controlled evidence register.
5. Manually send customer a durable-medium email containing seller and order details, confirmed price/payment, four approved immutable legal document copies (not mutable links alone), withdrawal instructions, any early-performance request/acknowledgment, and contact channel; preserve evidence of dispatch, message ID and exact attached versions. Verify timing before starting performance.
6. Do not start service until the applicable legal conditions for early performance and required contract confirmation are met. Manual workflow must not promise 24-hour completion unless the owner can meet it.
7. Handle refunds, withdrawals, failed email delivery and disputes manually under applicable Polish/EU law. The buyer's statutory rights are not replaced by this protocol.

## Data processing
Ordinary Gmail is used for customer email and attachments; do not claim a Google Workspace DPA or a verified Article 28 processor agreement for consumer Gmail. GDPR Article 13 assessment remains open for actual provider roles, transfers, retention and lawful basis. PayPal has separate payment-data practices. Avoid storing sensitive case content in emails unnecessarily.

## Code status
In the isolated draft/bxc-legal-trust-v01 branch, cloudflare/worker.js no longer imports or runs Resend notification modules, and /api/service-request returns 503 rather than accepting a request that cannot be delivered. cloudflare/service-request.js and cloudflare/notifications.js were deleted from this draft branch. This does NOT remove Resend environment secrets, scheduled triggers or active functionality from a deployed Cloudflare production Worker; those require separate account-side actions and controlled deployment.

## Remaining gates
Approved legal documents, privacy facts, VAT/tax, tested manual confirmation and timing, live Cloudflare settings, and explicit owner GO. No real payment activation or production deploy approved.
