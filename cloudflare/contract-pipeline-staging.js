// BoxVia draft orchestration: no Worker route, no production bindings.
// Requires pre-validated legal acceptance and immutable annex PDFs.
// No Resend call occurs until an explicit staging gate is enabled.
import { validateContractSnapshot, snapshotSha256 } from "./contract-confirmation.js";
import { renderContractConfirmationA4 } from "./contract-pdf-a4.js";
import { sha256Bytes, storePrivateContractPdf, loadPrivateContractPdf } from "./contract-private-r2-staging.js";
import { registerContractConfirmation, markConfirmationPdfReady,
  claimContractEmailJob, recordResendAcceptance } from "./contract-confirmation-store-staging.js";
import { sendContractConfirmationStaging, validateContractAttachments } from "./contract-email-staging.js";
const PDF_NAME = "BoxVia_Order_Contract_Confirmation.pdf";
const requiredAnnexIds = ["terms", "schedule", "withdrawal"];
function validateAnnexSet(snapshot, annexes) {
  if (!Array.isArray(annexes)) throw new Error("Immutable annex set required");
  const accepted = snapshot.acceptedDocuments;
  if (new Set(accepted.map(d => d.id)).size !== accepted.length) throw new Error("Duplicate accepted document ID");
  if (new Set(annexes.map(a => a.id)).size !== annexes.length) throw new Error("Duplicate annex ID");
  if (accepted.length !== annexes.length) throw new Error("Accepted annex set incomplete or contains extras");
  if (requiredAnnexIds.some(id => !accepted.some(d => d.id === id) || !annexes.some(a => a.id === id))) {
    throw new Error("Complete immutable Terms, Schedule and withdrawal annexes required");
  }
  for (const annex of annexes) {
    if (!/^[A-Za-z0-9_.-]{1,100}\.pdf$/.test(annex.filename || "") ||
        !(annex.bytes instanceof Uint8Array)) throw new Error("Invalid annex PDF");
  }
}

async function renderSelectedPdf(env, snapshot, unicodeFontBytes) {
  if (env.BXC_CONTRACT_UNICODE_STAGING_ENABLED !== "true") {
    return renderContractConfirmationA4(snapshot);
  }
  if (!(unicodeFontBytes instanceof Uint8Array) || unicodeFontBytes.length < 1024) {
    throw new Error("Unicode staging requires reviewed TTF bytes");
  }
  const { renderContractConfirmationUnicodeA4 } = await import("./contract-unicode/renderer.js");
  return renderContractConfirmationUnicodeA4(snapshot, unicodeFontBytes);
}
export async function prepareContractConfirmationStaging({ env, acceptedOrder, annexes, acceptanceVerified, unicodeFontBytes }) {
  if (env?.BXC_CONTRACT_STAGING_ENABLED !== "true") throw new Error("Staging contract pipeline disabled");
  if (acceptanceVerified !== true) throw new Error("Legal contract acceptance not verified");
  if (!env.DB || !env.CONTRACT_R2) throw new Error("Staging D1 and private R2 required");
  const snapshot = validateContractSnapshot(acceptedOrder, { allowUnicode: env.BXC_CONTRACT_UNICODE_STAGING_ENABLED === "true" });
  validateAnnexSet(snapshot, annexes);
  for (const annex of annexes) {
    const reference = snapshot.acceptedDocuments.find(d => d.id === annex.id);
    if (!reference || reference.version !== annex.version || !(annex.bytes instanceof Uint8Array) ||
        await sha256Bytes(annex.bytes) !== reference.sha256) {
      throw new Error("Annex differs from accepted contract snapshot");
    }
  }
  const files = [{ filename: PDF_NAME, bytes: await renderSelectedPdf(env, snapshot, unicodeFontBytes) },
    ...annexes.map(a => ({ filename: a.filename, bytes: a.bytes }))];
  // Validate attachment size and PDF headers before writing anything.
  validateContractAttachments(files);
  const pdfBytes = files[0].bytes;
  const pdfHash = await sha256Bytes(pdfBytes);
  const registered = await registerContractConfirmation(env.DB, snapshot, { allowUnicode: env.BXC_CONTRACT_UNICODE_STAGING_ENABLED === "true" });
  const stored = await storePrivateContractPdf({
    bucket: env.CONTRACT_R2, orderId: snapshot.orderId, pdfBytes, expectedSha256: pdfHash
  });
  await markConfirmationPdfReady(env.DB, {
    orderId: snapshot.orderId, snapshotHash: registered.snapshotSha256,
    pdfSha256: stored.pdfSha256, privateObjectKey: stored.privateObjectKey
  });
  return { orderId: snapshot.orderId, pdfSha256: stored.pdfSha256,
    privateObjectKey: stored.privateObjectKey, emailStatus: registered.emailStatus };
}
export async function dispatchContractConfirmationStaging({ env, acceptedOrder, annexes, acceptanceVerified, privateObjectKey, pdfSha256 }) {
  if (env?.BXC_CONTRACT_STAGING_ENABLED !== "true" || acceptanceVerified !== true) {
    throw new Error("Staging dispatch or acceptance gate closed");
  }
  const snapshot = validateContractSnapshot(acceptedOrder, { allowUnicode: env.BXC_CONTRACT_UNICODE_STAGING_ENABLED === "true" });
  const record = await env.DB.prepare(
    "SELECT snapshot_sha256, pdf_sha256, private_object_key, email_status FROM contract_confirmations WHERE order_id = ?"
  ).bind(snapshot.orderId).first();
  const acceptedSnapshotHash = await snapshotSha256(snapshot);
  if (!record || record.snapshot_sha256 !== acceptedSnapshotHash || record.pdf_sha256 !== pdfSha256 || record.private_object_key !== privateObjectKey) {
    throw new Error("Contract PDF not registered or mismatch");
  }
  // Revalidate immutable annex bytes before dispatch. No mutable live links.
  validateAnnexSet(snapshot, annexes);
  for (const a of annexes) {
    const d = snapshot.acceptedDocuments.find(x => x.id === a.id);
    if (!d || d.version !== a.version || await sha256Bytes(a.bytes) !== d.sha256) {
      throw new Error("Accepted annex digest mismatch");
    }
  }
  const pdfBytes = await loadPrivateContractPdf({
    bucket: env.CONTRACT_R2, privateObjectKey, expectedSha256: pdfSha256
  });
  const attachments = [{ filename: PDF_NAME, bytes: pdfBytes },
    ...annexes.map(a => ({ filename: a.filename, bytes: a.bytes }))];
  validateContractAttachments(attachments);
  const locked = await claimContractEmailJob(env.DB, snapshot.orderId);
  if (!locked) return { status: "not_claimed", orderId: snapshot.orderId };
  // A failed Resend call leaves a sending lease for later controlled reconciliation.
  // Do not immediately retry without considering provider acceptance uncertainty.
  const receipt = await sendContractConfirmationStaging({
    env, orderId: snapshot.orderId, customerEmail: snapshot.customerEmail, attachments
  });
  await recordResendAcceptance(env.DB, snapshot.orderId, receipt.resendMessageId);
  return { status: "provider_accepted", orderId: snapshot.orderId,
    resendMessageId: receipt.resendMessageId };
}
