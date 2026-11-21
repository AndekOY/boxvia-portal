// Sandbox-only customer consent. Both checkboxes must be explicit and documents
// independently owner-provisioned; no browser price, timestamps or document versions.
import {getAuthorizedOrder} from "./orders-persistence.mjs";
import {recordAcceptedTerms} from "./order-terms-recording.mjs";
import {getCheckoutEligibility} from "./checkout-eligibility-db.mjs";
const hex=bytes=>[...new Uint8Array(bytes)].map(x=>x.toString(16).padStart(2,"0")).join("");
const sha256=async value=>hex(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value)));
const response=(data,status)=>Response.json(data,{status,headers:{"Cache-Control":"no-store","X-Content-Type-Options":"nosniff","Referrer-Policy":"no-referrer"}});
export async function handleOrderConsent(request,env){
 const url=new URL(request.url);
 if(request.method!=="POST"||request.headers.get("Origin")!==url.origin||
    request.headers.get("Content-Type")?.split(";")[0].trim().toLowerCase()!=="application/json")
   return response({error:"Rejected"},403);
 if(!env.DB)return response({error:"Unavailable"},503);
 let input;
 try{
  if(Number(request.headers.get("Content-Length")||0)>2048)return response({error:"Too large"},413);
  const raw=await request.text();
  if(raw.length>2048)return response({error:"Too large"},413);
  input=JSON.parse(raw);
 }catch{return response({error:"Invalid request"},400);}
 if(!input||input.offerAccepted!==true||input.confidentialityAccepted!==true||
    typeof input.termsDigest!=="string"||!/^[a-f0-9]{64}$/.test(input.termsDigest))
   return response({error:"Explicit consent and current terms digest required"},400);
 try{
  const order=await getAuthorizedOrder(env.DB,input.orderId,input.capability);
  if(!order)return response({error:"Not found"},404);
  if(order.status!=="pending"||!["one-question-review","ai-governance-review"].includes(order.serviceCode))
   return response({error:"Order unavailable"},409);
  const source=await env.DB.prepare(
   "SELECT terms_digest,terms_version,scope_text,offer_text,offer_version,confidentiality_text,confidentiality_version,deliverable,deadline FROM order_document_sources WHERE order_id = ?"
  ).bind(order.orderId).first();
  if(!source||source.terms_digest!==input.termsDigest||
     !/^[a-f0-9]{64}$/.test(source.terms_digest)||
     ![source.terms_version,source.scope_text,source.offer_text,source.offer_version,
       source.confidentiality_text,source.confidentiality_version,source.deliverable,source.deadline]
       .every(x=>typeof x==="string"&&x.trim()))
   return response({error:"Canonical documents unavailable or changed"},409);
  // The stored digest must actually commit to the exact canonical scope text.
  if(await sha256(source.scope_text)!==source.terms_digest)
   return response({error:"Canonical document integrity mismatch"},409);
  const now=new Date().toISOString();
  const evidence={
   finalTerms:{serviceCode:order.serviceCode,amountMinor:order.amountMinor,currency:order.currency,
    scopeDigest:source.terms_digest,termsDigest:source.terms_digest,
    deliverable:source.deliverable,deadline:source.deadline,status:"confirmed"},
   offerAcceptance:{accepted:true,documentVersion:source.offer_version,
    documentDigest:await sha256(source.offer_text),acceptedAt:now,termsDigest:source.terms_digest},
   confidentialityAcceptance:{accepted:true,documentVersion:source.confidentiality_version,
    documentDigest:await sha256(source.confidentiality_text),acceptedAt:now,termsDigest:source.terms_digest}
  };
  await recordAcceptedTerms(env.DB,order,evidence);
  const verified=await getCheckoutEligibility(env.DB,order);
  if(!verified.eligible)return response({recorded:true,eligible:false},409);
  return response({recorded:true,eligible:true},201);
 }catch{
  console.error("sandbox_order_consent_unavailable");
  return response({error:"Unavailable"},503);
 }
}
