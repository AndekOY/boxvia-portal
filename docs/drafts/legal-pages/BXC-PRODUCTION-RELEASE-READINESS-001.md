# BXC-PRODUCTION-RELEASE-READINESS-001
**Status:** DRAFT / NOT PRODUCTION-READY / OWNER APPROVAL REQUIRED
**Date:** 2026-11-10
**Scope:** standardized BoxVia microservices (Check a Claim, One Question Review, Focused AI Governance Review). Technical Pilot excluded.

## Decision
Development of the isolated contract-confirmation pipeline may continue. The owner has explicitly deferred the real mailbox test until deployment to the actual site and does not want a separate staging email test. Do not deploy the mailbox-smoke Worker. This is a testing-sequence decision, **not** permission to deploy production.

## Evidence available
- Isolated Node.js mock CI: D1 immutable snapshot and PDF reference, R2 content hash and conditional write request, Unicode one-page A4 PDF, Resend request and uncertainty handling, manual evidence-gated reconciliation.
- No real Cloudflare D1/R2/Resend integration has been executed. CI passing does not demonstrate provider delivery, production bindings, live checkout acceptance, or compliance with mandatory notices.
- The code is not imported by production worker.js. The D1 migration has not been applied.
- No immutable source-of-truth acceptance archive has been configured; D1 currently records the snapshot hash and metadata, not the full accepted snapshot.

## Required before owner approval to deploy
1. Integrate the accepted order boundary into real checkout, preserving affirmative acceptance evidence, immutable Terms/Schedule/withdrawal annex bytes and versions, and the correct consumer disclosures where applicable.
2. Provide production-safe bindings and secrets for D1, private R2 and Resend, and review the migration against the actual database. Keep R2 objects private.
3. Persist the canonical full accepted snapshot and verifiable acceptance event, with defined retention/access/deletion rules. A SHA-256 alone is insufficient to reconstruct the accepted contract.
4. Establish an explicit deployment-time release gate for real sending. Prevent synthetic or unaccepted orders from invoking dispatch.
5. Define provider-authenticated Resend event processing and manual reconciliation, including authorization and audit evidence; never auto-retry an uncertain send.
6. Validate sender identity, real annex PDF versions, recipient address and correct total/tax disclosures against the checkout. The current validator requires standard prices 20.00/50.00 USD.
7. Confirm that the required notices, checkout consent, privacy disclosures and any applicable mandatory rights are actually present. General applicable-law wording does not replace required notices.
8. Conduct a predeployment static/security review and CI; production release must be explicitly authorized by owner. No separate staging mailbox test is required by owner.

## Postdeployment owner-assisted test
- Use one clearly designated test order and recipient and a safe payment/test mode explicitly approved at release time. Never silently create a paid real order.
- Record order ID, snapshot hash, PDF hash, R2 key (private logs only), Resend ID, timestamp and delivery outcome.
- Owner checks and reports Gmail inbox/spam, sender, subject, exact PDF attachments, readability and any mismatch.
- Check D1 one-send claim and that repeat invocation does not send a duplicate. If uncertain, inspect Resend before retry.
- Correct defects and document a new release only after diagnosis.

## No-go conditions
Missing accepted snapshot/annex bytes, missing mandatory acceptance evidence, exposed R2 objects or secrets, unverified sending authority, or inability to prevent duplicate dispatch. These are technical and operational controls, not a requirement to purchase legal/tax opinions.

## RU — технический перевод
Отдельный тестовый Worker не разворачиваем. Реальную почтовую проверку проводим после утвержденного развертывания на сайте. Текущие автоматические проверки подтверждают только работу изолированных mock-сценариев. Перед релизом необходимо подключить реальный checkout, сохранять полную неизменяемую запись принятого заказа и юридические приложения, настроить закрытый R2, D1, Resend и защиту от повторной отправки. Нормативные вопросы учитываются ссылкой на применимое право, но обязательные уведомления и согласия должны быть реализованы. Развертывание production требует отдельного утверждения владельца.
