const form = document.querySelector("#service-request-form");
const submit = form.querySelector("button[type=submit]");
const message = document.querySelector("#service-request-status");

form.addEventListener("submit", async event => {
  event.preventDefault();
  if (submit.disabled) return;
  if (!form.reportValidity()) return;
  const publicMaterial = form.querySelector('input[name="public_material_confirmation"]');
  const terms = form.querySelector('input[name="terms_acknowledgement"]');
  if (!publicMaterial?.checked || !terms?.checked) {
    message.textContent = "Please confirm both required statements before sending.";
    return;
  }
  const data = new FormData(form);
  if (!data.get("cf-turnstile-response")) {
    message.textContent = "Please complete the security check before sending.";
    return;
  }

  submit.disabled = true;
  message.textContent = "Sending your request…";
  let sent = false;
  try {
    const response = await fetch(form.action, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(data))
    });
    const result = await response.json();
    if (!response.ok || result.received !== true) {
      message.textContent = result.error || "Your request could not be sent.";
      return;
    }
    sent = true;
    form.reset();
    message.textContent = "Request received. BoxVia will follow up by email.";
  } catch {
    message.textContent = "Your request could not be confirmed, so please try again or contact BoxVia.";
  } finally {
    window.turnstile?.reset(form.querySelector(".cf-turnstile"));
    submit.disabled = sent;
  }
});

form.addEventListener("input", event => {
  if (event.isTrusted && event.target.matches("input:not([type=hidden]), textarea") && message.textContent.startsWith("Request received")) {
    submit.disabled = false;
    message.textContent = "";
  }
});
submit.disabled = false;
