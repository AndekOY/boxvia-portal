// Provider-neutral, read-only authorization for initiating or reopening checkout.
// Must run after authenticating the order capability; never trusts browser prices.
import {getCheckoutEligibility} from "./checkout-eligibility-db.mjs";
const PROVIDERS=new Set(["stripe","paypal"]);
export async function authorizeCommercialPayment(db,order,provider,{recovery=false}={}){
 if(!PROVIDERS.has(provider))return Object.freeze({authorized:false,reason:"unsupported_provider"});
 if(!order || !["pending",...(recovery?["checkout"]:[])].includes(order.status))
  return Object.freeze({authorized:false,reason:"invalid_order_status"});
 const evidence=await getCheckoutEligibility(db,order);
 if(!evidence.eligible)return Object.freeze({authorized:false,reason:evidence.reason});
 return Object.freeze({authorized:true,provider,orderId:order.orderId,amountMinor:evidence.amountMinor,currency:evidence.currency,recovery});
}
