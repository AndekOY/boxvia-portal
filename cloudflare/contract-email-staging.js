// Staging-only customer contract email adapter. Not imported by worker.js.
// Caller must verify lawful contract acceptance and PDF/annex completeness.
// Resend acceptance does NOT establish recipient mailbox delivery.
const MAX_TOTAL_BYTES = 8 * 1024 * 1024;
const validEmail = value => typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const bytesToBase64 = bytes => {
  let binary = "";
  // Chunk to avoid exceeding apply/spread limits.
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
};
export function validateContractAttachments(attachments) {
  if (!Array.isArray(attachments) || attachments.length < 2) {
    throw new TypeError("Confirmation and accepted legal annexes required");
  }
  let total = 0;
  const seen = new Set();
  return attachments.map(a => {
    if (!a || typeof a.filename !== "string" ||
      !/^[A-Za-z0-9_.-]{1,100}\.pdf$/.test(a.filename) ||
      !(a.bytes instanceof Uint8Array) || a.bytes.length < 8 ||
      String.fromCharCode(...a.bytes.subarray(0, 5)) !== "%PDF-") {
      throw new TypeError("Invalid PDF attachment");
    }
    if (seen.has(a.filename)) throw new TypeError("Duplicate attachment filename");
    seen.add(a.filename);
    total += a.bytes.length;
    if (total > MAX_TOTAL_BYTES) throw new RangeError("Attachments exceed safety limit");
    return { filename: a.filename, content: bytesToBase64(a.bytes) };
  });
}
export async function sendContractConfirmationStaging({ env, orderId, customerEmail, attachments }) {
  if (env?.BXC_CONTRACT_STAGING_ENABLED !== "true") throw new Error("Contract staging sender disabled");
  if (!env.RESEND_API_KEY || !env.CONTRACT_FROM || !validEmail(customerEmail)) {
    throw new TypeError("Contract email configuration or recipient invalid");
  }
  if (!/^[A-Za-z0-9_-]{6,100}$/.test(orderId)) throw new TypeError("Invalid order identifier");
  const files = validateContractAttachments(attachments);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + env.RESEND_API_KEY,
      "Content-Type": "application/json",
      "Idempotency-Key": "bxc-contract-staging-" + orderId
    },
    body: JSON.stringify({
      from: env.CONTRACT_FROM,
      to: [customerEmail],
      subject: "BoxVia — contract confirmation " + orderId,
      text: "Your BoxVia order confirmation and accepted contractual documents are attached. Please retain these documents. For contractual questions, use the contact shown in the confirmation.",
      attachments: files
    })
  });
  if (!response.ok) throw new Error("Resend rejected contract confirmation: HTTP " + response.status);
  const receipt = await response.json();
  if (typeof receipt?.id !== "string" || !receipt.id) throw new Error("Missing Resend acceptance identifier");
  return { status: "provider_accepted", resendMessageId: receipt.id };
}
