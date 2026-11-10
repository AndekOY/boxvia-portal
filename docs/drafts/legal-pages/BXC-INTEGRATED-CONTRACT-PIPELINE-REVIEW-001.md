# BXC — Integrated contract pipeline review v0.1
**2026-11-10 | STAGING CODE ONLY | RELEASE HOLD**

## New module
`cloudflare/contract-pipeline-staging.js` composes the isolated snapshot validator, one-page English A4 PDF renderer, D1 confirmation store, private R2 adapter, and Resend customer attachment adapter. It is **not imported by** `cloudflare/worker.js` and has no public route, deployed binding or scheduled trigger.

## Processing
1. Caller supplies verified legal acceptance, accepted order snapshot and immutable PDF annexes.
2. Validate required annex types (terms, schedule, withdrawal), version references and SHA-256 hashes.
3. Generate a single-page A4 English confirmation with the service title and fixed service footer.
4. Validate all PDF attachment headers and aggregate size before storage.
5. Register immutable order snapshot in D1; store PDF privately in R2 using a content-addressed key; record PDF hash and object key in D1.
6. In a separate, explicitly gated dispatch call, recheck accepted annexes and stored PDF integrity, claim an email lease, send attachments via Resend and record **provider_accepted** only.

## Outstanding release blockers
- `acceptanceVerified` is currently a **caller-supplied boolean**, not independent evidence of legally valid acceptance. Never expose it to a client request or derive it from payment alone.
- The real checkout does not yet record all necessary consent/version data.
- The renderer currently rejects non-ASCII glyphs; real Polish personal names and addresses must not be corrupted. Use a reviewed Unicode font before customer use.
- D1 migration has not been applied and `CONTRACT_R2` is not configured. Private R2 bucket provisioning, retention, deletion and access policy are pending.
- `prepare` spans D1 and R2, which is not a cross-service atomic transaction; implement reconciliation for partial failures.
- Resend webhook verification, event deduplication and delivered/bounced transitions are not implemented. Provider acceptance is not delivery.
- Existing Resend idempotency key is based on order ID only; preserve identical immutable attachments on retries and reconcile uncertain provider responses.
- Accepted annexes are caller-supplied on each dispatch. Immutable archive/retrieval and version pinning must be implemented.
- No test suite has been executed against the new integrated module, nor against a real staging Worker/D1/R2/Resend environment.
- Legal review: Polish consumer rights, withdrawal, service classification, tax/VAT, GDPR, identity/contact and contract formation.
- No production modifications or deployment. Technical Pilot excluded.

## RU — технический перевод
Создан изолированный модуль, объединяющий проверку принятого заказа, одностраничный EN PDF, хранение R2, учет D1 и отправку Resend. Реального запуска и тестирования пока нет. Главные блокеры: юридически подтвержденный факт заключения договора, Unicode в реквизитах, настройка R2, согласованные приложения, обработка частичных ошибок и подтверждение доставки. RELEASE HOLD.
