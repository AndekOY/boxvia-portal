import {verifyBcdeAccess} from "./bcde-access.mjs";
import {handleBcdeOwner} from "./bcde-owner-api.mjs";
import {ownerConsoleHtml} from "./bcde-owner-console.mjs";

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
    if(!await verifyBcdeAccess(request,env))return json({error:"Unauthorized"},401);
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
