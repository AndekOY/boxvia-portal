// Staged PayPal redirect flow. NOT loaded by the live thank-you page.
// Activate only after D1 migration, Sandbox credentials and operator testing.
(() => {
  const mount = document.getElementById("boxvia-paypal-checkout");
  if (!mount) return;
  const requestId = Number(new URLSearchParams(location.search).get("request"));
  if (!Number.isSafeInteger(requestId) || requestId < 1) return;
  const token = sessionStorage.getItem("boxvia-claim-" + requestId);
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return;
  const status = document.createElement("p");
  status.setAttribute("role", "status");
  mount.append(status);
  const call = async (path, extra = {}) => {
    const response = await fetch(path, {
      method: "POST", credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ claim_id: requestId, access_token: token, ...extra })
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || "Payment service unavailable");
    return body;
  };
  const showError = () => {
    status.textContent = "Payment could not be confirmed. Do not pay again. Contact BoxVia with your PayPal receipt if you were charged.";
  };
  const params = new URLSearchParams(location.search);
  if (params.get("paypal_return") === "1") {
    status.textContent = "Checking your PayPal payment...";
    const orderId = params.get("token");
    if (!orderId || !/^[A-Za-z0-9-]{8,64}$/.test(orderId)) {
      showError(); return;
    }
    call("/api/paypal/capture-order", { order_id: orderId }).then(data => {
      if (data.payment_status === "paid") {
        status.textContent = "Payment confirmed. Your request is now queued for review.";
        sessionStorage.removeItem("boxvia-claim-" + requestId);
      } else showError();
    }).catch(showError);
    return;
  }
  if (params.get("paypal_cancel") === "1") {
    status.textContent = "PayPal checkout was cancelled. Your request remains unpaid.";
  }
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = "Continue to PayPal - $20 USD";
  button.className = "submit-btn";
  mount.append(button);
  button.addEventListener("click", async () => {
    button.disabled = true;
    status.textContent = "Preparing secure PayPal checkout...";
    try {
      const result = await call("/api/paypal/create-order");
      const target = new URL(result.approval_url);
      if (target.protocol !== "https:" || !/^(www\.)?(sandbox\.)?paypal\.com$/.test(target.hostname)) {
        throw new Error("Untrusted payment destination");
      }
      location.assign(target.href);
    } catch {
      showError();
      button.disabled = false;
    }
  });
})();
