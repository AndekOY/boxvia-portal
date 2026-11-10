# BXC-POLISH-CONSUMER-LAW-IMPLEMENTATION-001
## Three Microservices — Polish Consumer-Law Implementation Review | v0.1
**2026-11-10 | INTERNAL LEGAL RESEARCH / NOT LEGAL ADVICE / RELEASE HOLD**
**Scope:** Check a Claim, One Question Review, Focused AI Governance Review only. Technical Pilot excluded. Time/cost/operational performance benchmarking excluded by owner decision.
**Primary legislative source:** Ustawa z dnia 30 maja 2014 r. o prawach konsumenta, consolidated text Dz.U. 2026 poz. 1244, published 2026-09-23, legal state as of 2026-09-02: https://eli.gov.pl/eli/DU/2026/1244/ogl . For article excerpts and cross-check, https://api.sejm.gov.pl/eli/acts/DU/2024/1796/text.html ; see current consolidated text for operative wording and later amendments. Do not rely on 2024 version where changed.

## I. Legal classification: proposed, not settled
The commercial substance is an individualized human/AI-assisted assessment service culminating in a written report delivered electronically. **Working hypothesis:** contract for services, with a digital report as the performance artifact, rather than an automatic one-off sale of ready-made digital content. This hypothesis is NOT an established legal classification. A Polish consumer lawyer must evaluate Polish consumer-rights rules applicable to the specific performance, and possible overlap with digital content/service provisions. Avoid constructing a digital-content withdrawal waiver solely because a PDF or markdown report is delivered.

## II. Statutory anchors and practical consequences
**Art. 12:** before a distance contract, provide prescribed information including trader identity, main characteristics, total price, performance and withdrawal/complaint information. Map every required item to a UI location and retained snapshot.
**Art. 17(1)-(4):** immediately before an electronic paid order display the prescribed key information; require unmistakable acknowledgment of payment obligation. Button wording equivalent to Polish 'zamówienie z obowiązkiem zapłaty'. Failure of Art.17(2)/(3) means the contract is not concluded under that provision. PayPal redirect/hosted button must be examined end-to-end; a generic PayPal button alone is not assumed sufficient.
**Art. 21(1):** distance contract confirmation on durable medium within reasonable time, at latest before commencement of service. For 24h Check a Claim this is a critical pre-performance control; a mere web URL is not automatically a durable medium.
**Art. 21(2):** where consumer requests commencement of paid services during withdrawal period, obtain explicit request and acknowledgment of loss of withdrawal right upon full performance, as prescribed. Do not precheck or bundle this with Terms.
**Arts. 27 onward:** default distance-contract withdrawal rights and exceptions must be analyzed against the precise classification, service performance stage and legally required notices.
**Art. 38:** relevant exception for services fully performed with prior explicit request and acknowledgment, subject to precise statutory conditions; cannot claim that paying alone waives rights.
**Consumer entrepreneur:** evaluate Polish extension of certain consumer protections to a natural person contracting directly in connection with their business when not of professional character; a B2B checkbox alone may not settle classification.
**GDPR and tax:** separate reviews; do not conflate consent to terms with GDPR lawful basis or early-performance request.

## III. Proposed UI copy (PL; lawyer must approve)
**Pre-checkout summary:**
'Usługa: [NAZWA I WERSJA]. Zakres: [JEDNA JEDNOSTKA OCENY]. Wynik: pisemny raport z oceną materiału dowodowego. Cena całkowita: [KWOTA I WALUTA, INFORMACJA PODATKOWA]. Termin: [DOKŁADNY TERMIN I MOMENT ROZPOCZĘCIA]. Regulamin: [WERSJA]. Informacja o odstąpieniu od umowy: [LINK I DOKUMENT].'
**Terms checkbox (unchecked):**
'Zapoznałem(-am) się z Regulaminem [WERSJA] oraz opisem wybranej usługi [WERSJA].'
**Early-performance request (unchecked, independent; show only when legally applicable):**
'Wyraźnie żądam rozpoczęcia świadczenia usługi przed upływem terminu do odstąpienia od umowy. Przyjmuję do wiadomości, że po pełnym wykonaniu usługi przez przedsiębiorcę mogę utracić prawo odstąpienia od umowy, na zasadach określonych w obowiązujących przepisach.'
**Payment button proposed:** 'Zamawiam i płacę' or 'Zamówienie z obowiązkiem zapłaty'; verify actual host checkout wording and legal equivalence before implementation.
**No marketing checkbox by default; if any, independent and optional.**
**Do not use:** 'Paying means you waive your right to withdraw'; 'No refunds under any circumstances'; 'Report delivery always cancels withdrawal'.

