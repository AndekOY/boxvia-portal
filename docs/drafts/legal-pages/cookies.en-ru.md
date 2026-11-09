# Cookies & Similar Technologies / Cookies и аналогичные технологии
BXC-LGL-COOKIES v0.1 | FACT-FINDING DRAFT — NOT PUBLISHED
## EN
**Important:** This notice cannot be finalized until the actual production cookie and tracking inventory is complete. No unsupported assertion is made that the website uses only essential cookies or no analytics.
**Potential categories to verify:** necessary session/security controls; Cloudflare Turnstile and related anti-abuse storage; analytics/measurement; third-party PayPal checkout and payment-domain storage; preferences. PayPal's own domain may operate under its own notice; actual integration and responsibility must be assessed.
**Inventory for each item:** name, provider, domain, purpose, lifetime, first/third-party status, whether essential, legal basis and consent mechanism where required.
**Consent:** nonessential cookies or similar access/storage technologies must not be deployed before the consent required by applicable law. Refusal must not be treated as agreement; withdrawal and preference controls must work where consent is required.
**Browser controls:** browser settings may manage storage but are not automatically a substitute for a required site consent mechanism.
**Privacy:** see Privacy Notice for associated personal-data processing, rights, controller and contacts.
**Before release:** audit live website and PayPal/Turnstile integration, identify analytics and other trackers, classify purposes, design controls, verify Polish/EU electronic communications and GDPR requirements, assign effective date.
## RU — Технический перевод
**Важно:** уведомление нельзя завершить до фактической инвентаризации cookies и трекеров production-сайта. Нельзя без проверки утверждать, что используются только необходимые cookies или отсутствует аналитика.
**Проверяемые категории:** техническая сессия и безопасность; Cloudflare Turnstile; аналитика; хранение данных на домене PayPal; настройки пользователя. Для PayPal может действовать собственное уведомление; необходимо проверить реальную интеграцию.
**По каждому элементу:** имя, провайдер, домен, назначение, срок, сторона установки, обязательность, правовое основание и необходимость согласия.
**Согласие:** необязательные технологии хранения и доступа не запускаются до получения требуемого законом согласия. Отказ не означает согласия; отзыв и изменение настроек должны работать, когда это требуется.
**Браузер:** настройки браузера не всегда заменяют обязательный механизм согласия на сайте.
**Данные:** связанные операции с персональными данными раскрываются в Privacy Notice.
**До выпуска:** аудит сайта, PayPal, Turnstile, аналитики, классификация технологий, механизм согласий, проверка польского и европейского права, дата действия.

## v0.2 — Verified-from-code inventory seed (2026-11-09) / Подтвержденные элементы по коду
### EN
**Cloudflare Web Analytics:** the `static.cloudflareinsights.com/beacon.min.js` script is included in inspected site HTML. Whether the deployed analytics setup writes cookies, reads device storage or needs prior consent in the actual jurisdiction/configuration is **NOT VERIFIED**.

**Cloudflare Turnstile:** `challenges.cloudflare.com/turnstile/v0/api.js` is included on the Check a Claim form; the server submits its token to siteverify and explicitly includes `remoteip` for the claim flow. Exact cookies, technical storage, domains, lifetime and exemptions are **NOT VERIFIED**.

**Browser sessionStorage (confirmed in scripts):** `boxvia-claim-{requestId}` holds the claim capability token; `boxvia-order-{requestId}` holds the PayPal order ID on the thank-you page. These are **not HTTP cookies**, but their use is relevant to terminal-equipment storage rules and data security. Their practical lifetime is browser-session-dependent; do not assert a guaranteed deletion time.

**PayPal:** users are redirected to PayPal for payment. The BoxVia source cannot establish the full cookie/storage inventory on PayPal's own domain. Verify actual checkout/return traffic before allocating controller responsibilities.

**Audit worksheet (OPEN):** for each storage/network item capture URL, stage, domain, name, type, purpose, initiator, lifetime, necessity, legal basis, consent requirement, proof screenshot/HAR (redacted), and vendor reference. Stages: fresh browser before interaction; first page load; Turnstile challenge; claim submission; PayPal redirect; cancel; payment return; analytics beacon; mobile; private mode. Never run a real payment solely for audit without separate approval.

### RU — технический перевод
**Cloudflare Web Analytics:** на проверенных страницах подключен скрипт `static.cloudflareinsights.com/beacon.min.js`. Фактическая запись cookies или другого хранилища и требования к согласию **НЕ ПРОВЕРЕНЫ**.

**Cloudflare Turnstile:** на форме Check a Claim подключен `challenges.cloudflare.com/turnstile/v0/api.js`. Сервер проверяет токен; в потоке Check a Claim явно передает IP-адрес. Названия, сроки и необходимость конкретных cookies/записей хранилища **НЕ ПРОВЕРЕНЫ**.

**Браузерное sessionStorage:** скрипты используют `boxvia-claim-{requestId}` для токена доступа и `boxvia-order-{requestId}` для номера заказа PayPal. Это **не HTTP cookies**, но эти записи необходимо оценить с точки зрения правил хранения данных на устройстве и безопасности. Не обещать точный срок автоматического удаления.

**PayPal:** клиент перенаправляется на платежную страницу PayPal. Код BoxVia не раскрывает полный перечень cookies на домене PayPal; необходима проверка реального перехода и возврата.

**Протокол проверки (ОТКРЫТО):** для каждого элемента фиксировать этап, домен, имя, тип, назначение, инициатор, срок, необходимость, правовое основание, требование согласия и обезличенное доказательство. Этапы: чистый браузер, первая загрузка, Turnstile, отправка формы, переход PayPal, отмена, возврат, аналитика, мобильный и приватный режим. Реальный платеж без отдельного разрешения не выполнять.


## v0.3 — Live checkout observations (2026-11-09) / Наблюдения платежной страницы
### EN
Owner screenshots show a redirect to `paypal.com/pay` in Live mode. One browser/buyer context showed account login/creation only; another showed a debit/credit-card option. This establishes **checkout presentation variability**, not a verified inventory of cookies or device storage. The screenshots do not show browser DevTools Storage/Network and cannot prove whether consent is needed for any particular technology. PayPal Account Optional was already On. Do not imply that turning it on changed the outcome.

### RU — технический перевод
Скриншоты владельца подтверждают переход на `paypal.com/pay` в Live. В одном пользовательском контексте отображались вход и создание аккаунта, в другом — оплата дебетовой или кредитной картой. Это подтверждает **различие платежного интерфейса**, но не состав cookies и браузерного хранилища. На скриншотах нет данных DevTools Storage/Network, поэтому необходимость согласия на конкретные технологии не установлена. PayPal Account Optional уже был включен; нельзя утверждать, что его переключение изменило поведение.

**Open / Открыто:** провести безопасную инвентаризацию cookies, sessionStorage, localStorage, IndexedDB, сетевых запросов Cloudflare Web Analytics и Turnstile без реальной оплаты и без раскрытия платежных токенов.
