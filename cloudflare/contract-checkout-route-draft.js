// DRAFT ONLY: request adapter for checkout sessions and acceptance.
// Must be wired to an isolated draft Worker only after server catalog approval.
// No production route or PayPal operation is activated.
import { createCheckoutSessionDraft, hashTrustedCatalogDraft } from "./contract-checkout-session-draft.js";
import { acceptOneTimeCheckoutDraft } from "./contract-checkout-orchestrator-draft.js";
import { verifyClaimCapabilityDraft } from "./contract-checkout-server-adapter-draft.js";
const reply=(value,status=200)=>Response.json(value,{status,headers:{"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}});
const safeId=s=>typeof s==="string"&&/^[A-Za-z0-9_-]{6,100}$/.test(s);
export async function handleContractCheckoutDraft(request,env,url,{catalog}={}) {
 if(request.method!=="POST")return reply({error:"Method not allowed"},405);
 if(env.CONTRACT_CHECKOUT_DRAFT_ENABLED!=="true"||!env.DB||!catalog)return reply({error:"Not enabled"},503);
 if(request.headers.get("Origin")!==url.origin)return reply({error:"Forbidden"},403);
 if(!(request.headers.get("Content-Type")||"").toLowerCase().startsWith("application/json"))return reply({error:"Expected JSON"},415);
 if(Number(request.headers.get("Content-Length")||0)>4096)return reply({error:"Request too large"},413);
 let body;try{const raw=await request.text();if(raw.length>4096)throw Error();body=JSON.parse(raw);}catch{return reply({error:"Invalid JSON"},400);}
 if(!body||typeof body!=="object"||Array.isArray(body)||!Number.isSafeInteger(body.claim_id)||body.claim_id<1)return reply({error:"Invalid claim"},400);
 const claimId=body.claim_id,accessToken=body.access_token;
 try {
  if(url.pathname==="/api/contract-checkout/session"){
   const contractCatalogSha256=await hashTrustedCatalogDraft(catalog);
   const result=await createCheckoutSessionDraft({db:env.DB,claimId,accessToken,
    verifyClaimCapability:verifyClaimCapabilityDraft,contractCatalogSha256,
    randomBytes:n=>crypto.getRandomValues(new Uint8Array(n))});
   return reply({ok:true,session_id:result.sessionId,expires_at:result.expiresAt},201);
  }
  if(url.pathname==="/api/contract-checkout/accept"){
   if(!safeId(body.checkout_session_id))return reply({error:"Invalid session"},400);
   const result=await acceptOneTimeCheckoutDraft({db:env.DB,claimId,accessToken,
    checkoutSessionId:body.checkout_session_id,consent:body.consent,catalog});
   return reply({ok:true,status:result.status,session_id:result.checkoutSessionId,
    snapshot_sha256:result.snapshotSha256},200);
  }
  return reply({error:"Unknown endpoint"},404);
 }catch(error){
  console.error("Draft contract checkout failed",error);
  return reply({error:"Checkout unavailable or requires reconciliation"},409);
 }
}
