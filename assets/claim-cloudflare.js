// BoxVia Cloudflare claim adapter. Activate only after end-to-end testing.
// Requires a rendered Turnstile widget and an explicit server-side intake gate.
(() => {
  const form = document.getElementById("claim-form");
  if (!form) return;
  const status = document.getElementById("claim-submission-status");
  const submit = form.querySelector('button[type="submit"]');
  if (!status || !submit) return;

  let inFlight = false;
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (inFlight || !form.reportValidity()) return;
    const data = new FormData(form);
    const token = String(data.get("cf-turnstile-response") || "");
    if (!token) {
      status.hidden = false;
      status.textContent = "Please complete the security verification before submitting.";
      return;
    }
    const payload = {
      email: String(data.get("email") || ""),
      exact_claim: String(data.get("exact_claim") || ""),
      primary_source_url: String(data.get("primary_source_url") || ""),
      source_version_or_date: String(data.get("source_version_or_date") || ""),
      bot_field: String(data.get("bot-field") || ""),
      public_material_confirmation: data.has("public_material_confirmation"),
      terms_acknowledgement: data.has("terms_acknowledgement"),
      turnstile_token: token
    };
    inFlight = true;
    submit.disabled = true;
    status.hidden = false;
    status.textContent = "Submitting your claim...";
    try {
      const response = await fetch("/api/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(payload)
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.ok !== true || !Number.isSafeInteger(result.id) || result.id < 1) {
        const reason = typeof result.error === "string" ? result.error : "Submission not confirmed";
        throw new Error(reason);
      }
      if (typeof result.access_token !== "string" || !/^[a-f0-9]{64}$/.test(result.access_token)) {
        throw new Error("Missing request access capability");
      }
      sessionStorage.setItem("boxvia-claim-" + result.id, result.access_token);
      location.assign("/evidence-check/thank-you/?request=" + encodeURIComponent(result.id));
    } catch (error) {
      const reason = error.message === "Verification failed"
        ? "Security verification expired or was rejected. Complete the refreshed check and try again."
        : error.message === "Invalid submission" || error.message === "Invalid source URL"
          ? "Please check your claim and public source URL, then try again."
          : error.message === "Forbidden"
            ? "Please open the form directly on boxvia.andeks.workers.dev and retry."
            : "Request could not be confirmed (" + String(error.message || "network error").slice(0, 100) + "). Please try again. Do not pay until the request is confirmed.";
      status.textContent = reason;
      inFlight = false;
      submit.disabled = false;
      if (window.turnstile && typeof window.turnstile.reset === "function") {
        try { window.turnstile.reset(); } catch { /* keep the error visible */ }
      }
    }
  });
})();
