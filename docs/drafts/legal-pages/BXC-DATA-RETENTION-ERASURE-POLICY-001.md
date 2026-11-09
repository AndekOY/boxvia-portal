# BXC-DATA-RETENTION-ERASURE-POLICY-001
## BoxVia Data Retention & Erasure Policy | v0.1 | EN/RU | INTERNAL DRAFT — NOT RELEASED
Date: 2026-11-09
Owner: BoxVia / BXC commercial-contracting workstream
Status: PROPOSED POLICY / OWNER APPROVAL + LEGAL/TAX + TECHNICAL VERIFICATION REQUIRED
Applies to: Check a Claim, associated PayPal Orders v2 metadata, D1 access tokens, Resend notifications and separate service-request inquiries.
Evidence: BXC-RETENTION-AUDIT-001.md; BXC-D1-SCHEMA-001.md; privacy.en-ru.md v0.5; inspected Worker source.
This document does not itself change database content, production behavior or published notices.

# PART I — EN (CONTROLLING WORKING TEXT)

## 1. Objective and principles
BoxVia shall retain personal data only for specified purposes and no longer than necessary, subject to applicable legal duties, legal claims and defensible holds. Distinguish operational request content, service-delivery evidence, accounting records, payment reconciliation, security events and communications. A deletion request does not automatically override a legal retention obligation. An accounting obligation does not justify keeping all free-text claim content indefinitely. Restrict access, minimize copies and document each disposition.

## 2. Verified technical baseline
The four D1 application tables are `claims`, `claim_access`, `paypal_orders`, `notification_outbox`. Current reviewed source has no recurring retention cleanup. The existing claim deletion is a failed-token-write rollback only. Token hash verification in reviewed code has no expiry check. Scheduled execution is for notifications, not deletion. Paid-claim notification sends customer email to BoxVia operator through Resend; separate service requests use Resend. Turnstile verification sends a challenge response and connecting IP. No provider-side retention or actual customer-record inspection was performed. Any durations below are **proposed**, not implemented or verified.

## 3. Proposed retention schedule — DECISION REQUIRED
| Category | Trigger | Proposed operational target | Disposal | Exceptions / gate |
|---|---|---|---|---|
| Unpaid abandoned `claims` (claim text, source URL, email, notes) | Created and still unpaid | 30 days | Delete/anonymize dependent operational records safely | Exclude pending disputes, manual review, payment attempts not yet reconciled; approve 30 days |
| Paid claim working content, report URL, service notes | Verified capture + completed delivery | 12 months after delivery | Delete or irreversibly anonymize free text and working copies | Hold for documented disputes/claims; confirm actual service and limitation periods; approve 12 months |
| `claim_access.token_hash` | Delivery and last needed customer access | 90 days after delivery | Revoke/delete hash and deny access | Only after customer access and delivery channel are implemented and tested; approve 90 days |
| `paypal_orders` operational reconciliation fields | Final payment/refund/dispute settlement | Keep necessary accounting/payment evidence for legally required period; do not set a universal technical 30/90-day TTL | Separate minimally necessary accounting evidence from unnecessary operational duplicates | Polish tax/accounting retention and limitation rules must be confirmed by qualified review before setting duration |
| `notification_outbox` sent/failed status, timestamps, errors | Final send outcome | 90 days after final state | Remove error text and stale delivery rows | Preserve minimal proof of required contractual notices if legally necessary; approve 90 days |
| Separate service-request emails / mailbox copies | Inquiry closed | 90 days after closure | Delete mailbox/provider copies where controlled | Extend for contract formation, dispute or legal hold; mailbox process must be inventoried |
| Security/abuse and Turnstile-related records | Event time | No fixed period approved | Apply provider-specific documented schedule | Confirm what is actually logged, provider terms and lawful basis |
| Backups / D1 Time Travel / provider logs | Source deletion | No verified duration | Expire by provider mechanism, not assumed immediate | Verify restoration windows, subprocessors and legal-hold handling |

