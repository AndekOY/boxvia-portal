// BXC SANDBOX ONLY. Separate Worker entrypoint; never import into production worker.js.
// Requires a reviewed, immutable BXC_CONTRACT_CATALOG_JSON secret/variable.
// No PayPal credentials are accepted from the browser.
import { createCheckoutSessionDraft, hashTrustedCatalogDraft } from "./contract-checkout-session-draft.js";
import { verifyClaimCapabilityDraft } from "./contract-checkout-server-adapter-draft.js";
import { acceptOneTimeCheckoutDraft } from "./contract-checkout-orchestrator-draft.js";
import { handlePayment } from "./paypal-contract-wired-draft.js";
import { validateContractSnapshot } from "./contract-confirmation.js";
const reply=(value,status=200)=>Response.json(value,{status,headers:{"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}});

function catalogFromEnv(env){
 if(typeof env.BXC_CONTRACT_CATALOG_JSON!=="string")throw Error("Trusted contract catalog missing");
 const c=JSON.parse(env.BXC_CONTRACT_CATALOG_JSON);
 if(!c||Array.isArray(c)||c.productId!=="check-a-claim"||c.totalPrice!=="20.00"||
    c.currency!=="USD"||c.reportLanguage!=="English"||
    !Array.isArray(c.acceptedDocuments)||c.acceptedDocuments.length!==4||
    !["terms","schedule","withdrawal","privacy"].every(id=>c.acceptedDocuments.some(d=>d.id===id&&/^[a-f0-9]{64}$/.test(d.sha256))))
  throw Error("Trusted contract catalog incomplete");
 // Check the complete legal snapshot shape before any checkout session is issued.
 validateContractSnapshot({...c,orderId:"BXC_CATALOG_PREFLIGHT",customerEmail:"sandbox@example.invalid",
   acceptedAt:"2026-11-10T00:00:00.000Z"},{allowUnicode:true});
 if(!c.documentUrls||typeof c.documentUrls!=="object"||
   !["terms","schedule","withdrawal","privacy"].every(id=>{
     try{const u=new URL(c.documentUrls[id]);return u.protocol==="https:"&&u.username===""&&u.password===""}
     catch{return false}
   }))throw Error("Reviewed document URLs missing");
 return c;
}
async function readBody(request){
 if(!(request.headers.get("Content-Type")||"").toLowerCase().startsWith("application/json")||
    Number(request.headers.get("Content-Length")||0)>8192)return null;
 const raw=await request.text();
 if(raw.length>8192)return null;
 try{const b=JSON.parse(raw);return b&&typeof b==="object"&&!Array.isArray(b)?b:null}catch{return null}
}
export default {
 async fetch(request,env){
  const url=new URL(request.url);
  if(url.pathname==="/api/health")return reply({service:"bxc-sandbox",status:"ok"});
  if(env.BXC_SANDBOX_ONLY!=="true"||env.PAYPAL_ENV!=="sandbox"||!env.DB)
   return reply({error:"Sandbox environment not configured"},503);
  if(request.method==="GET"&&url.pathname==="/api/bxc/catalog"){
   try{
    const c=catalogFromEnv(env);
    return reply({
     productId:c.productId,totalPrice:c.totalPrice,currency:c.currency,
     providerName:c.providerName,providerContact:c.providerContact,
     taxDisclosure:c.taxDisclosure,deliveryRule:c.deliveryRule,
     documents:[
      ...c.acceptedDocuments.map(d=>({id:d.id,label:({terms:"Terms",schedule:"Service schedule",withdrawal:"Withdrawal notice",privacy:"Privacy notice"})[d.id],
       version:d.version,sha256:d.sha256,url:c.documentUrls[d.id]}))
     ]
    });
   }catch(error){console.error("BXC catalog not ready",error);return reply({error:"Reviewed contract catalog unavailable"},503)}
  }
  if(request.method==="GET"&&url.pathname.startsWith("/checkout"))
   return env.ASSETS.fetch(request);
  if(request.method!=="POST"||request.headers.get("Origin")!==url.origin)
   return reply({error:"Forbidden"},403);
  if(["/api/paypal/create-order","/api/paypal/capture-order","/api/claim-status"].includes(url.pathname))
   return handlePayment(request,env,url);
  if(!["/api/bxc/checkout-session","/api/bxc/accept"].includes(url.pathname))
   return reply({error:"Endpoint unavailable"},404);
  const body=await readBody(request);
  if(!body||!Number.isSafeInteger(body.claim_id)||body.claim_id<1)
   return reply({error:"Invalid request"},400);
  try{
   const catalog=catalogFromEnv(env);
   if(!await verifyClaimCapabilityDraft(env.DB,body.claim_id,body.access_token))
    return reply({error:"Not authorized"},403);
   if(url.pathname==="/api/bxc/checkout-session"){
    const created=await createCheckoutSessionDraft({
     db:env.DB,claimId:body.claim_id,accessToken:body.access_token,
     verifyClaimCapability:verifyClaimCapabilityDraft,
     contractCatalogSha256:await hashTrustedCatalogDraft(catalog),
     randomBytes:n=>crypto.getRandomValues(new Uint8Array(n))
    });
    return reply({checkout_session_id:created.sessionId,expires_at:created.expiresAt},201);
   }
   if(typeof body.checkout_session_id!=="string"||!body.consent)
    return reply({error:"Invalid acceptance"},400);
   const accepted=await acceptOneTimeCheckoutDraft({
    db:env.DB,claimId:body.claim_id,accessToken:body.access_token,
    checkoutSessionId:body.checkout_session_id,consent:body.consent,catalog
   });
   return reply({checkout_session_id:accepted.checkoutSessionId,status:accepted.status},200);
  }catch(error){
   console.error("BXC sandbox checkout unavailable",error);
   return reply({error:"Checkout unavailable; review required"},409);
  }
 }
};
