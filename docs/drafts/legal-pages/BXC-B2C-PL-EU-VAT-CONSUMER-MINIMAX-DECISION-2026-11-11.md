# BXC — B2C Poland/EU VAT and consumer-law decision
Date: 2026-11-11
Status: INTERNAL EVIDENCE REVIEW / NOT FINAL TAX OR LEGAL OPINION / NO LIVE AUTHORIZATION

## Owner decisions
- Initial customers: private individuals (B2C) residing in Poland or another EU Member State.
- One individually screened order at a time. USD 20 gross final BoxVia charge.
- Human-performed individualized claim assessment, with a manually emailed report and AI assistance restricted to genuinely anonymized material.
- Interim retention policy approved by owner; legal mandatory retention exceptions remain.

## VAT — supported by official public guidance
1. Polish Ministry of Finance, updated 2026-10-13: general B2C service place-of-supply rule is supplier establishment; exceptions exist.
   https://podatki.gov.pl/podatki-firmowe/vat/poradniki-i-informatory/miejsce-swiadczenia-opodatkowania
2. European Commission: B2C general rule Article 45; electronically supplied services have different rules under Article 58; classification matters.
   https://taxation-customs.ec.europa.eu/taxation/vat/vat-directive/place-taxation_en
3. Polish government: electronically supplied services are predominantly automated with minimal human intervention. An individualized human-performed service is **likely outside** that definition, provided actual fulfillment follows the stated operating model; this is an assessment, not a binding tax classification.
   https://biznes.gov.pl/pl/firma/podatki-i-ksiegowosc/chce-rozliczac-vat-w-transakcjach-zagranicznych/vat-w-handlu-miedzynarodowym-swiadczenie-i-nabycie-uslug/vat-w-handlu-miedzynarodowym-swiadczenie-i-nabycie-uslug
4. Polish Ministry of Finance: standard VAT rate 23%; reduced rates exist for specified supplies. A 23% working assumption for ordinary analytical services is reasonable, **not a verified binding rate for this SKU**.
   https://podatki.gov.pl/en/information-for-entrepreneurs/value-added-tax/general-vat-rules-and-rates
5. Owner evidence: Polish VAT register status Czynny as of 2026-11-09, reinstated 2026-08-21; VIES number PL8513329301 valid as of 2026-11-09. These documents do not decide the applicable rate or invoicing obligations.

## MINIMAX proposed tax route — pending accountant confirmation
- For genuinely human-performed B2C analysis, start from Polish supplier-place-of-supply and standard Polish VAT 23% as **provisional accounting hypothesis** for PL and other EU consumers, subject to special-rule review.
- If 23% applies to USD 20 gross, mathematical VAT-inclusive breakdown is USD 16.26 net and USD 3.74 VAT, subject to proper PLN tax conversion and rounding/accounting requirements. This is not an instruction to invoice those USD amounts.
- Confirm whether cash register exemption / fiscal receipt obligations and invoice-on-request requirements apply to this online B2C service, as well as payment receipt date and Polish VAT conversion rule.
- Do not configure VAT rates, invoice automation or country-specific tax statements in Checkout until confirmation.

## Consumer rights — official sources
- Polish Consumer Rights Act art. 17: essential information immediately before order and unambiguous payment-obligation button; missing confirmation/button may mean no contract.
  https://eli.gov.pl/api/acts/DU/2024/1796/text.html
- UOKiK: pre-contract disclosures and payment-obligation button.
  https://prawakonsumenta.uokik.gov.pl/prawo-do-informacji/sprzedaz-poza-lokalem-i-na-odleglosc/
- UOKiK: generally 14 days to withdraw from an online service contract; lawful early-performance request and acknowledgment must be handled correctly.
  https://prawakonsumenta.uokik.gov.pl/prawo-odstapienia-od-umowy/terminy-odstapienie/
  https://prawakonsumenta.uokik.gov.pl/pytania-i-odpowiedzi/odstapienie-od-umowy/

## Checkout source findings
- Draft checkout explicitly says 'Continue to PayPal Sandbox — USD 20.00 (payment required)' and has separate affirmative order, terms, withdrawal and privacy acknowledgments.
- Early performance and consequences acknowledgments are separate and unchecked; server checks pairing.
- Four legal documents and individual scope are not approved/published. Checkout remains blocked.
- Final legal review must verify that the **binding order action** and the PayPal handoff jointly meet art. 17, not merely that the draft button contains 'payment required'.
- Durable Gmail confirmation must include exact accepted order and legal document bytes before lawful performance. Payment notification alone is insufficient.
- No automatic waiver of 14-day withdrawal; no unconditional 24-hour completion promise when early performance is not lawfully authorized.
- Cross-border consumer mandatory protections and language requirements require review for EU customer countries; a single English document may not always suffice.

## Exact remaining owner/accountant confirmations
A. Confirm Polish VAT treatment for human-performed B2C individualized claim assessment supplied to PL and other EU residents: standard 23% or exception, invoice/fiscal receipt obligations, exchange-rate handling.
B. Confirm actual provider processing and transfer facts, cookie/analytics inventory and final retention policy disclosures for Cloudflare, PayPal, Gmail.
C. Confirm statutory consumer-law checkout/button, early-performance and durable confirmation wording, including cross-border consumer and language rules.

## Decision
HOLD for public B2C orders and PayPal live payments. No infrastructure expansion, no generalized VAT engine, no additional test suite. One synthetic sandbox end-to-end test after the release facts and immutable documents are approved.

## Owner decision — 2026-11-11: skip separate accountant review
- Owner explicitly directs that the **separate pre-launch accountant verification step be skipped** under MINIMAX.
- This removes a workflow step only. It does **not** certify 23% as the legally applicable rate, prove place of supply, establish invoicing/fiscalization obligations, or create a legal exemption.
- Treat 23% Polish VAT and supplier-place-of-supply as a **provisional internal operating assumption**, not a verified statement for public checkout. USD 20 remains the customer-facing final gross price inclusive of taxes BoxVia must charge.
- Do not publish a false assertion that VAT classification has been legally validated. Preserve applicable mandatory tax and accounting duties; revisit classification if the service model changes or a transaction falls under an exception.
- No extra VAT calculator, OSS engine, accountant workflow or generalized tax automation. Remaining work focuses on actual privacy processing and consumer contract flow. Existing live-release HOLD remains until mandatory checkout disclosures and other gates are addressed.