**Important:** 30/90 days and 12 months are proposed design choices, NOT established legal requirements or promises. Tax/accounting records may require substantially longer retention. Polish tax record retention is commonly linked to the tax-obligation limitation period, with calculation and suspension/interruption rules; this policy deliberately does not assert a blanket five-year deletion date without legal/tax review.

## 4. Lifecycle controls
1. Intake: classify purpose, store minimal data, record notice/terms version when implemented; do not assume current D1 schema captures these.
2. Payment: verify PayPal capture server-side, retain immutable reconciliation evidence, segregate payment records from working content.
3. Fulfillment: record verified delivery time, report access and final disposition status; these timestamps/fields require design and migration.
4. Expiry: evaluate category, status, refunds/chargebacks, disputes, legal hold and legal retention before deletion.
5. Disposal: prefer irreversible removal of claim text, customer email, notes, source/report URLs and access token hashes where no longer required; keep only a justified minimal accounting/dispute record.
6. Audit: produce non-PII counts and action metadata, with restricted operator access. Do not write full customer records into cleanup logs.
7. Restoration: restored backups must reapply approved deletion tombstones or equivalent controls to prevent reappearance of erased data.

## 5. Legal hold and exceptions
A documented legal hold must identify record IDs, basis, approving person, scope, start, review date and release. Hold applies only to necessary fields and is reviewed periodically. Active refunds, chargebacks, complaints, litigation, regulatory preservation and fraud investigations require case-by-case handling. Do not conflate a dispute with unlimited retention.

## 6. Erasure and data-subject requests
Receive via a verified privacy contact (contact address and identity still open). Log request ID, scope, receipt date, applicable legal deadline, identity verification proportionate to risk, affected systems, legal exceptions, decision, actions and response date. GDPR Article 12 generally requires responding without undue delay and within one month, subject to lawful extensions; verify case specifics. GDPR Article 17 erasure is subject to exceptions including legal obligations and legal claims. Provide access, rectification, restriction, objection and portability handling where applicable; avoid unnecessary identification data. Search D1, operator mailbox, Resend, PayPal and relevant copies based on actual controller/processor roles. Do not falsely claim deletion from a provider without confirmation.

## 7. Technical implementation blueprint — NOT AUTHORIZED FOR DEPLOYMENT
- Add approved category/fulfillment/expiry and hold metadata through reviewed D1 migrations; do not blindly add `ON DELETE CASCADE` to payment evidence.
- Define explicit referential-integrity order for `notification_outbox`, `claim_access`, `paypal_orders`, `claims` and any accounting export; inspect actual FK definitions first.
- Implement `dry_run` with category-level counts and reason codes, no customer values; implement guarded execution with idempotency, pagination, per-run limits, transaction boundaries and rollback/restore plan.
- Reject removal of paid-claim accounting evidence until separately preserved under verified legal schedule. Consider field-level redaction/anonymization instead of row deletion.
- Introduce server-enforced access-token expiry/revocation and verify that existing links and reports fail safely after expiry.
- Preserve the notification Cron path; separate retention cleanup scheduling, permissions and alerts. Default cleanup OFF until release gate.
- Build synthetic tests: unpaid age threshold; recent paid; paid completed/delivered; active dispute/hold; refunded; failed notification; token expiry; duplicate runs; partially failed batch; DSAR with accounting exception; backup restoration.
- Validate on non-production dataset, review migration, produce dry-run evidence, obtain BXC/BQS/BCAF/COS release authorization and explicit owner approval before production change.

## 8. Provider and records inventory — OPEN
Cloudflare Workers/D1/Time Travel/Turnstile; PayPal merchant account and transaction records; Resend transactional emails and provider logs; operator mailbox and email retention; GitHub and deployment logs if they contain PII; any reports/files in external storage. For each, record role, purposes, data categories, region/transfers, agreement, retention, deletion mechanism, subprocessor list and contact. Do not infer EU-only storage, zero cookies or zero logs.

