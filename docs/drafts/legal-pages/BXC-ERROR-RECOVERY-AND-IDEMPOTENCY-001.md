# BXC-ERROR-RECOVERY-AND-IDEMPOTENCY-001
**Status:** DRAFT / STAGING ONLY / RELEASE HOLD
**Date:** 2026-11-10

## Scope
Technical stage 4 for Check a Claim, One Question Review, Focused AI Governance Review. No Technical Pilot. No production integration.

## Verified design controls (subject to CI)
1. D1 order ID is unique; accepted snapshot SHA-256 cannot be replaced by another accepted order.
2. Registered PDF bytes are reused on retries, including Unicode rendering. A changed or missing R2 PDF fails closed.
3. R2 object key contains order ID and content SHA-256; conditional create-only put is requested. Actual Cloudflare R2 conditional-write behavior still requires staging integration verification.
4. D1 PDF reference must match order ID and SHA-256; conflicting registration fails.
5. Email claim is atomic conditional D1 update from pending to sending; repeated dispatch cannot claim the same pending job.
6. Transport failure or unknown Resend response leaves status sending, blocking automatic retries.
7. Manual provider-accepted reconciliation requires independently checked authenticated provider evidence and a matching order/message ID; it does not send email.
8. Reconciliation cannot claim delivered. Provider acceptance is not recipient delivery.

## Open limits
- A human must independently validate evidence.source=resend_authenticated and evidence.verified=true; the function cannot authenticate arbitrary caller-provided flags. Do not expose it to an unauthenticated HTTP endpoint.
- A message proven NOT accepted by Resend requires a separately designed, authorized recovery path; none exists yet. A bare timeout is insufficient proof.
- Real Resend idempotency retention/semantics, webhook signature verification and delivery tracking remain unverified.
- R2 concurrent write and D1 concurrency behavior are mocked; no real staging infrastructure has been configured.
- Immutable full acceptance evidence, legally required notices and actual checkout consent remain separate unfinished work.
- No claim of exactly-once email delivery is made.

## RU — технический перевод
Повторный запуск использует исходный PDF после проверки SHA-256. При неопределенном ответе Resend автоматическая повторная отправка запрещена. Сверка возможна только на основании независимо проверенного подтверждения провайдера, привязанного к заказу и идентификатору письма. Статус принятия провайдером не означает доставку получателю. Реальные интеграционные проверки R2, D1 и Resend еще не выполнены.

## Release
Continue draft and mock tests without paid external legal/tax opinions as automatic development blockers, per BXC-JURISDICTIONAL-REFERENCE-POLICY-001. Production changes require separate owner approval and demonstrated technical readiness.
