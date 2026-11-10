# BXC-AUTOMATED-CONTRACT-CONFIRMATION-001
## Approved target architecture | v0.1 | 2026-11-10
**Decision:** Owner approved automatic PDF contract confirmation for the three standardized microservices using Cloudflare Workers + Resend, with optional authenticated download.
**Status:** APPROVED DESIGN DIRECTION; IMPLEMENTATION / PRODUCTION RELEASE HOLD. This is not evidence of existing deployment.
**Excluded:** Technical Pilot; any changes to production without separate authorization.

### Invariants
1. A legally valid order-acceptance event is defined and recorded before generating a contract confirmation. Payment alone does not waive consumer withdrawal rights.
2. Before work starts, provide the concluded contract confirmation and required consumer information on a durable medium; an email with attached immutable PDFs is the preferred implementation. Do not rely solely on a mutable webpage or link.
3. Generate a unique, order-specific **BoxVia — Order & Contract Confirmation** PDF; attach an immutable copy of the accepted Terms, Schedule A/B/C, and consumer withdrawal information/model form when applicable. If PDFs are combined, preserve complete versions and document identity.
4. Document fields: order ID, accepted_at, verified trader legal identity/contact, product ID/version, exact bounded scope, customer identification needed for contract, final price/currency and legally correct tax wording, applicable delivery deadline/trigger, report language/format, delivery method, accepted terms/schedule versions, withdrawal disclosures and early-performance request/acknowledgment where applicable.
5. Resend email dispatch **before service commencement**; store status as queued, provider_accepted, delivered, bounced, failed, or unknown. Provider acceptance is not proof of inbox delivery. Define retry and fallback channel, and prohibit automatic work commencement until the legally sufficient confirmation step is evidenced under an approved rule.
6. Store document SHA-256 digest, immutable document version, generated_at, email message ID, attempts, timestamps and relevant failure reasons. Do not expose PDF or token publicly.
7. Optional download via authenticated, expiring access capability; require ownership/authorization check, revocation and recovery policy. A website download is supplementary, not the sole durable-medium channel.
8. Do not embed secret tokens, PayPal credentials, full card data or unnecessary special-category data in the PDF or logs.
9. Retention, GDPR lawful basis, processor roles, international transfers and storage location must be approved before implementation. Define deletion/hold handling; do not promise an unverified period.
10. Test in staging: accepted/failed/canceled/refunded orders; duplicate PayPal callbacks; duplicate email jobs; Resend outage; bounced email; source invalid; withdrawal before/after commencement; PDF rendering with Unicode; token expiry; exact version re-download; no delivery before accepted contract.
11. Ensure idempotent generation and send: unique order ID and version; retry must not generate divergent contracts for same accepted order. Separate generation failure from email failure.
12. Consumer-facing copy must be legally reviewed in Polish and translated technically to EN/RU. Polish consumer-law classification and final VAT treatment remain open.

### Logical lifecycle
intake_validated -> checkout_summary_shown -> payment_obligation_confirmed -> payment_confirmed -> provider_order_accepted -> immutable_contract_snapshot -> PDF_generated_and_hashed -> confirmation_email_queued -> email_provider_accepted -> [delivery_evidenced or fallback_resolved] -> service_commenced -> report_delivered.

The exact order of payment and provider acceptance is subject to the current PayPal integration and legal review; this is a proposed state machine, not an assertion about live code.

### Minimum data record
order_id, customer_email, customer_type_if_needed, product_id, product_version, accepted_at, acceptance_basis, terms_version, schedule_version, withdrawal_notice_version, early_performance_request_text_version_and_timestamp_if_any, price, currency, tax_display, contract_snapshot_digest, pdf_object_key, pdf_sha256, pdf_generated_at, confirmation_email_provider_id, email_status, email_accepted_at, email_delivered_at, email_failure_at, service_commenced_at, withdrawal_case_id, legal_hold_flag.

### Release acceptance criteria
- Verified CEIDG/contact, approved Terms and Schedules A–C.
- Polish consumer-law counsel confirms service classification, withdrawal notices and express early-performance mechanism.
- Tax/VAT signoff and final-price display.
- Actual checkout evidence shows correct precontract disclosures and payment-obligation wording.
- Durable confirmation with all necessary content arrives before work starts.
- Privacy, storage and retention reviewed.
- PDF cannot be fetched by another customer or by expired token.
- Owner separately approves production deployment.

### RU — технический перевод
**Решение владельца:** автоматически создавать индивидуальное PDF-подтверждение договора для трех микросервисов, отправлять через Resend до начала исполнения и давать клиенту дополнительную защищенную возможность скачивания.
**Технические требования:** неизменяемая версия условий, ID заказа, SHA-256, защита доступа, повторные попытки, идемпотентность, учет статусов Resend, отдельная фиксация досрочного исполнения.
**Правовой предел:** PDF не заменяет правильный акцепт, обязательную информацию до оплаты, права потребителя и GDPR.
**Текущий статус:** архитектура утверждена; код, база, checkout и production не изменены. RELEASE HOLD.
