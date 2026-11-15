import { handleHitlRegistry } from "./hitl-registry.js";
import { handleHitlPasskeyEnrollment } from "./hitl-passkey-enrollment-preview.js";
// Isolated preview test Worker: only HITL route, no site, payment, or notification handlers.
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/owner/hitl/passkey/")) return handleHitlPasskeyEnrollment(request,env,url);
    if (url.pathname !== "/api/owner/hitl") return new Response("Not found", {status:404});
    return handleHitlRegistry(request,env,url);
  }
};
