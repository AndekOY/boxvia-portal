# BXC-CONTRACT-CONFIRMATION-EN-ONLY-DECISION-001
## Owner language decision | 2026-11-10
**Status: APPROVED DESIGN DIRECTION / RELEASE HOLD**

### Scope
The automated **BoxVia — Order & Contract Confirmation** PDF for Check a Claim, One Question Review and Focused AI Governance Review uses **English only**.

### Implementation constraints
- A4, exactly one page; overflow must fail closed, never silently create page 2.
- All headings, field labels, explanatory copy, legal notices within this confirmation and system-generated content are English.
- The renderer needs no multilingual template switching and no RU/PL localized confirmation templates.
- Customer-supplied scope text must be normalized to an approved English description before contract acceptance; never silently translate or change a legally agreed scope after acceptance.
- Full accepted Terms, service schedule, withdrawal instructions and other mandatory documents may be separate immutable attachments; their legally required languages must be assessed separately.
- The English-only PDF preference does not override mandatory Polish/EU consumer-language and precontract disclosure requirements.
- The renderer should support basic Latin Unicode for names and addresses, including Polish diacritics, even though legal prose is English.
- Technical Pilot remains excluded.
- Production and customer emails remain unchanged until separate release authorization.

### RU — внутренняя фиксация
Решение владельца: индивидуальное PDF-подтверждение заказа только на английском, одна страница A4, без многоязычных шаблонов. При переполнении — ошибка. Обязательные юридические документы и языковые требования проверяются отдельно. RELEASE HOLD.
