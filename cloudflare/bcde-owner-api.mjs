import {verifyBcdeAccess} from "./bcde-access.mjs";
// BCDE owner-only sandbox API. Never mount without owner authentication.
// All document data is loaded from D1; browser inputs are identifiers only.
import {getAuthorizedOrder} from "./orders-persistence.mjs";
import {getCheckoutEligibility} from "./checkout-eligibility-db.mjs";
import {getServiceDefinition} from "./service-catalog.mjs";
import {buildOrderTermsPdf,buildAcceptancePdf,sha256Bytes} from "./bcde-pdf.mjs";
import {archiveCommercialPack,downloadOwnerDocument} from "./bcde-archive.mjs";
const validId=/^[a-f0-9-]{36}$/i;
const json=(data,status=200)=>Response.json(data,{status,headers:{"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}});
export async function handleBcdeOwner(request,env){
  const url=new URL(request.url);
  if(!url.pathname.startsWith("/api/bcde/"))return null;
  if(!env?.DB||!env?.BCDE_ARCHIVE)return json({error:"BCDE not configured"},503);
  if(request.headers.get("Origin")!==url.origin)return json({error:"Origin rejected"},403);
  if(!await verifyBcdeAccess(request,env))return json({error:"Unauthorized"},401);
  if(!["POST","GET"].includes(request.method))return json({error:"Method not allowed"},405);
  const orderId=url.searchParams.get("orderId");
  if(!validId.test(orderId||""))return json({error:"Invalid order"},400);
  const record=await env.DB.prepare("SELECT id,service_code,amount_minor,currency,status FROM service_orders WHERE id = ?").bind(orderId).first();
  if(!record)return json({error:"Not found"},404);
  const order={orderId:record.id,serviceCode:record.service_code,amountMinor:record.amount_minor,currency:record.currency,status:record.status};
  const eligibility=await getCheckoutEligibility(env.DB,order);
  if(!eligibility.eligible)return json({error:"Accepted terms unavailable",reason:eligibility.reason},409);
  const evidence=await env.DB.prepare("SELECT scope_digest,terms_digest,deliverable,deadline,offer_version,offer_digest,offer_accepted_at,confidentiality_version,confidentiality_digest,confidentiality_accepted_at FROM order_terms_acceptances WHERE order_id = ?").bind(orderId).first();
  if(!evidence)return json({error:"Evidence missing"},409);
  const digest=evidence.terms_digest,version="v1";
  if(url.pathname==="/api/bcde/generate"&&request.method==="POST"){
    try{
      const service=getServiceDefinition(order.serviceCode);
      // The scope digest is evidence of agreed scope; the actual scope text must be
      // sourced from the signed commercial terms, not fabricated from the digest.
      // Fail closed until canonical full terms are persisted and renderable.
      const source=await env.DB.prepare("SELECT scope_text,terms_version FROM order_document_sources WHERE order_id = ? AND terms_digest = ?").bind(orderId,digest).first();
      if(!source||!source.scope_text||!source.terms_version)return json({error:"Canonical terms source unavailable"},409);
      const termsPdf=buildOrderTermsPdf({orderId,service:service.title,amountMinor:order.amountMinor,currency:order.currency,scope:source.scope_text,deliverable:evidence.deliverable,deadline:evidence.deadline,termsVersion:source.terms_version,offerVersion:evidence.offer_version,confidentialityVersion:evidence.confidentiality_version});
      const acceptancePdf=buildAcceptancePdf({orderId,termsDigest:digest,offerVersion:evidence.offer_version,offerDigest:evidence.offer_digest,offerAcceptedAt:evidence.offer_accepted_at,confidentialityVersion:evidence.confidentiality_version,confidentialityDigest:evidence.confidentiality_digest,confidentialityAcceptedAt:evidence.confidentiality_accepted_at});
      const archived=await archiveCommercialPack(env.BCDE_ARCHIVE,{orderId,termsPdf,acceptancePdf,termsDigest:digest,version});
      return json({archived:true,manifest:archived.manifest},201);
    }catch(e){return json({error:"Document generation unavailable",reason:e?.message==="Archive already exists"?"already_archived":"generation_failed"},409);}
  }
  if(url.pathname==="/api/bcde/download"&&request.method==="GET"){
    const fileName=url.searchParams.get("file");
    const object=await downloadOwnerDocument(env.BCDE_ARCHIVE,{orderId,termsDigest:digest,version,fileName});
    if(!object)return json({error:"Document not found"},404);
    return new Response(object.body??object,{status:200,headers:{"Content-Type":fileName.endsWith(".pdf")?"application/pdf":"application/json","Content-Disposition":'attachment; filename="'+fileName+'"',"Cache-Control":"no-store","X-Content-Type-Options":"nosniff","Referrer-Policy":"no-referrer"}});
  }
  return json({error:"Not found"},404);
}
