// Draft-only durable reservation BEFORE the PayPal network call.
// A reservation survives network uncertainty; never create another provider order
// until an operator or verified provider lookup resolves it.
const validSession=s=>typeof s==="string"&&/^[A-Za-z0-9_-]{6,100}$/.test(s);
const validHash=s=>typeof s==="string"&&/^[a-f0-9]{64}$/.test(s);
export async function reservePayPalCreateDraft({db,preflight}) {
 if(!db?.prepare||!preflight||!validSession(preflight.checkoutSessionId)||
    !Number.isSafeInteger(preflight.claimId)||!validHash(preflight.snapshotSha256))
   throw new TypeError("Invalid PayPal reservation");
 const requestId="bxc-"+preflight.checkoutSessionId;
 if(requestId.length>108)throw new TypeError("PayPal request ID too long");
 const result=await db.prepare(
  "INSERT OR IGNORE INTO contract_paypal_create_attempts (checkout_session_id,claim_id,request_id,snapshot_sha256,status) SELECT ?,?,?,?,'reserved' WHERE EXISTS (SELECT 1 FROM contract_checkout_sessions WHERE session_id = ? AND claim_id = ? AND status = 'accepted' AND snapshot_sha256 = ?)"
 ).bind(preflight.checkoutSessionId,preflight.claimId,requestId,preflight.snapshotSha256,
   preflight.checkoutSessionId,preflight.claimId,preflight.snapshotSha256).run();
 if(result.success!==true)throw new Error("PayPal reservation write failed");
 const row=await db.prepare(
  "SELECT claim_id,request_id,snapshot_sha256,status,paypal_order_id FROM contract_paypal_create_attempts WHERE checkout_session_id = ?"
 ).bind(preflight.checkoutSessionId).first();
 if(!row||row.claim_id!==preflight.claimId||row.request_id!==requestId||
    row.snapshot_sha256!==preflight.snapshotSha256)throw new Error("PayPal reservation conflict");
 // Even a newly reserved row is not proof that no network request has been sent.
 // Fail closed on re-entry. Caller must distinguish a newly inserted row.
 if(result.meta?.changes!==1)throw new Error("Existing PayPal attempt requires reconciliation");
 return Object.freeze({requestId,checkoutSessionId:preflight.checkoutSessionId,
  claimId:preflight.claimId,snapshotSha256:preflight.snapshotSha256});
}
export async function markPayPalAttemptLinkedDraft({db,reservation,paypalOrderId}) {
 if(!db?.prepare||!reservation||!/^[A-Za-z0-9-]{8,64}$/.test(paypalOrderId||""))
  throw new TypeError("Invalid PayPal link confirmation");
 const result=await db.prepare(
  "UPDATE contract_paypal_create_attempts SET status = 'linked',paypal_order_id = ?,updated_at = CURRENT_TIMESTAMP WHERE checkout_session_id = ? AND claim_id = ? AND request_id = ? AND snapshot_sha256 = ? AND status = 'reserved' AND paypal_order_id IS NULL AND EXISTS (SELECT 1 FROM contract_paypal_order_links WHERE checkout_session_id = ? AND claim_id = ? AND paypal_order_id = ? AND snapshot_sha256 = ?)"
 ).bind(paypalOrderId,reservation.checkoutSessionId,reservation.claimId,
   reservation.requestId,reservation.snapshotSha256,reservation.checkoutSessionId,
   reservation.claimId,paypalOrderId,reservation.snapshotSha256).run();
 if(result.meta?.changes!==1)throw new Error("PayPal link confirmation requires reconciliation");
 return {status:"linked",paypalOrderId};
}
// A provider timeout, crash, or failed DB linkage leaves 'reserved'.
// Do not infer failure from absence of paypal_order_id. No automatic retry.
