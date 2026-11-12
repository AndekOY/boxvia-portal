import { handlePayment, generateAccessToken, saveClaimAccess } from "./paypal.js";
import { handleServiceRequest } from "./service-request.js";
import { deliverNotifications } from "./notifications.js";

// BoxVia site Worker. Keep static assets available while adding server-side routes.
// Claim intake stays disabled until notification, privacy and abuse controls are verified.
export default {
  async scheduled(_event, env, ctx) {
    ctx.waitUntil(deliverNotifications(env));
  },
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/service-request" && request.method === "POST") {
      return handleServiceRequest(request, env, url);
    }
    if (url.pathname === "/api/owner-notifications") {
      const reply = (body, status = 200) => Response.json(body, {
        status, headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" }
      });
      if (request.method !== "GET") return reply({ error: "Method not allowed" }, 405);
      const secret = env.OWNER_NOTIFICATION_TOKEN;
      const authorization = request.headers.get("Authorization") || "";
      const supplied = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
      if (typeof secret !== "string" || secret.length < 32) {
        return reply({ error: "Notification API not configured" }, 503);
      }
      // Compare digests, not secret strings; never include credentials in logs or URLs.
      const digest = async value => new Uint8Array(await crypto.subtle.digest(
        "SHA-256", new TextEncoder().encode(value)
      ));
      const expected = await digest(secret);
      const actual = await digest(supplied);
      let difference = 0;
      for (let i = 0; i < expected.length; i++) difference |= expected[i] ^ actual[i];
      if (!supplied || difference !== 0) return reply({ error: "Unauthorized" }, 401);
      if (!env.DB) return reply({ error: "Database unavailable" }, 503);
      const parseCursor = name => {
        const value = url.searchParams.get(name) ?? "0";
        if (!/^(0|[1-9][0-9]{0,12})$/.test(value)) return null;
        const parsed = Number(value);
        return Number.isSafeInteger(parsed) ? parsed : null;
      };
      const claimsAfter = parseCursor("claims_after");
      const servicesAfter = parseCursor("services_after");
      if (claimsAfter === null || servicesAfter === null) {
        return reply({ error: "Invalid cursor" }, 400);
      }
      try {
        // Only non-personal queue metadata; never expose customer email, claim text or URLs.
        const claims = await env.DB.prepare(
          "SELECT id FROM claims WHERE id > ? ORDER BY id ASC LIMIT 100"
        ).bind(claimsAfter).all();
        const services = await env.DB.prepare(
          "SELECT id, service_code FROM service_requests WHERE id > ? ORDER BY id ASC LIMIT 100"
        ).bind(servicesAfter).all();
        return reply({
          claims: (claims.results || []).map(row => ({ id: row.id })),
          services: (services.results || []).map(row => ({ id: row.id, code: row.service_code }))
        });
      } catch (error) {
        console.error("Owner notification query failed");
        return reply({ error: "Notification data unavailable" }, 503);
      }
    }
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
