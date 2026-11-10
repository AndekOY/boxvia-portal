# BXC-CONTRACT-CONFIRMATION-CODE-AUDIT-001
## Existing Worker inspection and integration status | 2026-11-10
**Scope:** three standardized microservices. Technical Pilot excluded. Production release hold.

### Source files inspected on `draft/bxc-legal-trust-v01`
- `wrangler.jsonc`: main `cloudflare/worker.js`; D1 `DB` binding `boxvia-claims`; no R2 binding declared.
- `cloudflare/worker.js`: dispatches payment endpoints to `handlePayment`; scheduled handler calls `deliverNotifications`.
- `cloudflare/paypal.js`: PayPal order creation and verified capture for Check a Claim only, USD 20; on capture writes `paypal_orders` and `claims.payment_status`, then enqueues `claim_paid` in `notification_outbox`.
- `cloudflare/notifications.js`: Resend sends **operator notification** to `env.NOTIFICATION_TO`, not a customer contract confirmation. Status `sent` means provider accepted API request, not necessarily delivered to inbox. No attachment.
- `cloudflare/schema.sql`: reference claims schema only; warns not to recreate production tables.

### Critical integration gaps
1. No versioned customer order acceptance/terms snapshot evidenced in inspected PayPal path.
2. No confirmed customer-facing durable-medium contract email.
3. No PDF generation/immutable storage/download mechanism in inspected paths.
4. No R2 binding configured.
5. Existing `notification_outbox` is operational operator mail, not legal customer confirmation. Do not overload `claim_paid`.
6. Existing payment handler handles only Check a Claim, not the other two standardized products.
7. Existing claim access capability is not sufficient to assert secure long-term contract access; expiry and recovery require separate design.
8. PDF template one-page layout must be verified against actual order data, Unicode and attached statutory documents.
9. Payment status and legal order acceptance must be modeled separately.
10. Cannot claim compliance, completed integration or end-to-end delivery.

### Changes made
- New **isolated, unimported** `cloudflare/contract-confirmation.js` with snapshot validation, SHA-256 and a plain-text confirmation representation. It has no email sending, PDF generation, D1 writes, public route or side effects.
- The module rejects missing essential fields, invalid document digest and unsupported service IDs; validates the current 20/50/50 USD draft pricing. This is a draft implementation guard, not a tax or legal conclusion.
- No modification of `worker.js`, `paypal.js`, `notifications.js`, `wrangler.jsonc` or production.

### Next technical gate
Choose and review Workers-compatible PDF renderer and private storage, inspect actual D1 schema/migrations, implement an additive contract-confirmation outbox and versioned order snapshots **in staging**, test all legal/consumer variants, then request owner deployment approval.

### RU — технический перевод статуса
В существующем коде PayPal оплачивает Check a Claim, а Resend сообщает оператору об оплате. Отправка договора клиенту отсутствует в проверенных обработчиках. Создан только изолированный модуль проверки снимка заказа и вычисления SHA-256. Он не подключен к Worker, не формирует PDF и не отправляет письма. Production не изменен. RELEASE HOLD.
