// Isolated staging-only contract confirmation persistence.
// This module is NOT imported by worker.js. Requires approved additive D1 migration.
// Caller must supply a verified, immutable, legally accepted order snapshot.
// No PII or PDF bytes are written to logs.
import { validateContractSnapshot, snapshotSha256 } from "./contract-confirmation.js";
const hex64 = /^[a-f0-9]{64}$/;
const safeKey = value => typeof value === "string" && /^contracts\/[A-Za-z0-9_-]{6,100}\/[a-f0-9]{64}\.pdf$/.test(value);
export async function registerContractConfirmation(db, rawSnapshot) {
  if (!db?.prepare) throw new TypeError("D1 binding required");
  const snapshot = validateContractSnapshot(rawSnapshot);
  const hash = await snapshotSha256(snapshot);
  // INSERT OR IGNORE avoids replacement of an already accepted contract.
  await db.prepare(
    "INSERT OR IGNORE INTO contract_confirmations (order_id, product_id, customer_email, snapshot_sha256, terms_version, schedule_version) VALUES (?, ?, ?, ?, ?, ?)"
  ).bind(snapshot.orderId, snapshot.productId, snapshot.customerEmail, hash,
    snapshot.termsVersion, snapshot.scheduleVersion).run();
  const row = await db.prepare(
    "SELECT order_id, snapshot_sha256, pdf_sha256, private_object_key, email_status FROM contract_confirmations WHERE order_id = ?"
  ).bind(snapshot.orderId).first();
  if (!row || row.snapshot_sha256 !== hash) {
    throw new Error("Order confirmation immutable snapshot conflict");
  }
  return { orderId: snapshot.orderId, snapshotSha256: hash,
    pdfReady: Boolean(row.pdf_sha256 && row.private_object_key), emailStatus: row.email_status };
}
export async function markConfirmationPdfReady(db, { orderId, snapshotHash, pdfSha256, privateObjectKey }) {
  if (!db?.prepare || !hex64.test(snapshotHash || "") || !hex64.test(pdfSha256 || "") ||
    !safeKey(privateObjectKey) || !/^[A-Za-z0-9_-]{6,100}$/.test(orderId || "")) {
    throw new TypeError("Invalid PDF persistence request");
  }
  const updated = await db.prepare(
    "UPDATE contract_confirmations SET pdf_sha256 = ?, private_object_key = ?, generated_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE order_id = ? AND snapshot_sha256 = ? AND pdf_sha256 IS NULL AND private_object_key IS NULL"
  ).bind(pdfSha256, privateObjectKey, orderId, snapshotHash).run();
  if (updated.meta?.changes === 1) return { status: "pdf_ready" };
  const row = await db.prepare(
    "SELECT snapshot_sha256, pdf_sha256, private_object_key FROM contract_confirmations WHERE order_id = ?"
  ).bind(orderId).first();
  if (row?.snapshot_sha256 === snapshotHash && row.pdf_sha256 === pdfSha256 &&
    row.private_object_key === privateObjectKey) return { status: "pdf_ready" };
  throw new Error("Confirmation PDF integrity conflict or missing order");
}
// Fail closed: no automatic retry of failed or uncertain sending states.\n// A verified reconciliation workflow must authorize any subsequent attempt.\nexport async function claimContractEmailJob(db, orderId) {
  if (!db?.prepare || !/^[A-Za-z0-9_-]{6,100}$/.test(orderId || "")) throw new TypeError("Invalid job");
  const result = await db.prepare(
    "UPDATE contract_confirmations SET email_status = 'sending', attempts = attempts + 1, updated_at = CURRENT_TIMESTAMP WHERE order_id = ? AND pdf_sha256 IS NOT NULL AND private_object_key IS NOT NULL AND attempts < 5 AND email_status = 'pending'"
  ).bind(orderId).run();
  return result.meta?.changes === 1;
}
export async function recordResendAcceptance(db, orderId, resendMessageId) {
  if (!db?.prepare || !/^[A-Za-z0-9_-]{6,100}$/.test(orderId || "") ||
    !/^[A-Za-z0-9_-]{5,150}$/.test(resendMessageId || "")) throw new TypeError("Invalid mail receipt");
  const result = await db.prepare(
    "UPDATE contract_confirmations SET email_status = 'provider_accepted', resend_message_id = ?, email_accepted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP, last_error = NULL WHERE order_id = ? AND email_status = 'sending' AND (resend_message_id IS NULL OR resend_message_id = ?)"
  ).bind(resendMessageId, orderId, resendMessageId).run();
  if (result.meta?.changes !== 1) throw new Error("Mail receipt state conflict");
}
// Webhook handling requires verified Resend signature and event-id deduplication;
// do not set delivered/bounced directly from unverified public HTTP requests.