## 9. Approval and publication gates
G1 owner approves proposed retention targets and service access period.
G2 Polish/EU legal and tax review approves lawful retention and claims exceptions.
G3 D1 schema and all processors/mailboxes verified; current consent/notice capture gaps mapped.
G4 implementation tested with synthetic data, dry-run, restore/reconciliation and evidence.
G5 privacy wording harmonized EN/RU with implemented behavior.
G6 explicit COS release approval and separate owner authorization for production deployment.
Until all gates are met: **NOT RELEASED; no fixed retention promise in public Privacy Notice.**

# PART II — RU (ТЕХНИЧЕСКИЙ ПЕРЕВОД)

## 1. Цель и принципы
BoxVia хранит персональные данные для конкретных целей и не дольше необходимого с учетом законных обязанностей, возможных требований и документированных ограничений на удаление. Операционное содержание заявки, доказательства оказания услуги, бухгалтерские документы, сверка платежей, события безопасности и переписка имеют разные основания хранения. Запрос на удаление не отменяет законную обязанность сохранять документы. Такая обязанность не оправдывает бессрочное хранение свободного текста заявки. Доступ ограничивается; копии минимизируются; решения об удалении документируются.

## 2. Подтвержденная техническая база
В D1 имеются четыре прикладные таблицы: `claims`, `claim_access`, `paypal_orders`, `notification_outbox`. В проверенном коде отсутствует регулярная очистка. Имеющееся удаление заявки служит только откату после ошибки записи токена. При проверке хеша токена его возраст не учитывается. Планировщик обрабатывает уведомления, а не удаление. Уведомление об оплате передает email клиента оператору BoxVia через Resend; отдельные запросы услуг также используют Resend. Turnstile получает ответ на проверку и IP подключения. Сроки хранения у провайдеров и реальные записи клиентов не проверялись. Все сроки ниже — **предложения**, а не действующие настройки.

## 3. Предлагаемый график хранения — ТРЕБУЕТ РЕШЕНИЯ
| Категория | Начало отсчета | Предлагаемый срок | Действие | Условие |
|---|---|---|---|---|
| Неоплаченные оставленные заявки, включая текст, URL, email, заметки | Создание при сохранении статуса неоплаченной | 30 дней | Удаление/анонимизация связанных операционных данных | Исключить незавершенную сверку платежа, спор и ручную проверку |
| Рабочее содержание оплаченной заявки, URL отчета, заметки | Подтвержденная оплата и завершенная доставка | 12 месяцев после доставки | Удаление/необратимая анонимизация | Учитывать спор и законные требования; срок утвердить |
| Хеш токена доступа | Завершение доставки и необходимого периода доступа | 90 дней после доставки | Отзыв/удаление токена | Только после реализации и проверки механизма доступа |
| Метаданные `paypal_orders` и доказательства оплаты | Окончательное урегулирование платежа, возврата, спора | Законный срок, пока НЕ УСТАНОВЛЕН | Отделить обязательные учетные сведения от лишних копий | Нужна польская налоговая/юридическая проверка |
| История уведомлений, статусы, ошибки | Итог отправки | 90 дней после итогового статуса | Удаление диагностических и устаревших записей | Сохранить необходимые доказательства договорных уведомлений |
| Письма с запросами иных услуг | Закрытие обращения | 90 дней после закрытия | Удаление доступных оператору копий | Исключения для договора, спора и legal hold |
| Данные безопасности и Turnstile | Событие | Не утвержден | По подтвержденным правилам провайдера | Инвентаризация обязательна |
| Резервные копии, D1 Time Travel, журналы провайдеров | Удаление из основной системы | Не подтвержден | По фактическому механизму провайдера | Нельзя обещать немедленное исчезновение |

