# BXC-LEGAL-GAP-REVIEW-001
## BoxVia Legal Gap Review | v0.1 | RU | INTERNAL DRAFT / RELEASE HOLD
Date: 2026-11-09
Scope: Check a Claim, paid Technical Pilot and adjacent service-request flows. This is a document-based gap review, not a legal opinion and not a confirmation of current Polish/EU legal compliance.

### Evidence examined
- `docs/drafts/legal-pages/terms.en-ru.md` (BXC-LGL-TERMS v0.1).
- `docs/drafts/legal-pages/privacy.en-ru.md` (through v0.5).
- `docs/drafts/legal-pages/BXC-DATA-RETENTION-ERASURE-POLICY-001.md`.
- `docs/drafts/legal-pages/BXC-RETENTION-AUDIT-001.md`.
- `docs/drafts/legal-pages/BXC-D1-SCHEMA-001.md`.
- `docs/drafts/legal-pages/BXC-D1-ERASURE-EXECUTOR-DESIGN-001.md`.

The findings distinguish established facts in these materials, proposed legal text, and unanswered legal/operational questions. No live provider terms, Polish register, tax records, actual checkout screens, public site text, or final customer communications were independently verified in this review. No publication authorized.

## Executive decision
**Prioritize legal product definition and customer-contract evidence before further D1 engineering.** Keep fulfillment and erasure executors on RELEASE HOLD. Preserve production records pending approved retention schedule and legal holds. Draft text is not yet effective.

## Gap register
| ID | Priority | Domain | Source-backed finding | Missing evidence / required decision | Proposed owner action |
|---|---|---|---|---|---|
| L01 | P0 | Provider identity | Terms propose Polish sole-proprietor details, but explicitly require verification | Current CEIDG details, public correspondence address, working contact and complaint channel | Verify registry and approve publishable identity/contact |
| L02 | P0 | Contract formation | Terms distinguish inquiry from accepted Order | Precise acceptance event, prepayment disclosure, order receipt, versioned terms and durable-medium confirmation | Define order lifecycle and acceptance record |
| L03 | P0 | Consumer withdrawal | Terms preserve mandatory rights and reject universal no-refund | Customer B2C/B2B classification, withdrawal notice/form, express early-performance request, applicable service/digital-content classification, statutory consequences | Polish/EU counsel review; implement only approved wording and evidence |
| L04 | P0 | Price/VAT | Terms propose final amount inclusive of VAT charged by BoxVia | Verified VAT treatment, consumer/business invoicing, cross-border B2C/B2B tax consequences | Polish tax review by transaction/customer category |
| L05 | P0 | Privacy notice | Privacy draft inventories D1 fields and several providers | Controller contact, Art. 13 purposes and lawful bases by activity, recipients/roles, transfers, rights/contact, actual cookies/storage | Produce controller-processing matrix and update EN/RU notice |
| L06 | P0 | Retention | 30d unpaid, 12mo paid content, 90d token/outbox/mailbox are proposals only | Lawful criteria and approved retention triggers, payment/tax evidence segregation, holds, provider backup periods | Approve category-specific policy only after Polish legal/tax review |
| L07 | P0 | Access security | Inspected code does not check token age; no expiry field in D1 schema | Authorized access period, token revocation/expiry design and customer-facing promises | Define legal access commitment before engineering |
| L08 | P0 | Delivery evidence | Terms require defined channel/deadline; D1 schema has no explicit contract version or delivery timestamp | Actual delivery, acceptance, timestamps, evidence and customer notification | Specify minimum order/fulfillment evidence model |
| L09 | P1 | Refunds/complaints | No universal no-refund; complaint contact placeholder | Complaint process, refund policy consistent with statutory remedies and PayPal dispute path | Draft complaint and withdrawal workflow |
| L10 | P1 | Confidentiality | Terms warn against submitting secrets and require authorization for publication | NDA/DPA applicability, client authority to submit third-party data, research reuse permissions | Classify public vs confidential workflows and approval evidence |
| L11 | P1 | ANDEKS boundaries | Terms exclude certification, statutory audit, legal/tax opinion and guarantee unless expressly agreed | Product-specific scope, evidence standard, independence and non-endorsement disclaimers | Harmonize order forms, deliverables, website and BCAF |
| L12 | P1 | Processors | Privacy/retention audits identify Cloudflare, PayPal, Resend, mailbox, Turnstile | Provider role, DPA, subprocessors, transfers, retention and deletion verification | Maintain provider register and evidence links |
| L13 | P1 | DSAR | Draft policy describes access/erasure/restriction workflow | Verified privacy contact, identity checks, response tracking, exceptions, provider deletion proof | Adopt manual interim procedure before automated erasure |
| L14 | P1 | Backups | No confirmed D1 Time Travel/provider backup duration | Backup restoration and re-erasure controls | Verify provider retention; avoid instant-deletion promise |
| L15 | P1 | Language/version control | EN controlling working text, RU technical translation in retention draft | Contract language priority, multilingual parity, version/date and evidence | Adopt versioned EN/RU technical translation QA |
| L16 | P1 | Scope completeness | Service-request emails are outside the four D1 application tables | Full inventory for Technical Pilot, other paid services and manual email intake | Extend data map and terms to each intake channel |

## Critical dependency sequence
1. **Commercial contract model:** service type, B2B/B2C, checkout sequence, order acceptance, delivery evidence and complaint channel.
2. **Legal classification:** consumer withdrawal and precontract information, tax/VAT, GDPR lawful bases, retention and legal holds.
3. **Approved customer documents:** Terms, Privacy, Withdrawal/Refund/Complaints, order-specific terms, confidentiality and IP boundaries; bilingual technical parity.
4. **Evidence capture requirements:** accepted version, precontract notices, express requests/acknowledgments where legally applicable, payment reconciliation, fulfillment record.
5. **Implementation:** only then stage schema, expiry, DSAR and erasure; never infer a legal basis from an SQL field.

## Immediate release restrictions
- Do not publish the proposed 30/90-day or 12-month schedule as an existing retention promise.
- Do not claim PayPal payment automatically extinguishes withdrawal rights.
- Do not claim data is EU-only, no cookies/logs, or provider-wide immediate erasure without verification.
- Do not delete live customer/payment data on the strength of offline tests.
- Do not merge, deploy or publish this document without owner authorization.

## Owner decisions required (minimal)
A. Is Check a Claim sold to consumers, businesses, or both? How is customer status determined?
B. At which precise step is the paid Order accepted and confirmed to the customer?
C. What is the verified public email for privacy, complaints and contractual notices?
D. Is fulfillment a personalized service, a digital-content supply, or mixed by product? Counsel to validate classification.
E. What delivery/access period is actually promised?
F. Which entity and tax/VAT rules apply to each sales geography?

## Review gates
G1 owner confirms facts and contract workflow.
G2 qualified Polish legal/tax review.
G3 site/checkout and live processor evidence audit.
G4 bilingual technical translation reconciliation.
G5 release authorization, separately from production changes.

**STATUS: FIRST-PASS DOCUMENT GAP REVIEW COMPLETED; NOT A COMPLIANCE CERTIFICATION; RELEASE HOLD.**
