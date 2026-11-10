// DRAFT ONLY. Server-side PayPal order read, no browser credentials or mutations.
const idPattern=/^[A-Za-z0-9-]{8,64}$/;
export async function fetchAuthenticatedPayPalOrderDraft(env,orderId,{fetchImpl=fetch}={}) {
 if(!idPattern.test(orderId||"")||!env?.PAYPAL_CLIENT_ID||!env?.PAYPAL_CLIENT_SECRET||
   !["sandbox","live"].includes(env.PAYPAL_ENV))throw new TypeError("PayPal read not configured");
 const base=env.PAYPAL_ENV==="live"?"https://api-m.paypal.com":"https://api-m.sandbox.paypal.com";
 const tokenResponse=await fetchImpl(base+"/v1/oauth2/token",{
  method:"POST",headers:{Authorization:"Basic "+btoa(env.PAYPAL_CLIENT_ID+":"+env.PAYPAL_CLIENT_SECRET),
   "Content-Type":"application/x-www-form-urlencoded"},body:"grant_type=client_credentials"
 });
 if(!tokenResponse.ok)throw new Error("PayPal OAuth unavailable");
 const token=await tokenResponse.json();
 if(typeof token.access_token!=="string"||!token.access_token)throw new Error("PayPal token missing");
 const orderResponse=await fetchImpl(base+"/v2/checkout/orders/"+orderId,{
  method:"GET",headers:{Authorization:"Bearer "+token.access_token,Accept:"application/json"}
 });
 if(!orderResponse.ok)throw new Error("PayPal order read unavailable: "+orderResponse.status);
 return orderResponse.json();
}
