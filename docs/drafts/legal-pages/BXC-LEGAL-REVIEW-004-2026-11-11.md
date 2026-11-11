# BXC-LEGAL-REVIEW-004 — Four-document substantive legal review | 2026-11-11

Status: INTERNAL DRAFT — NOT LEGAL APPROVAL — BXC HOLD
Source: four EN candidates at commit 4bcaa89aa7081a8b98fc19cd7bcc1e1ea2b10f48. Review is text-based; statutory currency and factual provider configurations remain unverified.

## Blocking findings and exact corrections

### LR-01 — Withdrawal regime and 24-hour execution | HIGH
Files: BXC-001 §§5,9; BXC-002 §§3–4; BXC-WD-001.
Current text appropriately rejects automatic waiver but is too generic to serve as the final mandatory withdrawal instructions. Distinguish (a) request to begin performance during the withdrawal period, (b) proportionate payment after lawful partial performance, (c) any loss of withdrawal right after full performance only when the applicable legal conditions are satisfied, and (d) the correct legal classification of the deliverable (service versus digital content/service).
**Correction:** finalize an order-specific withdrawal notice and checkout acknowledgement after checking the actual transaction classification and Polish consumer-law requirements. Never promise 24-hour delivery without a valid lawful start trigger; provide a clear alternative for customers who do not request early performance. Do not use a prechecked box or blanket waiver.

### LR-02 — Contract formation, capture and consumer button | HIGH
Files: BXC-001 §2; BXC-002 §§2,7.
Owner's chosen formation point is successful PayPal capture independently verified by BoxVia. Need to verify legal compatibility of payment-button sequence, order submission, acceptance and formation, and payment failures, refunds and duplicate captures.
**Correction:** implement server-authoritative, idempotent order states (pre-contract assent → PayPal approval → verified completed capture → contract formed → durable confirmation). A redirect, browser success callback or unverified capture must never set contract-formed. Display unambiguous obligation-to-pay wording before the binding payment action, subject to jurisdiction-specific legal review.

### LR-03 — Mandatory pre-contract information and durable medium | HIGH
Files: BXC-001 §§1,4,6; BXC-002 §§2,6–7.
Draft mentions information and confirmation but does not prove actual checkout disclosure, immediate pre-order placement, confirmed recipient address, attachment bytes or dispatch timing.
**Correction:** verify actual checkout and Gmail dispatch evidence; attach or otherwise provide exact immutable accepted document versions on a durable medium and retain timestamps and dispatch identifiers. Confirm statutory deadlines for complaints and applicable ADR disclosure rather than leaving only generic language.

### LR-04 — Tax and currency | HIGH
File: BXC-001 §4.
USD 20.00 all-inclusive is an owner-selected price, not evidence of the correct VAT regime, invoice requirements or cross-border consumer treatment.
**Correction:** obtain verified Polish tax/VAT and cross-border sales treatment, invoice/receipt rules, and any required display of conversion or payment-provider charges before publishing final payable price wording. No assertion that all recipient-side tax duties can simply be shifted to a consumer.

### LR-05 — GDPR Art. 13 information is incomplete | HIGH
File: BXC-PRIV-001.
Actual processor/controller roles, international transfer mechanisms, retention criteria, cookie technologies and security practices are expressly unverified. Missing or insufficiently specific: legitimate-interest descriptions where Art. 6(1)(f) applies; actual retention criteria; recipients and transfer safeguards; whether provision of data is required and consequences of non-provision; automated decision-making/profiling statement if applicable; precise rights/complaint information and operational handling.
**Correction:** verify the data-flow inventory and insert only substantiated Art. 13 disclosures. Do not publish placeholders or assert unknown transfer destinations. ChatGPT use remains restricted to genuinely anonymized data.

### LR-06 — Customer rights and scope of intellectual property | MEDIUM
Files: BXC-001 §§3,6,8–10; BXC-002 §5.
The order must actually define the deliverable, permitted uses and exclusions. The statement that an unfavorable outcome is not inherently defective is reasonable, but must not obscure statutory conformity/remedy rights.
**Correction:** tie each sale to a precise order scope and deliverable; verify consumer remedies and classification before finalizing the schedule. Preserve mandatory jurisdiction and consumer rights.

### LR-07 — Evidence and final release authority | HIGH
All files.
The four SHA-256 hashes and commit-pinned URLs represent an immutable **review snapshot**, not approved legal text or an approved contract catalog.
**Correction:** after all changes and external legal/factual checks, create a new final candidate snapshot, verify byte-identical attachments and immutable customer-accessible documents, then obtain express owner release approval.

## Proposed corrected customer-facing wording (conditional drafts)

**Formation:** “Before payment, you may review your Order and the applicable documents and provide the required acknowledgements. Your paid contract with BoxVia is formed only after the payment has been successfully captured by PayPal and independently verified by BoxVia for this Order. Approval, redirection or an unverified payment status does not by itself form the contract. Applicable mandatory consumer law prevails.”

**Early performance:** “I expressly request that BoxVia begin performing the service before the end of any applicable withdrawal period. I understand that, if I later withdraw after performance has lawfully begun, I may be required to pay a proportionate amount for the service actually performed, where applicable law permits. I understand that any loss of the withdrawal right after full performance applies only if all statutory conditions are met.” [Separate unchecked control; legal review required before use.]

**No early performance:** “If you do not request early performance, BoxVia will not begin the service during the applicable withdrawal period unless another lawful basis applies. The advertised 24-hour execution period begins only once the lawful and operational start conditions specified in your Order have been met.”

**Privacy disclosure gap:** “Certain details of our service-provider arrangements, international transfers, retention periods and website technologies are being verified. This draft is not the final Privacy Notice.” [INTERNAL REVIEW ONLY — never publish as final privacy copy.]

## Release decision

NO-GO / HOLD. This review is a technical-editorial issue list and is not an independent legal opinion or statutory verification. No production deployment, real PayPal payment, customer confirmation, or binding legal publication authorized.