## IV. Proposed durable-medium confirmation (EN skeleton; actual customer language to approve)
Subject: BoxVia — Order confirmation [ID]
Provider: [VERIFIED LEGAL NAME / ADDRESS / EMAIL]
Order: [ID / accepted timestamp / product and version]
Exact scope: [CLAIM OR QUESTION OR CONTROL PROPOSITION]
Source input: [IDENTIFIER; avoid unnecessary personal/confidential detail in email]
Total price / currency / tax information: [VERIFIED]
Payment: [STATUS / PAYMENT REFERENCE]
Service clock and due date: [PRECISE RULE / TIMESTAMP]
Delivery channel and access period: [VERIFIED]
Accepted terms and service schedule: [ATTACHED VERSIONED PDF OR OTHER LEGALLY ADEQUATE DURABLE COPY]
Consumer withdrawal information and model form: [ATTACHED/PROVIDED AS REQUIRED]
Early-performance express request/acknowledgment: [EXACT RECORDED TEXT AND TIMESTAMP IF GIVEN]
Complaints/withdrawal contact: [VERIFIED]
Important: This is confirmation of contract, not proof that an assessment has already been completed.

## V. Decision table
| Item | Legal significance | Current status | Next evidence/action |
|---|---|---|---|
| CEIDG trader identity/contact | precontract information | OPEN | current CEIDG extract + contact owner approval |
| Service vs digital content classification | withdrawal/remedies | LEGAL HYPOTHESIS | Polish lawyer review |
| Consumer / professional-character sole trader | rights applicability | OPEN | lawful customer-status intake and classification |
| Art.17 button and immediate summary | contract formation | CODE/UI UNVERIFIED | inspect real full checkout |
| Art.21 durable confirmation | before service starts | NOT EVIDENCED | implement and test customer email with versioned terms |
| Early performance Art.21(2) | 24h and 2-day service | DRAFT ONLY | separate unchecked request, legal review |
| Withdrawal notice and model form | mandatory consumer disclosures | DRAFT MISSING | draft statutory annex and verify |
| Price/VAT | consumer total price | OPEN | tax adviser and geography matrix |
| Complaints and remedies | consumer rights | OPEN | verified email and approved handling rules |
| Privacy/retention/analytics | GDPR/ePrivacy | OPEN | existing privacy audit + implementation |
| Bilingual parity | legal clarity | OPEN | PL customer legal text, EN/RU technical translations |
| Release | owner authorization | HOLD | legal/tax signoff and checkout verification |

## VI. RU — технический перевод выводов
**Основная гипотеза:** три микросервиса представляют собой индивидуально выполняемые аналитические услуги, результатом которых является электронный письменный отчет. Это рабочая юридическая квалификация, а не окончательный вывод.
**Статья 17:** перед платным заказом должны быть показаны обязательные сведения, а кнопка должна однозначно указывать на обязанность оплаты. Нарушение предусмотренного законом требования может препятствовать заключению договора.
**Статья 21:** подтверждение дистанционного договора на долговечном носителе требуется до начала исполнения услуги. При начале исполнения в период права отказа нужно отдельное явное требование потребителя и соответствующее уведомление о последствиях полного исполнения.
**Право отказа:** не прекращается автоматически вследствие оплаты или доставки PDF. Точные последствия зависят от квалификации и соблюдения закона.
**Польский язык:** подготовлены предварительные формулировки для checkout. Перед публикацией их должен проверить польский юрист.
**Необходимые действия:** подтвердить CEIDG и контакты, правовую классификацию, VAT, механизм акцепта PayPal, email-подтверждение, форму отказа и GDPR. RELEASE HOLD.

**No production changes. No authorization to publish.**
