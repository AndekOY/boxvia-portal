import { handleHitlRegistry } from "./hitl-registry.js";
import { handleHitlPasskeyEnrollment } from "./hitl-passkey-enrollment-preview.js";
import { ownerPage } from "./hitl-passkey-owner-page-preview.js";
// Isolated Preview Worker: owner page and HITL API only. Never serves the public site.
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/owner/hitl/passkey") {
      if (request.method !== "GET") return new Response("Method not allowed",{status:405});
      // Reuse the verified Cloudflare Access JWT gate, not bearer authentication.
      const statusUrl=new URL("/api/owner/hitl/passkey/status",url.origin);
      const verified=await handleHitlPasskeyEnrollment(request,env,statusUrl);
      if (!verified.ok) return verified;
      return new Response(ownerPage,{status:200,headers:{
        "Content-Type":"text/html; charset=utf-8","Cache-Control":"no-store",
        "X-Content-Type-Options":"nosniff","Referrer-Policy":"no-referrer",
        "X-Frame-Options":"DENY",
        "Content-Security-Policy":"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"
      }});
    }
    if (url.pathname.startsWith("/api/owner/hitl/passkey/")) return handleHitlPasskeyEnrollment(request,env,url);
    if (url.pathname !== "/api/owner/hitl") return new Response("Not found", {status:404});
    return handleHitlRegistry(request,env,url);
  }
};
