# BXC-FULFILLMENT-LIFECYCLE-DESIGN-001
## v0.1 | 2026-11-09 | INTERNAL DRAFT / RELEASE HOLD

### Source-derived baseline
Reviewed `cloudflare/worker.js`, `cloudflare/paypal.js`, `cloudflare/notifications.js`. Intake sets `claims.status='new'` and `payment_status='pending'`. PayPal verified capture updates payment status to `paid` but does not advance fulfillment. The Resend outbox email is a notification **to the operator**, not evidence of delivery **to the customer**. No verified customer-delivery handler or `delivered_at` is present in these files.

### Proposed separate fulfillment states
`new -> in_review -> ready -> delivered -> closed`.

These are **proposed**, not existing D1 states. `ready` means the report is prepared; `delivered` must require independently verified delivery evidence. A report URL, operator notification, or an arbitrary string is not by itself proof of delivery.

### Proposed additive D1 design — DO NOT APPLY
Prefer a dedicated `bxc_fulfillment` table keyed by `claim_id`, with state, state_version, started_at, ready_at, delivered_at, closed_at, delivery_channel, delivery_evidence_reference, operator_id and updated_at. Add an append-only `bxc_fulfillment_events` audit trail with event ID, claim ID, previous/new state, actor, timestamp, delivery evidence reference, and idempotency key. Before implementation, design restricted access and minimization of evidence references; do not store report contents, customer email, access tokens or provider secrets in audit rows.

### Guarded transaction contract — design only
1. Authorize an operator/service actor with least privilege; client-provided claim IDs do not authorize transitions.
2. Read current claim and verified capture; reject absent/unknown payment evidence, legal hold or dispute state.
3. Validate expected state and version, target transition and UTC timestamp.
4. For `delivered`, validate delivery via an approved channel and provider/system evidence, not just a syntactically valid reference.
5. Atomically compare-and-swap state/version and append event; duplicate idempotency keys must return the prior result without a second event.
6. Start retention clock only after authoritative `delivered_at` is committed and audited; proposed durations remain unapproved.
7. On failure, preserve prior state, alert operator and do not infer delivery.
8. Maintain independent payment, fulfillment, retention and access axes.

### Current prototype
`cloudflare/fulfillment-draft/fulfillment.mjs` is pure validation only, **not connected to D1**. It rejects unverified payment, unknown hold/dispute, skipped transitions, malformed timestamps, missing actor, and missing syntactic delivery reference. Every apparently valid transition returns `REVIEW`, **never permission to write**. `executeTransition()` always throws. A syntactically valid delivery reference in the prototype is not authoritative delivery verification.

`cloudflare/fulfillment-draft/fulfillment.test.mjs`: 14 synthetic tests passed locally under Node. This does not constitute Cloudflare staging validation or production readiness.

### Open owner decisions
- What is the actual fulfillment workflow and authorized operator?
- Is the report delivered by email, secure claim page, or both? What provider confirmation is accepted as delivery evidence?
- Does the retention clock start at confirmed dispatch, receipt, or availability? Define legal and contractual meaning.
- How are undeliverable notices, retries, correction, withdrawal, refund, dispute and customer-access expiration handled?
- Which Polish/EU legal and tax retention rules constrain paid claim content and payment evidence?

### Release hold
No production D1 migration, Worker import, deploy, merge, deletion or public privacy commitment. Owner + legal/tax + technical staging + BXC/COS release approvals are required.

---

# RU — ТЕХНИЧЕСКИЙ ПЕРЕВОД

## Подтвержденная база
Прием заявки создает `new/pending`. Подтвержденная оплата переводит только платеж в `paid`. Уведомление Resend направляется оператору, а не клиенту, поэтому оно не подтверждает доставку результата. Проверенный код не содержит подтвержденного `delivered_at`.

## Проектная модель
Предлагаемая последовательность: `new -> in_review -> ready -> delivered -> closed`. Это новые проектные состояния, а не действующая схема D1. `ready` означает готовность отчета; `delivered` требует независимого доказательства доставки. Ссылка на отчет или произвольный идентификатор сами по себе недостаточны.

Предлагается отдельная таблица `bxc_fulfillment` с состоянием, версией, временными метками и ссылкой на подтверждение доставки, а также журнал `bxc_fulfillment_events`. Все изменения должны выполняться авторизованно, атомарно и идемпотентно. Платеж, исполнение, хранение и доступ остаются независимыми контурами.

## Результат прототипа
Создан чистый валидатор переходов без обращения к D1. Даже корректный запрос получает `REVIEW`, а не разрешение на изменение базы. Исполнитель переходов намеренно заблокирован. 14 синтетических тестов прошли локально. Это не проверка на Cloudflare staging и не готовность к production.

## Открытые решения
Нужно утвердить канал доставки, надежное подтверждение, ответственное лицо, значение момента `delivered_at`, обработку повторов и ошибок, а также сроки хранения с учетом польского права.

**INTERNAL DRAFT / RELEASE HOLD. Никаких изменений production.**
