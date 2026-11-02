// Staged Cloudflare form adapter. Do not include on the public page until
// the API, D1 binding, email provider and abuse controls have passed tests.
(() => {
  const form = document.getElementById("claim-form");
  if (!form) return;
  form.addEventListener("submit", async event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const submit = form.querySelector('button[type="submit"]');
    const status = document.getElementById("claim-submission-status");
    if (!status) return;
    const data = new FormData(form);
    const payload = {
      email: String(data.get("email") || ""),
      exact_claim: String(data.get("exact_claim") || ""),
      primary_source_url: String(data.get("primary_source_url") || ""),
      source_version_or_date: String(data.get("source_version_or_date") || ""),
      bot_field: String(data.get("bot-field") || ""),
      public_material_confirmation: data.has("public_material_confirmation"),
      terms_acknowledgement: data.has("terms_acknowledgement")
    };
    submit.disabled = true;
    status.hidden = false;
    status.textContent = "Submitting your claim...";
    try {
      const response = await fetch("/api/claim", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        credentials: "same-origin",
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error("Submission failed");
      const result = await response.json();
      if (result.ok !== true || typeof result.id !== "string") throw new Error("Unexpected response");
      // Only redirect when the API confirms the request was stored.
      location.assign("/evidence-check/thank-you/?request=" + encodeURIComponent(result.id));
    } catch {
      status.textContent = "Your request could not be confirmed. Please try again later. Do not pay until your request is submitted.";
      submit.disabled = false;
    }
  });
})();
