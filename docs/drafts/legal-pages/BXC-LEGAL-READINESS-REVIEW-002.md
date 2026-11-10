# BXC-LEGAL-READINESS-REVIEW-002
## Three microservices — document-based legal readiness assessment | v0.1 | 2026-11-10
**INTERNAL DRAFT — RELEASE HOLD — NOT A LEGAL OPINION**

**Scope:** Check a Claim (USD 20 / 24h), One Question Review (USD 50 / 2 days), Focused AI Governance Review (USD 50 / 2 days). Technical Pilot excluded. No production deployment, migration, live email, or customer checkout performed.

### Basis and evidentiary limits
Reviewed the repository drafts BXC-MICROSERVICES-PUBLIC-OFFER-001, BXC-MICROSERVICES-SCHEDULES-ABC-001, BXC-CHECKOUT-CONSUMER-LEGAL-GATES-001, BXC-POLISH-CONSUMER-LAW-IMPLEMENTATION-001, BXC-LEGAL-GAP-REVIEW-001 and BXC-AUTOMATED-CONTRACT-CONFIRMATION-001, plus staging code and mock CI. This is a **document/code review**, not independent verification of the currently operative Polish statute, CEIDG entry, tax status, PayPal checkout screens, privacy providers or actual customer communications. Legislative references in the earlier Polish-law memo are research leads, not fresh verification in this report.

### Blocking legal findings (P0)
| ID | Domain | Source-derived observation | Release evidence / decision |
|---|---|---|---|
| LR01 | Provider identity | Public Offer contains unverified legal-name, NIP, REGON, address and contact placeholders | Current CEIDG extract and approved published identity, email and complaint address |
| LR02 | Contract formation | Public Offer section 6 is a proposed sequence; checkout gates explicitly lack proof of the actual PayPal payment-obligation UI and acceptance event | End-to-end screenshots/recorded checkout; lawyer-approved binding acceptance moment; versioned acceptance event |
| LR03 | Consumer classification | Polish-law memo describes service vs digital-content classification as a hypothesis | Polish consumer-law counsel opinion for each of three products, including consumer-like sole traders |
| LR04 | Withdrawal and early performance | Public Offer section 9 reserves rights; checkout specification requires separate request; the withdrawal notice/model form is not finalized | Approved statutory notice, model form, separate unchecked request/acknowledgment where legally required, durable record and tested withdrawal handling |
| LR05 | Durable-medium confirmation | Isolated staging mocks prove attachment generation/provider API acceptance, not customer delivery or a legal acceptance event | Exact accepted immutable documents and notices, legally adequate confirmation before service commencement, verified send/delivery/fallback handling |
| LR06 | VAT and total price | USD 20/50/50 stated but tax disclosure is expressly unresolved | Tax-adviser signoff for Polish and cross-border B2C/B2B, VAT/OSS/reverse charge as applicable, invoice and currency presentation |
| LR07 | Product certainty | Schedules leave source/character limits, allowed references, deadline start trigger and calendar/business days open | Owner-approved measurable service unit, admissibility, delivery trigger and due-date semantics; consistent checkout copy |
| LR08 | Complaints/remedies | Public Offer section 10 contains placeholder contact and unresolved deadlines; cancellation/refund scenarios not operationally specified | Polish-law-approved complaint, refund and withdrawal process, lawful time limits and remedies |
| LR09 | GDPR | Privacy/retention/provider role, legal bases, transfer and backup questions remain open in earlier gap review | Verified Article 13 notice, controller/processor matrix, retention by category, DSAR and incident procedures |
| LR10 | Language | Draft contract is EN working text + RU technical translation; Polish customer-facing wording is not approved | Counsel-reviewed customer-language strategy; Polish checkout and withdrawal notices where required; controlled EN/RU technical parity |
| LR11 | Immutable acceptance evidence | Staging accepts caller boolean `acceptanceVerified`; D1 stores snapshot digest but not independently verifiable original accepted event or full snapshot | Authenticated acceptance event, immutable accepted snapshot and document bytes, tamper-evident provenance and replay/reconciliation rules |
| LR12 | Email status and service start | Resend `provider_accepted` is not recipient delivery; no production webhook/fallback gate | Signed webhook verification, event deduplication, bounce/failure and unknown-state reconciliation, lawful start authorization |

### Working legal interpretation requiring external verification
- The prior Polish-law implementation memo cites consumer-rights Act Articles 12, 17, 21, 27 onward and 38. Their current operative text, applicability and exceptions must be checked by Polish counsel before any public claim.
- A personalized written assessment is **provisionally** treated as a service with a PDF deliverable; the PDF format alone does not establish the legal classification.
- Payment or PDF delivery alone is **not treated** as an automatic waiver of withdrawal rights.
- Consumer rights, trader identification, tax obligations and GDPR cannot be solved merely by successful PDF/Resend tests.

### Minimum acceptance evidence model — proposal, not existing implementation
1. `order_id`, `customer_status`, `country_if_required`, product ID/version, exact scope, accepted price/currency/tax and delivery rule.
2. Versioned precontract disclosure snapshot and payment-obligation UI version; customer action with authenticated timestamp and event provenance.
3. Separate terms acknowledgment, withdrawal notice supplied and early-performance request/acknowledgment where applicable, including exact text/version and timestamp.
4. Provider acceptance decision, payment capture/reconciliation, immutable accepted snapshot bytes and SHA-256, immutable Terms/Schedule/withdrawal PDFs and hashes.
5. Confirmation PDF hash, R2 key, email provider receipt, verified delivery/failure/unknown state, legally approved service-commencement gate.
6. Fulfillment, withdrawal, complaint, refund, DSAR and legal-hold audit trail with approved retention.

### Sequenced next actions
**A. Owner factual decisions:** verified identity/contact; exact start trigger and calendar/business days; source caps and permitted report sharing; customer geographies and B2C/B2B policy.

**B. Polish counsel review:** legal classification; statutory disclosures and payment button; withdrawal/model form and early-performance request; complaint/ADR/remedies; customer-language requirements and jurisdiction.

**C. Tax review:** transaction-country/customer-type matrix; VAT-inclusive final price, OSS/reverse charge, invoicing and currency.

**D. Privacy review:** real processing inventory, Cloudflare/PayPal/Resend and mailbox roles, retention, international transfers and privacy/cookie notices.

**E. Engineering after legal approval:** replace boolean acceptance gate with evidenced event; store immutable snapshot; implement signed email webhooks and reconciliation; ensure service cannot commence before legally sufficient confirmation.

### Release decision
**NOT READY / RELEASE HOLD.** The successful isolated Unicode staging integration test establishes only mocked technical behavior. No public terms, checkout, migration, payment change, real email, production deployment, or release is authorized.

### RU — итоговая нормативная параллель
Проверены проекты публичной оферты, приложений A–C, потребительских требований checkout, польского правового обзора и технического подтверждения договора.

Подтверждено наличие проектов документов и успешно испытанного изолированного технического конвейера. Не подтверждены действующий юридический акцепт, квалификация услуг, механизм отказа, VAT, GDPR, язык договорной информации и реальная доставка подтверждения клиенту.

Приоритет — закрыть юридические блокеры LR01–LR12 и только после этого интегрировать механизм в production. **RELEASE HOLD.**
