import { handleServiceRequest } from "./service-request.js";

// Dedicated test Worker. No production assets, PayPal routes, or email integration.
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/health" && request.method === "GET") {
      return Response.json({ service: "boxvia-service-request-sandbox", payments: "disabled", email: "manual" });
    }
    if (url.pathname === "/api/service-request" && request.method === "POST") {
      return handleServiceRequest(request, env, url);
    }
    return Response.json({ error: "Not found" }, { status: 404 });
  }
};
