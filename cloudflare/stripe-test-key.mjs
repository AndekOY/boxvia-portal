// Test-mode Stripe API keys only. Restricted keys are preferred for Checkout.
export function isStripeTestApiKey(value) {
  return typeof value === "string" &&
    /^(?:sk_test_|rk_test_)[A-Za-z0-9_]+$/.test(value);
}
