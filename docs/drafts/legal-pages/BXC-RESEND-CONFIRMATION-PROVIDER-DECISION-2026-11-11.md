# SUPERSEDED — NOT ACTIVE

This Resend decision was revoked by the owner on 2026-11-11. The content below is historical only. Do not implement, activate or cite it as current BXC policy. Current decision: manual Gmail confirmation after independent PayPal payment verification. Resend removed from the draft branch. No production deployment was performed.

---

# BXC — Resend confirmation provider decision
Date: 2026-11-11
Status: OWNER-APPROVED TARGET ARCHITECTURE / NOT ACTIVATED / LEGAL HOLD

## Decision
Owner explicitly approves Resend as the target email delivery provider for BXC customer contract confirmations. Ordinary consumer Gmail is no longer the intended primary contract confirmation channel. This approval is **not** approval of production sending, real payments, legal publication or contract release.

## Scope and boundaries
1. Resend: send the durable-medium contract confirmation to the customer, including the agreed order details and four immutable approved document copies/attachments, only after verified PayPal capture and contract formation; honor any legal timing requirements for confirmation and start of service.
2. Cloudflare D1: record verified payment, document versions and SHA-256, acceptance/early-performance choices, confirmation dispatch status, provider message ID and timestamps; implement appropriate minimization, access and retention.
3. Gmail: ordinary correspondence only; do not rely on it as the primary contract confirmation channel or on a Google Workspace DPA.
4. Existing code cloudflare/service-request.js uses Resend for service-request intake and cloudflare/notifications.js sends internal paid-claim notifications; **neither currently proves a working BXC customer contract-confirmation dispatch**.
5. Keep the old Gmail sandbox adapter isolated and disabled. Do not silently switch production or expose secrets.

## Mandatory gates before release
- Verify Resend account ownership, sender domain/address, applicable DPA and subprocessor/transfer terms, and customer-facing recipient data flows.
- Verify operational retention, deletion, logs, delivery records, bounce handling and suppression lists.
- Implement and offline-test a fail-closed BXC-specific Resend confirmation adapter, four approved immutable documents, idempotency and evidence persistence. Provider acceptance does not prove inbox delivery.
- Conduct a synthetic sandbox end-to-end test and confirm timing of the durable-medium confirmation; no real customers or live payments.
- Complete GDPR Article 13 privacy notice with actual provider facts and legal review; finalize consumer-law and tax gates.
- Require explicit owner release GO before activating checkout, mail dispatch or production.

## Minimalist privacy copy — EN, conditional candidate
'We use Resend to send order and contract confirmations. For this purpose, we share the recipient email address, relevant order information and the required contractual documents. Further details about the provider, retention and applicable international-transfer safeguards are provided in this notice once verified.'

## RU technical translation — conditional candidate
'Мы используем Resend для отправки подтверждений заказа и договора. Для этого передаем адрес электронной почты получателя, необходимые сведения о заказе и обязательные договорные документы. Дополнительные сведения о поставщике, хранении данных и применимых гарантиях международной передачи будут включены в настоящее уведомление после проверки.'

Do not publish the conditional copy as a complete GDPR Article 13 notice.
