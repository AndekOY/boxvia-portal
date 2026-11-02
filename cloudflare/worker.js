// BoxVia site Worker. Keep static assets available while adding server-side routes.
// Claim intake stays disabled until notification, privacy and abuse controls are verified.
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/health" && request.method === "GET") {
      return Response.json({ service: "boxvia", status: "ok" }, {
        headers: { "Cache-Control": "no-store" }
      });
    }
    if (url.pathname.startsWith("/api/")) {
      return Response.json({ error: "Endpoint not enabled" }, {
        status: 503,
        headers: { "Cache-Control": "no-store" }
      });
    }
    return env.ASSETS.fetch(request);
  }
};
