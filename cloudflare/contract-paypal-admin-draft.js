// DRAFT ONLY: privileged, disabled-by-default reconciliation endpoint.
// No token or PayPal credentials in URL. No public route is registered.
import {reconcileLinkedPayPalIncidentDraft} from "./contract-paypal-incident-draft.js";
const response=(data,status=200)=>Response.json(data,{status,headers:{"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}});
const valid=s=>typeof s==="string"&&/^[A-Za-z0-9_-]{6,100}$/.test(s);
const orderId=s=>typeof s==="string"&&/^[A-Za-z0-9-]{8,64}$/.test(s);
export async function handlePayPalReconciliationAdminDraft(request,env,url,{reconcile=reconcileLinkedPayPalIncidentDraft}={}) {
 if(request.method!=="POST")return response({error:"Method not allowed"},405);
 if(env.PAYPAL_RECONCILIATION_ADMIN_ENABLED!=="true"||!env.DB||!env.PAYPAL_RECONCILIATION_ADMIN_TOKEN)
  return response({error:"Not enabled"},503);
 if(request.headers.get("Origin")!==url.origin)return response({error:"Forbidden"},403);
 // A dedicated secret is necessary but not sufficient for a production admin endpoint:
 // enforce Cloudflare Access identity, MFA and IP policy at the edge before enabling.
 const auth=request.headers.get("Authorization");
 if(auth!=="Bearer "+env.PAYPAL_RECONCILIATION_ADMIN_TOKEN)return response({error:"Unauthorized"},403);
 if(!(request.headers.get("Content-Type")||"").toLowerCase().startsWith("application/json"))return response({error:"Expected JSON"},415);
 if(Number(request.headers.get("Content-Length")||0)>2048)return response({error:"Too large"},413);
 let data;try{const raw=await request.text();if(raw.length>2048)throw Error();data=JSON.parse(raw);}catch{return response({error:"Invalid JSON"},400);}
 if(!valid(data?.checkout_session_id)||!orderId(data?.paypal_order_id)||!valid(data?.incident_key))
  return response({error:"Invalid parameters"},400);
 const actor="admin-token"; // Replace with authenticated Cloudflare Access identity before release.
 const audit=async(action,code)=>{
  const result=await env.DB.prepare(
   "INSERT INTO contract_paypal_reconciliation_audit (incident_key,actor_id,action,checkout_session_id,paypal_order_id,detail_code) VALUES (?,?,?,?,?,?)"
  ).bind(data.incident_key,actor,action,data.checkout_session_id,data.paypal_order_id,code).run();
  if(result.success!==true)throw Error("Audit write unavailable");
 };
 try {
  await audit("inspection_started","START");
  const outcome=await reconcile({db:env.DB,env,checkoutSessionId:data.checkout_session_id,
   candidatePayPalOrderId:data.paypal_order_id});
  await audit(outcome.closed?"closed_linked":"review_required",outcome.closed?"LINK_CONFIRMED":"MANUAL_REVIEW");
  return response({ok:true,closed:outcome.closed,status:outcome.status,reason:outcome.reason||null});
 }catch(error){
  console.error("PayPal admin reconciliation failed",error);
  try{await audit("error","RECONCILIATION_FAILED");}catch(auditError){
   console.error("PayPal reconciliation audit unavailable",auditError);
  }
  return response({error:"Reconciliation unavailable; manual review required"},503);
 }
}
