import { handlePayment, generateAccessToken, saveClaimAccess } from "./paypal.js";
import { deliverNotifications } from "./notifications.js";

// BoxVia site Worker. Keep static assets available while adding server-side routes.
// Claim intake stays disabled until notification, privacy and abuse controls are verified.
export default {
  async scheduled(_event, env, ctx) {
    ctx.waitUntil(deliverNotifications(env));
  },
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
    if (["/api/paypal/create-order", "/api/paypal/capture-order", "/api/claim-status"].includes(url.pathname) && request.method === "POST") {
      return handlePayment(request, env, url);
    }
    if (url.pathname === "/api/claim" && request.method === "POST") {
      const json = (data, status = 200) => Response.json(data, {
        status, headers: { "Cache-Control": "no-store" }
      });
      // Do not activate until Turnstile and the frontend integration are tested.
      if (env.CLAIM_INTAKE_ENABLED !== "true") {
        return json({ error: "Claim intake is not yet enabled" }, 503);
      }
      if (!env.DB || !env.TURNSTILE_SECRET_KEY) {
        return json({ error: "Claim service is not configured" }, 503);
      }
      if (request.headers.get("Origin") !== url.origin) return json({ error: "Forbidden" }, 403);
      if (!(request.headers.get("Content-Type") || "").toLowerCase().startsWith("application/json")) {
        return json({ error: "Expected JSON" }, 415);
      }
      if (Number(request.headers.get("Content-Length") || 0) > 12000) {
        return json({ error: "Request too large" }, 413);
      }
      let body;
      try { body = await request.json(); } catch { return json({ error: "Invalid JSON" }, 400); }
      if (!body || typeof body !== "object" || Array.isArray(body)) {
        return json({ error: "Invalid submission" }, 400);
      }
      const email = typeof body.email === "string" ? body.email.trim() : "";
      const claim = typeof body.exact_claim === "string" ? body.exact_claim.trim() : "";
      const source = typeof body.primary_source_url === "string" ? body.primary_source_url.trim() : "";
      const version = typeof body.source_version_or_date === "string" ? body.source_version_or_date.trim() : "";
      const token = typeof body.turnstile_token === "string" ? body.turnstile_token : "";
      if (body.bot_field) return json({ error: "Submission rejected" }, 400);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 ||
          claim.length < 15 || claim.length > 2000 || source.length > 2000 ||
          version.length > 160 || body.public_material_confirmation !== true ||
          body.terms_acknowledgement !== true || !token || token.length > 4096) {
        return json({ error: "Invalid submission" }, 400);
      }
      try {
        const u = new URL(source);
        if (!["https:", "http:"].includes(u.protocol) || u.username || u.password) throw new Error("Bad URL");
      } catch { return json({ error: "Invalid source URL" }, 400); }
      let verified = false;
      try {
        const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
          method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            secret: env.TURNSTILE_SECRET_KEY, response: token,
            remoteip: request.headers.get("CF-Connecting-IP") || ""
          })
        });
        verified = response.ok && (await response.json()).success === true;
      } catch (error) { console.error("Turnstile verification unavailable", error); }
      if (!verified) return json({ error: "Verification failed" }, 403);
      try {
        // Match the existing D1 schema created in the Cloudflare console.
        const accessToken = generateAccessToken();
        const result = await env.DB.prepare(
          "INSERT INTO claims (customer_email, claim_text, source_url, status, payment_status, notes) VALUES (?, ?, ?, 'new', 'pending', ?)"
        ).bind(email, claim, source, version ? "Source version/date: " + version : null).run();
        if (!result.success || !result.meta?.last_row_id) throw new Error("D1 insert not confirmed");
        try {
          await saveClaimAccess(env, result.meta.last_row_id, accessToken);
        } catch (error) {
          // Do not leave an inaccessible unpaid request in the intake queue.
          await env.DB.prepare("DELETE FROM claims WHERE id = ? AND payment_status = 'pending'")
            .bind(result.meta.last_row_id).run();
          throw error;
        }
        return json({ ok: true, id: result.meta.last_row_id, access_token: accessToken }, 201);
      } catch (error) {
        console.error("Claim storage failure", error);
        return json({ error: "Could not store request" }, 503);
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
