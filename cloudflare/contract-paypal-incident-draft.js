// DRAFT ONLY. Safe closure ONLY if authenticated provider evidence agrees
// with an already existing immutable D1 link. Never repairs a missing link.
import {inspectUncertainPayPalCreateDraft} from "./contract-paypal-reconciliation-draft.js";
import {fetchAuthenticatedPayPalOrderDraft} from "./contract-paypal-provider-draft.js";
export async function reconcileLinkedPayPalIncidentDraft({
 db,env,checkoutSessionId,candidatePayPalOrderId,fetchPayPalOrder
}) {
 const inspected=await inspectUncertainPayPalCreateDraft({
  db,checkoutSessionId,candidatePayPalOrderId,
  fetchPayPalOrder:fetchPayPalOrder||((id)=>fetchAuthenticatedPayPalOrderDraft(env,id))
 });
 if(!inspected.linked)return {...inspected,closed:false,reason:"Missing D1 link requires manual investigation"};
 if(inspected.providerStatus==="COMPLETED")
  return {...inspected,closed:false,reason:"Completed payment requires capture/claim reconciliation"};
 if(!["CREATED","APPROVED","PAYER_ACTION_REQUIRED"].includes(inspected.providerStatus))
  return {...inspected,closed:false,reason:"Terminal or unsupported provider status requires manual review"};
 const result=await db.prepare(
  "UPDATE contract_paypal_create_attempts SET status = 'linked',paypal_order_id = ?,updated_at = CURRENT_TIMESTAMP WHERE checkout_session_id = ? AND claim_id = ? AND snapshot_sha256 = ? AND status IN ('reserved','review_required','linked') AND (paypal_order_id IS NULL OR paypal_order_id = ?) AND EXISTS (SELECT 1 FROM contract_paypal_order_links WHERE checkout_session_id = ? AND claim_id = ? AND snapshot_sha256 = ? AND paypal_order_id = ?)"
 ).bind(candidatePayPalOrderId,checkoutSessionId,inspected.claimId,
   (await db.prepare("SELECT snapshot_sha256 FROM contract_checkout_sessions WHERE session_id = ?").bind(checkoutSessionId).first())?.snapshot_sha256,
   candidatePayPalOrderId,checkoutSessionId,inspected.claimId,
   (await db.prepare("SELECT snapshot_sha256 FROM contract_checkout_sessions WHERE session_id = ?").bind(checkoutSessionId).first())?.snapshot_sha256,
   candidatePayPalOrderId).run();
 if(result.success!==true||result.meta?.changes!==1)throw new Error("Incident closure not confirmed");
 return {...inspected,closed:true,status:"linked"};
}
