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
    if (url.pathname === "/api/claim" && request.method === "POST") {
      // Explicit launch gate: no public intake until email and abuse controls are configured.
      if (env.CLAIM_INTAKE_ENABLED !== "true") {
        return Response.json({ error: "Claim intake is not yet enabled" }, {
          status: 503, headers: { "Cache-Control": "no-store" }
        });
      }
      if (!env.DB || !env.RESEND_API_KEY || !env.MAIL_FROM || !env.TURNSTILE_SECRET_KEY) {
        return Response.json({ error: "Claim service is not configured" }, {
          status: 503, headers: { "Cache-Control": "no-store" }
        });
      }
      const origin = request.headers.get("Origin");
      if (origin !== url.origin) return Response.json({ error: "Forbidden" }, { status: 403 });
      if (!(request.headers.get("Content-Type") || "").toLowerCase().startsWith("application/json")) {
        return Response.json({ error: "Expected JSON" }, { status: 415 });
      }
      if (Number(request.headers.get("Content-Length") || 0) > 12000) {
        return Response.json({ error: "Request too large" }, { status: 413 });
      }
      let body;
      try { body = await request.json(); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }
      const email = String(body.email || "").trim();
      const claim = String(body.exact_claim || "").trim();
      const source = String(body.primary_source_url || "").trim();
      const version = String(body.source_version_or_date || "").trim();
      const token = String(body.turnstile_token || "");
      if (body.bot_field) return Response.json({ ok: false, error: "Submission rejected" }, { status: 400 });
      if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email) || email.length > 254 ||
          claim.length < 15 || claim.length > 2000 || source.length > 2000 ||
          version.length > 160 || body.public_material_confirmation !== true ||
          body.terms_acknowledgement !== true || !token) {
        return Response.json({ error: "Invalid submission" }, { status: 400 });
      }
      try {
        const u = new URL(source);
        if (!["https:", "http:"].includes(u.protocol) || u.username || u.password) throw new Error("Bad URL");
      } catch { return Response.json({ error: "Invalid source URL" }, { status: 400 }); }
      const verification = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
        method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ secret: env.TURNSTILE_SECRET_KEY, response: token, remoteip: request.headers.get("CF-Connecting-IP") || "" })
      });
      if (!verification.ok || !(await verification.json()).success) {
        return Response.json({ error: "Verification failed" }, { status: 403 });
      }
      const id = crypto.randomUUID();
      try {
        await env.DB.prepare("INSERT INTO claims (id,email,exact_claim,primary_source_url,source_version_or_date,status) VALUES (?,?,?,?,?,'submitted')")
          .bind(id, email, claim, source, version).run();
      } catch (error) {
        console.error("Claim storage failure", error);
        return Response.json({ error: "Could not store request" }, { status: 503 });
      }
      try {
        const mail = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: "Bearer " + env.RESEND_API_KEY, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: env.MAIL_FROM, to: ["andrzej.ekhmenin@gmail.com"],
            subject: "BoxVia Check a Claim - new submission " + id,
            text: ["Request ID: " + id, "Email: " + email, "Claim: " + claim,
              "Source: " + source, "Version/date: " + version,
              "Payment: pending manual verification"].join("\\n\\n")
          })
        });
        if (!mail.ok) throw new Error("Mail provider response " + mail.status);
        await env.DB.prepare("UPDATE claims SET notification_sent=1 WHERE id=?").bind(id).run();
      } catch (error) { console.error("Claim notification failure", id, error); }
      return Response.json({ ok: true, id }, { headers: { "Cache-Control": "no-store" } });
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
