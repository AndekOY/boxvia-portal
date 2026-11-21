# BOXVIA — STRIPE TEST RECONCILIATION GATE

**Date:** 2026-11-21  
**Target:** isolated `boxvia-orders-sandbox` and `boxvia-bxc-sandbox` only  
**Evidence:** https://github.com/AndekOY/boxvia-portal/actions/runs/44912647070  
**Decision:** **HOLD — no provider reconciliation performed**.

## Confirmed

- `STRIPE_TEST_SECRET_KEY` secret name exists in isolated Cloudflare Worker.
- Same secret is absent from GitHub `boxvia-preview` environment.
- Read-only D1 reconciliation run `44912336090` found one Stripe attempt `created` on order `pending`, without `provider_order_id`, and one separate `verified` attempt on a `paid` order with a provider binding.
- The credential-presence check did not validate the key's scope, value, current validity or permission to query Stripe.
- Neither diagnostic called Stripe or changed D1.

## Why the unbound attempt is still blocked

No provider session ID was persisted for the `created` attempt. It is not possible to conclude from D1 alone whether Stripe accepted a prior creation request. The existing `retrieveExistingStripeTestSession` requires a session ID and cannot reconcile this record directly.

## Minimax decision

**Do not copy the Worker secret into GitHub.**  
**Do not expose a public endpoint for unrestricted Stripe lookup.**  
**Do not reissue a Checkout Session request, even with the same idempotency key, as a read-only diagnostic.**  
**Do not delete or reset the attempt.**

The least-invasive provider-side check, when independently authorized, is a *read-only* Stripe Test Mode search/list by known order metadata or client reference, restricted to the synthetic order, with no creation/capture/cancellation. Access should be mediated by an authenticated, short-lived owner-only mechanism; return only a categorical result and retain evidence privately. A negative search is not conclusive proof that a session never existed.

## Remaining authorization boundary

The user has authorized autonomous sandbox diagnostics but not changing production or creating real payments. A new provider-facing route is unnecessary until a suitable secure read-only access mechanism and provider lookup criteria are confirmed.

**Current state:** local D1 reconciliation complete; provider reconciliation UNESTABLISHED; production HOLD.
