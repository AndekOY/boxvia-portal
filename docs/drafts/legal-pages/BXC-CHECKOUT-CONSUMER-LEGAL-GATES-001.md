# BXC-CHECKOUT-CONSUMER-LEGAL-GATES-001
## Checkout, consumer rights and evidence specification | v0.1 | 2026-11-10
**INTERNAL IMPLEMENTATION SPEC / NOT APPROVED / RELEASE HOLD**
**Scope:** only three standardized microservices. Do not deploy from this document alone.

## 1. Proposed customer journey
1. Product page displays scope, input rules, final payable amount, delivery target, report language, trader identity/contact, complaint route and consumer withdrawal summary.
2. Intake checks product-specific unit and allowed materials; flag disallowed secrets/sensitive data. No payment before scope eligibility is decided, unless a lawful clearly disclosed exception/refund process is implemented.
3. Checkout summary records product ID, schedule version, terms version, price/currency/tax, customer status (consumer/business), country where legally needed, deliverable and timing.
4. Separate controls:
   - REQUIRED acknowledgement of Terms and linked Service Schedule (do not treat as GDPR consent).
   - OPTIONAL/CONDITIONALLY REQUIRED express request for performance to begin during a statutory withdrawal period, with legally accurate consequences, never pre-checked.
   - Any additional statutory digital-content acknowledgment ONLY if legal classification requires it, separately and precisely worded.
   - OPTIONAL marketing consent separate, unchecked by default.
5. Payment-obligation button wording must clearly signal payment obligation; verify PayPal hosted button flow and local pre-payment screen.
6. Record provider acceptance event, PayPal authorization/capture and failure handling; do not assume payment alone equals a valid waiver of withdrawal.
7. Send durable-medium confirmation with exact accepted terms/schedules, required consumer information, order summary, payment record and delivery expectations.
8. Record report completion, delivery timestamp and durable delivery evidence; provide lawful complaint and withdrawal channels.

## 2. Minimal evidence fields (logical, not yet schema)
order_id; product_id; product_version; terms_version; schedule_version; notice_version; displayed_price; currency; tax_label; customer_status; customer_country_if_needed; accepted_at; acceptance_event; terms_acknowledged_at; early_performance_requested_at_if_any; digital_content_acknowledged_at_if_applicable; payment_order_id; payment_capture_id; payment_status; contract_confirmation_sent_at; delivery_due_at; delivered_at; delivery_channel; withdrawal_notice_provided_at; complaint_case_id; cancellation_refund_status; consent_evidence_provenance.
**Data minimization:** retention for each field must be legally approved; avoid collecting unnecessary identifiers.

## 3. Withdrawal handling: legal review required
- Do not use blanket 'no refunds' or claim payment immediately removes consumer withdrawal rights.
- Determine whether each service is a contract for services, digital content not supplied on a tangible medium, or mixed. The statutory regime and consequences for fully performed services may differ.
- For a consumer asking for early performance, use the correct express request/acknowledgment mechanism and durable confirmation; verify treatment of partial performance, completed service and noncompliance.
- Provide withdrawal notice and model form where required, and a verified contact.
- Design for customer withdrawal, non-admission, provider cancellation, missed delivery, deficient report, payment dispute and duplicate charge separately.
- Check Polish law implementing Directive 2011/83/EU as amended and applicable digital-service/content rules; qualified local review before launch.

## 4. GDPR / privacy / cookies gates
Verify the real controller identity and contact; Art.13 notices, purpose-to-legal-basis matrix, Cloudflare/PayPal/Resend roles, international transfers, retention, DSAR, browser storage and Cloudflare Web Analytics/cookie consent where legally required. No generic invented retention or no-cookie promise.

## 5. Explicit release blockers
B01 trader CEIDG and contact unverified.
B02 consumer law classification and withdrawal mechanism not approved.
B03 exact contract acceptance event and durable-medium confirmation not implemented/verified.
B04 price/VAT/cross-border treatment not signed off.
B05 actual checkout and privacy/retention data flow not reconciled.
B06 source caps, delivery clock and report-language terms incomplete.
B07 complaints/remedies and access period incomplete.
B08 owner approval, legal/tax review and EN/RU technical parity outstanding.

## RU — технический перевод
**Схема:** карточка услуги → проверка допустимости входа → сводка заказа и полная цена → согласие с условиями → отдельное заявление о досрочном начале исполнения при необходимости → платеж → подтверждение договора на долговечном носителе → отчет → фиксация доставки.
**Критически важно:** согласие с офертой не является согласием GDPR; оплата не отменяет право отказа; маркетинговое согласие отдельно; непроверенные сроки хранения не обещать.
**Нужно зафиксировать:** ID заказа и версии документов, цена/валюта, статус клиента, событие акцепта, отдельные волеизъявления, платеж, подтверждение, доставка, жалобы и возвраты.
**До выпуска:** правовая классификация услуги, польское потребительское право, VAT, GDPR, реквизиты, контакт, точные сроки и утверждение владельца.
**RELEASE HOLD.**
