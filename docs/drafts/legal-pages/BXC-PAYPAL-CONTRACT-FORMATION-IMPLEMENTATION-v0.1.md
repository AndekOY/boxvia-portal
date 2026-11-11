# BXC — PayPal capture / contract formation implementation decision
Date: 2026-11-11
Status: INTERNAL TECHNICAL SPEC / RELEASE HOLD
Owner decision: the paid BXC contract forms only after PayPal capture is successfully verified and linked to the accepted order.

## Existing code reviewed
- cloudflare/paypal-contract-wired-draft.js
- cloudflare/contract-checkout-orchestrator-draft.js
- cloudflare/bxc-sandbox-public/checkout/index.html
- docs/releases/candidates/BXC-001-v0.1-EN.md
- docs/drafts/legal-pages/BXC-CHECKOUT-RELEASE-COPY-v0.1-EN.md

## Verified current behavior
1. Customer expressly accepts four documents and the order in the draft checkout; a server-side accepted contract snapshot is archived before PayPal order creation.
2. PayPal create-order uses intent CAPTURE and user_action PAY_NOW.
3. Capture endpoint fetches the authoritative PayPal order and checks COMPLETED status, one purchase unit, matching claim ID, one completed capture, USD 20.00 and capture ID.
4. D1 batch updates PayPal order status and claim payment_status to paid, then queues a notification.
5. The capture response currently returns payment_status=paid, not an explicit contract_formed_at or durable-confirmation state.
6. The browser's return screen currently says only 'Sandbox payment confirmed; check fulfillment queue.'

## Required semantic separation
- PRE_CONTRACT_ACCEPTED: four exact documents and affirmative choices recorded; no paid contract yet.
- PAYPAL_PENDING: PayPal order created / payer redirected; no paid contract yet.
- PAYMENT_CAPTURED_VERIFIED: PayPal reports completed capture with the accepted order linkage and exact amount.
- CONTRACT_FORMED: BoxVia has durably recorded the verified capture linked to the archived acceptance snapshot and the agreed order. Use the verified capture timestamp if reliable, otherwise explicitly record server reconciliation time and preserve both. Never silently substitute the earlier acceptance timestamp.
- CONFIRMATION_PENDING / CONFIRMATION_DISPATCHED: Gmail durable-medium contract confirmation with four full accepted attachments; dispatch evidence is distinct from delivery.
- PERFORMANCE_ELIGIBLE: payment, lawful input, applicable early-performance conditions, and any required prior durable confirmation are satisfied. This state is not implied by payment or contract formation.

## Release-blocking implementation gaps
A. Persist a unique, immutable association among claim_id, checkout_session_id, acceptance snapshot digest, PayPal order ID, capture ID, verified amount/currency and contract-formed timestamp. A claim-level paid flag alone is not a complete formation record.
B. Make capture reconciliation idempotent without treating a stale or mismatched claim/payment record as a successful formation. On uncertainty: payment reconciliation HOLD, never issue a second charge or reopen acceptance.
C. Add a confirmation queue/operating register entry that references the formed contract and four document hashes; manual Gmail dispatch must be separately evidenced.
D. Ensure any fulfillment trigger checks confirmation and withdrawal/early-performance conditions, not just payment_status=paid.
E. Update checkout copy so pre-PayPal acceptance is not described as an already formed contract; retain a clear payment-obligation statement.
F. Have Polish/EU consumer-law reviewer validate that this formation point and customer-visible language are legally coherent.

## Implementation order — no additional generic tests
1. Inspect existing D1 schema and capture linkage before selecting migration columns/tables.
2. Add durable contract formation linkage in draft branch only, without touching live worker.
3. Update capture response and checkout status copy to distinguish verified payment from formed contract and permission to start.
4. Run one targeted sandbox end-to-end walkthrough with synthetic data after legal versions and hashes are approved.
5. Request explicit owner approval before any production changes.

## No-go
This document is not proof of implemented contract formation persistence, legal approval, Gmail dispatch, payment activation or deployment.
