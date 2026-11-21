import {verifyBcdeAccess} from "./bcde-access.mjs";
import {handleBcdeOwner} from "./bcde-owner-api.mjs";
import {ownerConsoleHtml} from "./bcde-owner-console.mjs";
import {probeBcdeR2,probeBcdeSyntheticPdfPack} from "./bcde-r2-probe.mjs";
import {buildOrderTermsPdf,buildAcceptancePdf,sha256Bytes} from "./bcde-pdf.mjs";

// Dedicated, owner-only sandbox. No Stripe, PayPal, checkout or webhook routes.
// Access must protect this entire Worker before any confidential data is exposed.
const headers={
  "Cache-Control":"no-store",
  "X-Content-Type-Options":"nosniff",
  "Referrer-Policy":"no-referrer"
};
const json=(value,status)=>Response.json(value,{status,headers});
export default {
  async fetch(request,env){
    const url=new URL(request.url);
    if(!["GET","POST"].includes(request.method))return json({error:"Method not allowed"},405);
    let accessFailure="unknown";
    if(!await verifyBcdeAccess(request,env,{onFailure:reason=>{accessFailure=reason;}})){
      console.warn("BCDE Access denied",accessFailure);
      return json({error:"Unauthorized",diagnostic:accessFailure},401);
    }
    if(url.pathname==="/api/bcde/r2-probe" || url.pathname==="/api/bcde/pdf-probe"){
      if(request.method!=="POST")return json({error:"Method not allowed"},405);
      if(request.headers.get("Origin")!==url.origin || (request.headers.get("Sec-Fetch-Site") && request.headers.get("Sec-Fetch-Site")!=="same-origin"))return json({error:"Origin rejected"},403);
      if(!env?.BCDE_ARCHIVE)return json({error:"R2 binding unavailable"},503);
      try{return json(url.pathname==="/api/bcde/pdf-probe" ? await probeBcdeSyntheticPdfPack(env.BCDE_ARCHIVE,buildOrderTermsPdf,buildAcceptancePdf,sha256Bytes) : {ok:true,...await probeBcdeR2(env.BCDE_ARCHIVE)},200);}
      catch(e){console.error("BCDE R2 diagnostic failed",e?.message);return json({ok:false,error:"R2 round-trip failed"},503);}
    }
    if(url.pathname==="/" || url.pathname==="/bcde-owner"){
      if(request.method!=="GET")return json({error:"Method not allowed"},405);
      return new Response(ownerConsoleHtml,{headers:{
        ...headers,
        "Content-Type":"text/html; charset=utf-8",
        "Content-Security-Policy":"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'"
      }});
    }
    if(url.pathname.startsWith("/api/bcde/"))return handleBcdeOwner(request,env);
    return json({error:"Not found"},404);
  }
};
