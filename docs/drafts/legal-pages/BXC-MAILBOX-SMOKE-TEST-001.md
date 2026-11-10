# BXC-MAILBOX-SMOKE-TEST-001
Status: DRAFT / NOT SENT / NO PRODUCTION DEPLOYMENT
Date: 2026-11-10
Recipient allowlist: andek.oy@gmail.com

## Purpose
Verify a single Resend provider acceptance and manual Gmail receipt using a synthetic email. This is a transport smoke test, **not** the complete D1 → R2 → PDF annex → Resend → Gmail contract workflow.

## Prerequisites
- Separate staging Worker or operator-controlled execution context; no route is currently registered.
- Verified Resend sender and staging RESEND_API_KEY (secret, never commit).
- BXC_MAIL_SMOKE_ENABLED=true and BXC_MAIL_SMOKE_RECIPIENT=andek.oy@gmail.com.
- Operator explicitly authorizes exactly one invocation with a unique BXC-MAIL-TEST-* identifier.
- Confirm the sending domain, quota and Resend account status.
- Do not send automatically from GitHub Actions.

## Invocation
Import sendControlledMailboxTest from cloudflare/contract-test-send-staging.js in an isolated staging-only harness, pass env and a unique testId. Do not expose the function to public unauthenticated HTTP. Do not reuse the test ID for a second test without inspecting provider records.

## Safety
No checkout, legal acceptance, real order, D1 record, R2 object or contract PDF is created. The subject and body explicitly state NO CONTRACT / NO PAYMENT. The recipient is hardcoded and allowlisted. A single API call is attempted. An uncertain result is not automatically retried.

## Evidence to record
Test ID; UTC invocation time; provider response ID/status or error; Gmail receipt time; Gmail subject; sender; spam/inbox classification; optionally screenshot with private headers redacted. A Resend acceptance ID alone does not prove Gmail delivery.

## Follow-up
After smoke-test success, separately implement and authorize a full end-to-end staging contract test with synthetic acceptance and immutable legal annex fixtures. Do not falsely assert actual contractual acceptance.

## RU — технический перевод
Проверка предназначена только для одного тестового письма на andek.oy@gmail.com. Отправка еще не выполнялась. Не создаются договор, заказ, платеж, запись D1 или объект R2. Письмо явно обозначено как технический тест. Для запуска нужны отдельная staging-среда, подтвержденный отправитель Resend, секретный API-ключ и разрешение на однократную отправку. При неопределенном результате повторная отправка запрещена до проверки записи у провайдера.
