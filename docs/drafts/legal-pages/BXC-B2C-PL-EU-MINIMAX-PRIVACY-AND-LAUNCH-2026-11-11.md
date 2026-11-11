# BXC — B2C Poland + EU | Minimum launch facts and privacy copy
Date: 2026-11-11
Status: DRAFT — OWNER APPROVAL AND FACT CHECK REQUIRED / NOT FOR PUBLICATION

## Approved operating perimeter
Service: BoxVia Check a Claim, USD 20 final amount charged by BoxVia.
Customers: natural persons buying as consumers, resident in Poland or another EU Member State. Business and non-EU buyers: not supported initially.
Provider: Andrey Ekhmenin – BoxVia, NIP 8513329301, ul. Żwirki i Wigury 13/4, 71-176 Szczecin, Poland. Contact: andrzej.ekhmenin@gmail.com.
Human-performed independent analytical service; digital report delivered manually by email. AI only with genuinely anonymous materials.

## Three release facts, no additional infrastructure
1. TAX: Confirm the specific SKU's classification as a human-performed B2C analytical service (not an automatically electronically supplied service), Polish VAT rate and gross-price/invoice wording. Supplier-country taxation is the **general** B2C services rule, subject to exceptions. Owner/accountant must confirm applicability to this SKU. No buyer-country VAT engine or OSS assumption.
2. PRIVACY: Verify actual Cloudflare, PayPal and Gmail data categories, legal roles and international transfers using provider terms; inspect the intended checkout for cookies/analytics; define real retention and rights handling. Do not claim zero cookies, EU-only storage or no transfers without evidence.
3. CONSUMER: Confirm B2C withdrawal, early performance, durable confirmation and payment-button wording in the actual purchase flow. The 24-hour execution clock starts only after lawful commencement conditions. A service delivered by email does not by itself settle its legal classification.

## Minimal privacy notice — draft EN text, not publishable until bracketed facts are completed
**Controller.** Andrey Ekhmenin – BoxVia, ul. Żwirki i Wigury 13/4, 71-176 Szczecin, Poland, NIP 8513329301; privacy contact: andrzej.ekhmenin@gmail.com.

**Data and purposes.** We use your email, order reference, the minimum information needed to identify the claim, contract acknowledgments, payment references and correspondence to administer your order, deliver the agreed analysis, handle withdrawal and complaints, and meet applicable accounting, tax and legal obligations. Do not submit sensitive or unnecessary third-party information.

**Legal grounds.** GDPR Art. 6(1)(b) for pre-contract steps and service performance, Art. 6(1)(c) for statutory accounting/tax and consumer duties, and Art. 6(1)(f), where applicable and justified, for security and legal claims. We will identify any optional processing requiring a different lawful basis separately.

**Recipients.** Cloudflare supports our website, checkout and necessary records; PayPal processes payment; Google Gmail supports manual customer communication. Each provider's applicable role, recipients/subprocessors and international transfer safeguards are described in [VERIFIED PROVIDER AND TRANSFER DISCLOSURE — REQUIRED BEFORE RELEASE]. We do not collect payment card details directly.

**Retention.** Order, contract and accounting evidence is retained for [VERIFIED STATUTORY PERIODS]; claim inputs and working material for [DEFINED MINIMUM OPERATIONAL PERIOD]; correspondence for [DEFINED RETENTION/DELETION CRITERIA]. We delete or restrict data when no longer necessary, subject to statutory obligations.

**Rights.** Subject to legal conditions, you may request access, correction, erasure, restriction, portability or object to processing, and complain to Poland's data protection authority (UODO). Contact the address above.

**Automated decisions and AI.** The service outcome is reviewed and issued by a human. Identifiable customer data is not authorized for submission to ChatGPT; genuinely anonymized material may assist analysis. [VERIFY WHETHER ANY OTHER ARTICLE 22 AUTOMATED DECISION-MAKING EXISTS.]

**Cookies and tracking.** [INSERT VERIFIED CHECKOUT COOKIE/TELEMETRY INVENTORY AND REQUIRED CONSENT DETAILS.]

**Data required.** An email and the minimum agreed claim details are needed to arrange and fulfill the service; without them the service cannot be supplied. [CONFIRM EXACT FIELDS AT COLLECTION.]