**30/90 дней и 12 месяцев — проектные предложения, не установленные законом сроки.** Обязательные налоговые и учетные документы могут храниться существенно дольше. Нельзя автоматически устанавливать единый срок в пять лет без проверки правил исчисления, приостановления и прерывания соответствующих сроков в Польше.

## 4. Жизненный цикл
При приеме заявки фиксируются минимально необходимые сведения и, после реализации, версия уведомления и условий. Оплата подтверждается серверной проверкой PayPal. После исполнения фиксируются время доставки и состояние доступа. Перед удалением проверяются платежи, возвраты, споры, правовые ограничения и обязательное хранение. Свободный текст, email, заметки, URL и токены удаляются или анонимизируются, когда основания хранения прекращаются; минимально необходимое учетное доказательство может сохраняться отдельно. Журналы очистки не должны содержать полные клиентские данные. При восстановлении резервной копии ранее удаленные сведения не должны возвращаться в активную обработку.

## 5. Правовое ограничение удаления
Legal hold фиксирует идентификаторы записей, основание, ответственного, объем, дату начала, дату пересмотра и отмены. Он распространяется только на необходимые сведения и пересматривается. Возвраты, chargeback, жалобы, судебные и регуляторные требования оцениваются отдельно; наличие спора не разрешает бессрочное хранение всех данных.

## 6. Запросы субъектов данных
Через проверенный контакт по конфиденциальности принимаются обращения о доступе, исправлении, удалении, ограничении и иных применимых правах. Фиксируются идентификатор обращения, дата, объем, соразмерная проверка личности, системы, исключения, решение, действия и ответ. По статье 12 GDPR общий срок ответа — без неоправданной задержки, обычно не позднее одного месяца, с предусмотренными законом исключениями и продлениями. Право на удаление по статье 17 GDPR не абсолютно: возможны исключения для законной обязанности хранения и защиты правовых требований. Проверяются D1, почта оператора, Resend, PayPal и копии с учетом реальных ролей участников. Нельзя утверждать, что данные удалены у провайдера, без подтверждения.

## 7. План реализации — БЕЗ РАЗРЕШЕНИЯ НА ВЫПУСК
После согласования добавить в D1 метаданные исполнения, истечения сроков и legal hold. До миграций проверить внешние ключи; не удалять каскадно доказательства оплаты. Реализовать режим предварительного расчета (`dry_run`) без вывода персональных данных, ограничение размера пакета, идемпотентность, журнал причин и безопасное восстановление. Для оплаченных заявок прежде отделить законно сохраняемые учетные сведения. Добавить проверку срока действия и отзыв токенов на сервере. Очистку выполнять отдельно от доставки уведомлений, по умолчанию выключить. Проверить синтетические сценарии, споры, возвраты, ошибки, повторные запуски, GDPR-запросы и восстановление копий. Production изменять только после всех разрешений.

## 8. Открытая инвентаризация провайдеров
Cloudflare Workers/D1/Time Travel/Turnstile, PayPal, Resend, почтовый ящик оператора, возможные журналы GitHub и развертывания, хранилища отчетов. Для каждого требуется установить роль, цели, категории данных, географию/передачи, договор, сроки, удаление, субобработчиков и контакт. Не утверждать отсутствие cookies, журналов или передачи за пределы ЕС без проверки.

## 9. Условия утверждения
G1 — владелец утверждает сроки и период доступа.
G2 — польская/европейская юридическая и налоговая проверка.
G3 — проверка схемы D1, провайдеров, почты и версий согласий.
G4 — тестирование реализации на синтетических данных, dry-run, восстановление и сверка.
G5 — синхронизация Privacy Notice EN/RU с реально работающим процессом.
G6 — отдельный COS release и прямое разрешение владельца на production.

**СТАТУС: ВНУТРЕННИЙ ЧЕРНОВИК. ПУБЛИКАЦИЯ И PRODUCTION ЗАПРЕЩЕНЫ ДО ЗАКРЫТИЯ УСЛОВИЙ.**
