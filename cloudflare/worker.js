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
    if (url.pathname === "/api/db-health" && request.method === "GET") {
      try {
        if (!env.DB) throw new Error("D1 binding missing");
        const row = await env.DB.prepare("SELECT COUNT(*) AS total FROM sqlite_master WHERE type = 'table' AND name = 'claims'").first();
        return Response.json({ service: "boxvia", database: "connected", claims_table: Number(row?.total) === 1 }, {
          headers: { "Cache-Control": "no-store" }
        });
      } catch (error) {
        console.error("D1 health check failed", error);
        return Response.json({ service: "boxvia", database: "unavailable" }, {
          status: 503, headers: { "Cache-Control": "no-store" }
        });
      }
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
