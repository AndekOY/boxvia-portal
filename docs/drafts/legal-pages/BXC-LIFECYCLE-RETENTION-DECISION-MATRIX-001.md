# BXC-LIFECYCLE-RETENTION-DECISION-MATRIX-001
## v0.1 | 2026-11-09 | INTERNAL DRAFT / RELEASE HOLD

Scope: Check a Claim / Cloudflare Worker / D1 / PayPal / BXC. This is a design matrix, not an authorized migration or production change.

### Evidence boundary
Reviewed `cloudflare/worker.js`, `cloudflare/paypal.js`, and `BXC-DATA-RETENTION-ERASURE-POLICY-001.md` on `draft/bxc-legal-trust-v01`. Owner-reported local SQL backup reconciliation on 2026-11-09: 22 claims (20 pending, 2 paid), 20 PayPal orders (18 CREATED without capture, 2 COMPLETED with capture), 21 claim_access, 2 outbox, FK errors 0. No direct production data inspection or live PayPal reconciliation was performed.

### Verified current transitions
| Event | Current claims.status | Current claims.payment_status | PayPal order | Evidence / caveat |
|---|---|---|---|---|
| Intake | `new` | `pending` | none | Worker INSERT |
| Order creation | unchanged | unchanged | `CREATED` | PayPal order persisted |
| Capture verification | unchanged (`new` if initially new) | `paid` | `COMPLETED`, capture_id | PayPal server GET verifies order, custom_id, amount/currency, capture; D1 batch |
| Paid notification enqueue | unchanged | `paid` | unchanged | `claim_paid` outbox, best-effort after payment |
| Fulfillment / delivery | **not established in reviewed code** | unchanged | unchanged | no verified delivery transition/time |
| Expiration / erasure | **not implemented** | unchanged | unchanged | no retention executor |

`claims.status='new'` for paid claims is consistent with reviewed code; it does not establish completed fulfillment.

### Proposed lifecycle decision matrix (NOT IMPLEMENTED)
| Lifecycle category | Entry conditions | Permitted next step | Retention clock | Gate / decision |
|---|---|---|---|---|
| Intake pending / no order | pending claim, no PayPal order | Await checkout; investigate abandonment | created_at; proposed 30 days | reconciliation, hold/dispute clearance, policy approval; do not delete now |
| Pending / CREATED order | pending claim with CREATED order, no verified capture | Reconcile with PayPal; retry safely | not sufficient alone | block deletion while payment state unresolved |
| Paid / unfulfilled | verified completed capture, paid claim, no confirmed delivery | Fulfill and document delivery | **cannot start delivery-based clock** | preserve accounting evidence and claim working material |
| Delivered / paid | verified delivery timestamp and result | Provide approved access period, then evaluate retention | proposed 12 months working content; 90 days token after delivery | delivery evidence and legal/tax approval required |
| Refund / dispute / chargeback | authoritative provider event + case evidence | Manual review, restriction/hold as needed | suspend automatic disposition | design new statuses and controls first |
| Unpaid aged candidate | older than approved threshold, no PayPal/outbox rows, reconciled, no hold/dispute | Review-only candidate | proposed 30 days from creation | fail closed; no executor authorized |
| DSAR / erasure request | verified request, purpose-specific assessment | Delete or restrict only legally eligible data | statutory response workflow | accounting/legal claims exceptions; audit decision |
| Backup-restored record | restored from older snapshot | Apply tombstone/suppression reconciliation | not reset by restore | prevent reappearance of erased personal data |

### Proposed state architecture
Separate axes rather than overloading `claims.status`:
- **Payment**: `pending` / `paid` (existing); refunds and disputes require a designed, verified extension, not invented current states.
- **Fulfillment**: `new` (existing); proposed `in_review`, `delivered`, `closed` require definition, migration and tests.
- **Retention**: independent control record with hold, dispute, reconciliation and approval fields; default fail closed.
- **Access**: token issuance exists, but no verified server-side expiry or delivery-linked revocation.

### Minimum design changes before any automated retention
1. Establish authoritative delivery evidence and `delivered_at`; define who records delivery and its auditability.
2. Define fulfillment transition contract and idempotency; preserve payment axis independence.
3. Reconcile PayPal CREATED orders against provider before abandonment decisions; distinguish unapproved, canceled, expired and captured states.
4. Introduce legal hold/dispute/reconciliation metadata with fail-closed defaults and documented operator signoff.
5. Separate operational claim text from required accounting/payment records; no indiscriminate cascade deletion.
6. Implement access-token expiry and revocation only after customer access requirements are approved.
7. Add synthetic test cases for all transitions, retries, missing notifications, refunds, disputes, and restored backups.
8. Obtain owner + Polish legal/tax + BXC/COS approvals before migration, production deployment, or any erasure.

### Snapshot-specific outcome
22/22 claims are within proposed 30-day window on 2026-11-09; therefore zero age-based unpaid candidates. 18 pending claims have CREATED orders and require reconciliation, 2 pending claims have no order, 2 paid claims have completed captures. No claim is authorized for deletion.

### Release gate
INTERNAL DRAFT / RELEASE HOLD. No production Worker/D1 modification, migration, deletion, merge, or publication authorized.

---

# RU — ТЕХНИЧЕСКИЙ ПЕРЕВОД

## Подтвержденная модель
При приеме заявки Worker записывает `claims.status='new'` и `payment_status='pending'`. Создание PayPal-заказа не меняет эти поля. После серверной проверки захвата платежа изменяется только `payment_status='paid'`, а заказ получает `COMPLETED` и `capture_id`. Поэтому `status='new'` у двух оплаченных заявок соответствует текущему коду, но не подтверждает исполнение услуги.

## Проект матрицы решений
| Категория | Условие | Действие | Ограничение |
|---|---|---|---|
| Неоплаченная без заказа | pending, PayPal отсутствует | Ожидание / оценка оставленной заявки | 30 дней — только предложение; нужны сверка, отсутствие споров и hold |
| Неоплаченная с CREATED | заказ создан, capture не подтвержден | Сверка с PayPal | До сверки удаление заблокировано |
| Оплаченная без доставки | paid, capture подтвержден | Исполнение услуги | Срок после доставки еще не начался |
| Оплаченная с доставкой | доставка документирована | Хранение по категориям | 12 месяцев рабочего содержания и 90 дней токена — предложения |
| Возврат / спор | подтвержденное событие провайдера | Ручное решение | Нужны отдельные состояния и legal hold |
| Возрастной кандидат | истек утвержденный срок, нет связанных PayPal/outbox, все разрешения подтверждены | Только предварительная оценка | Исполнитель удаления не разрешен |
| Запрос GDPR | проверенный запрос и основания | Раздельное решение по категориям данных | Учетные и правовые исключения |
| Восстановление копии | данные из прежнего снимка | Сверка с реестром ранее удаленных записей | Исключить повторное появление |

## Обязательные следующие решения
Нужно определить подтверждаемое событие доставки и `delivered_at`, отделить платежный статус от исполнения, согласовать сверку PayPal, установить fail-closed контроль споров и legal hold, определить срок доступа и проверить польские учетные обязанности.

На снимке от 09.11.2026 нет заявок старше предложенных 30 дней; удаление не разрешено.

**INTERNAL DRAFT / RELEASE HOLD.**
