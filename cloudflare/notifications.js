// Scheduled BoxVia paid-claim notifications via Resend.
// Required: RESEND_API_KEY secret, NOTIFICATION_FROM and NOTIFICATION_TO variables.
// No emails are sent until all three are configured and a Cron Trigger is enabled.
// A sending lease older than 10 minutes can be retried with the same Resend idempotency key.
const configured = env => Boolean(env.DB && env.RESEND_API_KEY && env.NOTIFICATION_FROM && env.NOTIFICATION_TO);
const safeText = value => String(value ?? "").replace(/[\r\n]/g, " ").slice(0, 300);
export async function deliverNotifications(env) {
  if (!configured(env)) {
    console.log("Notification delivery disabled: missing configuration");
    return { processed: 0, configured: false };
  }
  const rows = await env.DB.prepare(
    "SELECT o.id, o.claim_id, c.customer_email FROM notification_outbox o JOIN claims c ON c.id = o.claim_id WHERE (o.status IN ('pending','failed') OR (o.status = 'sending' AND o.updated_at < datetime('now', '-10 minutes'))) AND o.attempts < 5 AND c.payment_status = 'paid' AND EXISTS (SELECT 1 FROM paypal_orders p WHERE p.claim_id = c.id AND p.status = 'COMPLETED' AND p.capture_id IS NOT NULL AND p.amount = '20.00' AND p.currency = 'USD') ORDER BY o.created_at ASC LIMIT 10"
  ).all();
  let processed = 0;
  for (const row of rows.results || []) {
    const locked = await env.DB.prepare(
      "UPDATE notification_outbox SET status = 'sending', attempts = attempts + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND (status IN ('pending','failed') OR (status = 'sending' AND updated_at < datetime('now', '-10 minutes'))) AND attempts < 5"
    ).bind(row.id).run();
    if (locked.meta?.changes !== 1) continue;
    processed++;
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + env.RESEND_API_KEY,
          "Content-Type": "application/json",
          "Idempotency-Key": "boxvia-claim-paid-" + row.claim_id
        },
        body: JSON.stringify({
          from: env.NOTIFICATION_FROM,
          to: [env.NOTIFICATION_TO],
          subject: "BoxVia: paid claim #" + row.claim_id,
          text: "A verified $20 payment was recorded for BoxVia claim #" + row.claim_id +
            ".\nCustomer email: " + safeText(row.customer_email) +
            "\nReview the request in Cloudflare D1. Do not reply to this automated notice."
        })
      });
      if (!response.ok) throw new Error("Mail provider HTTP " + response.status);
      const receipt = await response.json();
      if (!receipt?.id) throw new Error("Mail provider did not confirm acceptance");
      await env.DB.prepare(
        "UPDATE notification_outbox SET status = 'sent', sent_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP, last_error = NULL WHERE id = ? AND status = 'sending'"
      ).bind(row.id).run();
    } catch (error) {
      await env.DB.prepare(
        "UPDATE notification_outbox SET status = 'failed', last_error = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status = 'sending'"
      ).bind(safeText(error.message), row.id).run();
      console.error("Notification delivery failed for claim", row.claim_id, error);
    }
  }
  return { processed, configured: true };
}
