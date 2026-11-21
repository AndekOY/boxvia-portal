// PayPal sandbox API adapter. Not exposed by HTTP routes; no D1 mutations.
// Only a server-authenticated, consent-authorized order can be used to create.
// Sandbox API is hardcoded; never accept API base URLs from callers.
import {buildUnifiedPayPalOrder,inspectUnifiedPayPalCapture} from "./paypal-unified-sandbox.mjs";
const API="https://api-m.sandbox.paypal.com";
const idPattern=/^[A-Za-z0-9-]{8,64}$/;
const isSandbox=env=>env?.PAYPAL_MODE==="sandbox"&&env?.PAYPAL_UNIFIED_TEST_ENABLED==="true"&&
 typeof env.PAYPAL_SANDBOX_CLIENT_ID==="string"&&env.PAYPAL_SANDBOX_CLIENT_ID.length>10&&
 typeof env.PAYPAL_SANDBOX_CLIENT_SECRET==="string"&&env.PAYPAL_SANDBOX_CLIENT_SECRET.length>10;
async function paypalToken(env,request=fetch){
 if(!isSandbox(env))throw Error("PayPal sandbox disabled");
 const basic=btoa(env.PAYPAL_SANDBOX_CLIENT_ID+":"+env.PAYPAL_SANDBOX_CLIENT_SECRET);
 const response=await request(API+"/v1/oauth2/token",{method:"POST",headers:{
  Authorization:"Basic "+basic,"Content-Type":"application/x-www-form-urlencoded"
 },body:"grant_type=client_credentials"});
 if(!response.ok)throw Error("PayPal sandbox token unavailable");
 const body=await response.json();
 if(typeof body?.access_token!=="string"||body.access_token.length<16||
    body.token_type!=="Bearer")throw Error("Invalid PayPal sandbox token");
 return body.access_token;
}
async function api(env,path,{method="GET",body,idempotencyKey,request=fetch}={}){
 const token=await paypalToken(env,request);
 const headers={Authorization:"Bearer "+token,Accept:"application/json"};
 if(body!==undefined)headers["Content-Type"]="application/json";
 if(idempotencyKey)headers["PayPal-Request-Id"]=idempotencyKey;
 const response=await request(API+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body)});
 if(!response.ok)throw Error("PayPal sandbox API unavailable; reconcile before retry");
 return response.status===204?null:response.json();
}
export async function createUnifiedPayPalSandboxOrder(env,authorization,attemptId,origin,request=fetch){
 const payload=buildUnifiedPayPalOrder(authorization,attemptId,origin);
 const response=await api(env,"/v2/checkout/orders",{method:"POST",body:payload,
  idempotencyKey:"boxvia-"+attemptId,request});
 if(!idPattern.test(response?.id||"")||!["CREATED","PAYER_ACTION_REQUIRED","APPROVED"].includes(response.status)||
    response.intent!=="CAPTURE"||!Array.isArray(response.purchase_units)||
    response.purchase_units.length!==1)throw Error("PayPal order creation mismatch");
 const unit=response.purchase_units[0],expected=payload.purchase_units[0];
 if(unit.reference_id!==attemptId||unit.custom_id!==authorization.orderId||
    unit.amount?.currency_code!=="USD"||unit.amount?.value!==expected.amount.value)
  throw Error("PayPal order amount or identity mismatch");
 const approval=(response.links||[]).find(x=>x.rel==="payer-action"||x.rel==="approve");
 if(typeof approval?.href!=="string")throw Error("PayPal approval URL missing");
 const url=new URL(approval.href);
 if(url.protocol!=="https:"||url.hostname!=="www.sandbox.paypal.com"||
    url.port!==""||url.username!==""||url.password!==""||
    url.pathname!=="/checkoutnow"||url.searchParams.getAll("token").length!==1||
    url.searchParams.get("token")!==response.id)
    throw Error("Untrusted PayPal approval URL");
 return Object.freeze({providerOrderId:response.id,approvalUrl:url.toString()});
}
export async function captureUnifiedPayPalSandboxOrder(env,expected,request=fetch){
 if(!idPattern.test(expected?.providerOrderId||"")||!idPattern.test(expected?.attemptId||""))
  throw Error("Invalid PayPal capture binding");
 // Capture is idempotent by attempt ID; any ambiguity requires provider reconciliation.
 const providerOrder=await api(env,"/v2/checkout/orders/"+encodeURIComponent(expected.providerOrderId)+"/capture",{
  method:"POST",body:{},idempotencyKey:"boxvia-capture-"+expected.attemptId,request});
 const verified=inspectUnifiedPayPalCapture(providerOrder,expected);
 if(!verified)throw Error("PayPal capture not verified; manual reconciliation required");
 return Object.freeze({providerOrder,verified});
}
export async function reconcileUnifiedPayPalSandboxOrder(env,expected,request=fetch){
 if(!idPattern.test(expected?.providerOrderId||""))throw Error("Invalid PayPal order ID");
 const providerOrder=await api(env,"/v2/checkout/orders/"+encodeURIComponent(expected.providerOrderId),{request});
 return Object.freeze({providerOrder,verified:inspectUnifiedPayPalCapture(providerOrder,expected)});
}

/**
 * Read-only recovery of an already reserved PayPal Sandbox checkout.
 * The caller must authenticate the order capability, consent evidence and
 * the persisted attempt/provider-order binding. Never creates or captures.
 */
export async function retrieveExistingUnifiedPayPalSandboxCheckout(env,expected,request=fetch){
 if(!idPattern.test(expected?.providerOrderId||"")||
    !/^[a-f0-9-]{36}$/i.test(expected?.orderId||"")||
    !/^[a-f0-9-]{36}$/i.test(expected?.attemptId||"")||
    expected?.amountMinor!==5000||expected?.currency!=="USD")
   throw Error("Invalid PayPal checkout recovery binding");
 const order=await api(env,"/v2/checkout/orders/"+encodeURIComponent(expected.providerOrderId),{request});
 const unit=Array.isArray(order?.purchase_units)&&order.purchase_units.length===1?order.purchase_units[0]:null;
 if(order?.id!==expected.providerOrderId||order?.intent!=="CAPTURE"||
    !["CREATED","PAYER_ACTION_REQUIRED","APPROVED","COMPLETED","VOIDED"].includes(order.status)||
    unit?.reference_id!==expected.attemptId||unit?.custom_id!==expected.orderId||
    unit?.amount?.currency_code!=="USD"||unit?.amount?.value!=="50.00")
   throw Error("PayPal checkout recovery identity mismatch");
 if(!["CREATED","PAYER_ACTION_REQUIRED"].includes(order.status))
   return Object.freeze({status:order.status,checkoutUrl:null});
 const approval=(order.links||[]).find(x=>x.rel==="payer-action"||x.rel==="approve");
 if(typeof approval?.href!=="string")throw Error("PayPal checkout recovery URL unavailable");
 const url=new URL(approval.href);
 if(url.protocol!=="https:"||url.hostname!=="www.sandbox.paypal.com"||
    !url.pathname.startsWith("/checkoutnow")||
    url.port!==""||url.username!==""||url.password!==""||
    url.pathname!=="/checkoutnow"||url.searchParams.getAll("token").length!==1||
    url.searchParams.get("token")!==expected.providerOrderId)
   throw Error("Untrusted PayPal checkout recovery URL");
 return Object.freeze({status:order.status,checkoutUrl:url.toString()});
}
