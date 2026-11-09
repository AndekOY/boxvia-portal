# BXC-FULFILLMENT-OFFLINE-STAGING-VALIDATION-001
## v0.1 | 2026-11-09 | INTERNAL DRAFT / RELEASE HOLD

### Scope
Local Python sqlite3 in-memory test of the **isolated synthetic** `cloudflare/fulfillment-draft/staging/schema.sql`. The `claims` table in this file is intentionally a **minimal synthetic stub**; it is **not** the verified production `claims` schema and must never be used as a migration. No real customer data, Cloudflare connection or production changes.

### Result
12/12 local tests passed: default state/version; no orphan fulfillment/event; NO ACTION parent protection; invalid state and negative version rejection; delivered/closed evidence constraints; unique event idempotency key and claim/version; compare-and-swap stale-version rejection; FK integrity.

### Limits and open design risks
- The SQL CHECK for delivery evidence only tests non-NULL values; it does not authenticate provider evidence or ensure nonempty strings.
- The event log is not yet transactionally coupled to a state change. A separate transaction prototype and rollback/retry tests are required before a D1 implementation.
- The schema does not enforce the full transition graph, verified PayPal capture, holds, disputes, operator authorization, or timestamp ordering. Those require an approved service transaction contract.
- Foreign-key enforcement must be confirmed for every actual D1 execution context; local PRAGMA is not evidence of production enforcement.
- The current prototype `proposeTransition` returns REVIEW only, and `executeTransition` always throws.
- Proposed `delivered_at` is not yet a legally approved retention-clock trigger.
- No actual Cloudflare staging D1 was created or tested.

### Next safe phase
Develop a transaction-only synthetic SQLite harness that performs compare-and-swap + event insert atomically with explicit rollback and duplicate idempotency handling. Then design a separate additive D1 migration against a staging copy of the **verified full** application schema. No production deployment or migration.

---

# RU — ТЕХНИЧЕСКИЙ ПЕРЕВОД

## Результат
На локальной SQLite в памяти успешно выполнены 12 из 12 тестов: внешние ключи, отсутствие каскадного удаления, допустимость состояния, контроль версии, обязательность сведений о доставке, уникальность событий и отказ повторному изменению с устаревшей версией.

## Ограничения
В `schema.sql` таблица `claims` является упрощенной синтетической заглушкой, а не схемой рабочей базы. Файл нельзя применять как миграцию. Проверка SQL подтверждает только наличие полей доказательства доставки, но не его подлинность. Атомарная запись состояния и журнала событий еще не реализована. На Cloudflare D1 staging тесты не проводились.

## Следующий этап
Отдельно проверить транзакционное изменение состояния вместе с записью события, откат при ошибке и повторные запросы. Затем подготовить аддитивную миграцию на изолированной копии полной схемы.

**INTERNAL DRAFT / RELEASE HOLD. Production не изменен.**