**International transfers.** [INSERT VERIFIED COUNTRIES, MECHANISMS AND HOW TO OBTAIN SAFEGUARD DETAILS.]

## MINIMAX launch decision
- No public privacy publication or real checkout until bracketed facts are filled from operational evidence.
- No live PayPal activation or real customer records until the three release facts are resolved.
- After that, one synthetic PayPal Sandbox E2E test and explicit owner approval; no broad test suite.
- No Resend, new Worker, CRM, automatic notifications or extra processors.

## Primary official sources
- VAT: https://taxation-customs.ec.europa.eu/taxation/vat/vat-directive/place-taxation_en
- Polish VAT: https://podatki.gov.pl/podatki-firmowe/vat/poradniki-i-informatory/miejsce-swiadczenia-opodatkowania
- Consumer Rights Act, 2026 consolidated text: https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU20260001244
- UOKiK: https://prawakonsumenta.uokik.gov.pl/prawo-do-informacji/sprzedaz-poza-lokalem-i-na-odleglosc/

## Production evidence update — 2026-11-11 (owner screenshots)
- Cloudflare Web Analytics is **enabled** for boxvia.andeks.workers.dev; do not claim analytics is absent. Actual cookie/storage behavior and legal basis are **not verified**.
- Cloudflare HTTP request logs are visible in the account dashboard. Worker-specific logs, precise retention and backup settings remain **unverified**.
- Turnstile widget `boxvia-claim-form` is configured Managed, no pre-clearance, one hostname. A controlled production test produced one Siteverify request and one valid token; the accepted claim was #23. This verifies one successful validation path, not every rejection path.
- Owner deleted all 67 synthetic rows from the five application tables in Production D1 `boxvia-claims`; post-delete SQL counts were zero for `claims`, `claim_access`, `paypal_orders`, `notification_outbox`, and `service_requests`. The historical Time Travel/backup/log state is not erased by that operation.
- Production Worker screenshot showed `CLAIM_INTAKE_ENABLED=true`, `PAYPAL_CHECKOUT_ENABLED=true`, `PAYPAL_ENV=live`, and Resend variables/secrets present. These facts **contradict** the earlier draft assertion that Resend is absent from production infrastructure; intended BXC future processing must be distinguished from the existing production implementation. Do not assert that no Resend processing occurs without runtime evidence.
- Two `COMPLETED` 20 USD D1 rows were owner-identified as PayPal Sandbox transactions. A PayPal Live activity screenshot showed no transactions under displayed criteria; not an exhaustive reconciliation.

## Consolidated MINIMAX publication blockers (do not create parallel documents)
1. Verify Cloudflare, PayPal, Google/Gmail, and **existing Resend** actual data flows and provider privacy/DPA/transfer disclosures. Record exact provider documentation links and processing roles; distinguish existing site traffic from BXC-specific checkout.
2. Verify actual cookies/analytics on live site and checkout, including whether any nonessential storage requires consent before loading. No invented no-cookie or EU-only statements.
3. Confirm retention of provider logs/backups and actual manual deletion responsibility. Approved 30/90/12-month operational schedule remains interim, statutory evidence retained as required.
4. Verify consumer checkout transaction-specific order, approved documents and hashes, final pay-obligation control, optional early performance and withdrawal, durable confirmation; preserve 24h timing condition.
5. Owner waived separate accountant workflow, **not** the obligation to present legally accurate final gross price and mandatory transaction disclosures. Do not claim VAT rate confirmed.

No production deployment, no new processor, no live payment test. HOLD pending verified disclosures and explicit owner approval.

## Owner clarification — Resend (2026-11-11)
Owner explicitly states: **Resend is not used**. Therefore Resend is **not part of the approved BXC operating model**, and its presence as production environment variables/secrets must not be described as proof of actual processing or as a confirmed active BXC recipient. The prior mention of Resend as an actual processor was not established. Existing production configuration still contains Resend-related values, but no live API invocation was verified. No need to request Resend account setup or add Resend to the BXC Privacy Notice solely due to dormant variables. If production source/runtime evidence later shows actual transmission, reassess disclosure. Do not delete production secrets or change deployment on this basis.
