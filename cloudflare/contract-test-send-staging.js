// Draft-only controlled mailbox smoke test. NOT imported by production worker.
// No contract, payment, D1 row or legal acceptance is created by this route.
// An operator must invoke this function explicitly in a separate staging Worker.
const ALLOWED = "andek.oy@gmail.com";
const TEST_ID = /^BXC-MAIL-TEST-[A-Za-z0-9_-]{8,48}$/;
export async function sendControlledMailboxTest({ env, testId, recipient = ALLOWED }) {
  if (env?.BXC_MAIL_SMOKE_ENABLED !== "true" ||
      env?.BXC_MAIL_SMOKE_RECIPIENT !== ALLOWED ||
      recipient !== ALLOWED ||
      !TEST_ID.test(testId || "")) {
    throw new Error("Controlled mailbox smoke-test gate closed");
  }
  if (!env.RESEND_API_KEY || !env.CONTRACT_FROM) {
    throw new Error("Missing staging Resend credentials or verified sender");
  }
  // The smoke test deliberately does not impersonate an accepted contract.
  const body = {
    from: env.CONTRACT_FROM,
    to: [ALLOWED],
    subject: "[TEST — NO CONTRACT / NO PAYMENT] BoxVia email delivery " + testId,
    text: "BoxVia controlled technical email test. This is not an order, a contract, a payment request, or a service delivery. Test ID: " + testId
  };
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + env.RESEND_API_KEY,
      "Content-Type": "application/json",
      "Idempotency-Key": "bxc-mail-smoke-" + testId
    },
    body: JSON.stringify(body)
  });
  if (!response.ok) throw new Error("Resend smoke-test response HTTP " + response.status);
  const receipt = await response.json();
  if (typeof receipt?.id !== "string" || !receipt.id) {
    throw new Error("Resend response did not include message ID; do not automatically retry");
  }
  return { status: "provider_accepted", testId, recipient: ALLOWED, resendMessageId: receipt.id };
}
