// BoxVia Cloudflare claim adapter. Activate only after end-to-end testing.
// Requires a rendered Turnstile widget and an explicit server-side intake gate.
(() => {
  const form = document.getElementById("claim-form");
  if (!form) return;
  const status = document.getElementById("claim-submission-status");
  const submit = form.querySelector('button[type="submit"]');
  if (!status || !submit) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
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
      const result = await response.json();
      if (!response.ok || result.ok !== true || !Number.isSafeInteger(result.id) || result.id < 1) {
        throw new Error("Submission not confirmed");
      }
      if (typeof result.access_token !== "string" || !/^[a-f0-9]{64}$/.test(result.access_token)) {
        throw new Error("Missing request access capability");
      }
      sessionStorage.setItem("boxvia-claim-" + result.id, result.access_token);
      location.assign("/evidence-check/thank-you/?request=" + encodeURIComponent(result.id));
    } catch {
      status.textContent = "Your request could not be confirmed. Please try again later. Do not pay until your request is submitted.";
      submit.disabled = false;
      if (window.turnstile && typeof window.turnstile.reset === "function") {
        window.turnstile.reset();
      }
    }
  });
})();
