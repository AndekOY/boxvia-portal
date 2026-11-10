# BXC-MAILBOX-SMOKE-DEPLOYMENT-001
Status: DRAFT — NOT DEPLOYED — NOT SENT
Date: 2026-11-10

## Isolated staging configuration
Entrypoint: cloudflare/contract-mailbox-smoke-worker-staging.js
Wrangler config: cloudflare/wrangler.mailbox-smoke.staging.jsonc
Worker name: boxvia-mailbox-smoke-staging
Route: POST /internal/mailbox-smoke
Allowed recipient: andek.oy@gmail.com
Default: disabled.
No production routes, PayPal, D1, R2, checkout or actual contracts.

## Operator prerequisites
1. Review the isolated Worker source and verify a Resend sender domain.
2. Obtain explicit approval to deploy staging and to perform one real email send.
3. Configure secret BXC_MAIL_SMOKE_TOKEN (random 32+ characters) and RESEND_API_KEY; configure CONTRACT_FROM to the verified sender. Never commit secrets.
4. Deploy with a Wrangler account authorized for this distinct staging Worker, using `wrangler deploy --config cloudflare/wrangler.mailbox-smoke.staging.jsonc` from repository root (path resolution should be verified locally).
5. Enable BXC_MAIL_SMOKE_ENABLED=true only for the authorized test window; leave disabled otherwise.
6. POST JSON `{"testId":"BXC-MAIL-TEST-20261110A"}` with Authorization: Bearer <secret>. Use a unique ID for a new test.
7. Record provider response; have recipient verify Inbox/Spam. Immediately disable after test.

## Critical limitation
The bearer token is not a one-use token. This Worker does NOT persist an invocation lock; an authorized caller could invoke it more than once. Resend idempotency key reduces duplicates for the same test ID only within the provider's applicable idempotency policy; it does not prove exactly-once delivery. Do not expose credentials. A persistent D1 claim lock is recommended before any public or unattended deployment. The current route should be deployed only after explicit owner authorization.

## RU — технический перевод
Создан отдельный staging Worker с авторизацией по секретному токену, ограничением получателя и выключенным по умолчанию переключателем. Код не подключен к production. Развертывание и реальная отправка еще не выполнялись. Токен пока не одноразовый, поэтому повторный вызов технически возможен; повторная отправка не должна производиться без проверки записей Resend. Для полноценной защиты от повторов потребуется постоянная блокировка в D1.
