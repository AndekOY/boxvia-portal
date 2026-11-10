# BXC-PDF-CONFIRMATION-IMPLEMENTATION-PLAN-001
## PDF generation and Resend delivery — implementation contract | v0.1
**2026-11-10 | STAGING DESIGN / RELEASE HOLD**
**Owner decision:** universal PDF, Resend attachment, optional authenticated download. This file is an implementation-ready contract for subsequent integration, not evidence of working deployment.
**Artifact:** BoxVia_Order_Contract_Confirmation_TEMPLATE_v0.1.pdf, a two-page draft created externally and available in the project conversation. No final PDF binary was committed here.

## Boundaries
Do not modify production Cloudflare Worker, PayPal flow, D1 schema or Resend integration until the checkout/acceptance state machine and legal wording are validated. No direct public URLs for customer PDFs. No customer documents in repository.

## Implementation tasks (ordered)
1. Inspect actual worker source tree, package manager, existing PDF libraries, Resend handler and D1 migrations on the draft branch. Confirm deploy targets before writing executable code.
2. Add a pure, typed order-snapshot schema and validate all required fields. Reject missing legal identity, email, order/version, customer rights notice, exact accepted scope and tax statement.
3. Render PDF bytes from **immutable order snapshot** and append full, immutable accepted Terms/Schedule and withdrawal notice/model form where applicable. Do not link to mutable live pages as the sole record.
4. Store the document privately (R2 recommended only if configured/approved), record SHA-256, object key, generation timestamp, template version and legal version identifiers. Use deterministic idempotency key (order_id + accepted_document_versions). Do not regenerate different contracts for the same accepted order.
5. Use Resend API with PDF attachments, proper filename and exact verified recipient; record provider message ID and distinguish provider acceptance from delivered/bounced/failed webhook statuses.
6. Implement retry with exponential backoff, bounded attempts and manual fallback; never mark the confirmation as delivered based solely on API acceptance.
7. Provide secure download via short-lived scoped token or authenticated customer session, and prevent unauthorized access; do not expose an R2 object publicly.
8. Gate service commencement on legally sufficient confirmation evidence as defined after legal review. Distinguish provider dispatch from confirmed mailbox delivery.
9. Test with sandbox PayPal and Resend test setup; validate duplicate callbacks, failures, refunds, withdrawal and document version consistency.
10. Obtain legal/tax/GDPR signoff and owner release authorization before any deployment.

## Suggested TypeScript boundary (nonexecuting contract)
```ts
type ContractSnapshot = {
  orderId: string; acceptedAt: string; productId: string; productVersion: string;
  exactScope: string; termsVersion: string; scheduleVersion: string;
  withdrawalNoticeVersion: string | null;
  customerEmail: string; verifiedProviderIdentity: string;
  verifiedProviderContact: string; totalPrice: string; currency: string;
  taxDisclosure: string; serviceStartRule: string; deliveryDueAt: string;
  reportLanguage: string; deliveryChannel: string;
  earlyPerformanceRequest: { textVersion: string; requestedAt: string } | null;
};
type ConfirmationRecord = {
  orderId: string; pdfSha256: string; privateObjectKey: string;
  generatedAt: string; resendMessageId: string | null;
  emailStatus: "queued" | "provider_accepted" | "delivered" | "bounced" | "failed" | "unknown";
};
```

## Legal safeguards
- Confirm Polish consumer law Art.17/21 details and service vs digital-content classification.
- Attach complete accepted Terms and Schedule and withdrawal instructions as required.
- Confirm actual statutory contact and VAT language.
- Do not equate payment with waiver of withdrawal.
- Do not send secrets, credentials, full card details or private source materials in emails.
- Avoid storing unnecessary personal data; implement verified retention and legal hold policy.

## RU — технический перевод
Сначала проверить реальный код Workers, схему D1, PayPal и Resend. Затем создать типизированный снимок принятого заказа, сформировать PDF из неизменяемых данных, приложить утвержденные условия и информацию об отказе, сохранить контрольную сумму и защищенную копию, отправить через Resend и зафиксировать отдельные статусы отправки и доставки. Доступ для скачивания только авторизованный. Не менять production без отдельного разрешения. RELEASE HOLD.
