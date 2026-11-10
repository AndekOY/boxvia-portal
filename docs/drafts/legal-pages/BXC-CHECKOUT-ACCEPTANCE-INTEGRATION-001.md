# BXC-CHECKOUT-ACCEPTANCE-INTEGRATION-001
Status: DRAFT — NO PRODUCTION CHANGE — NO MIGRATION APPLIED
Date: 2026-11-10

## Existing checkout boundary discovered
The repository currently has a staged PayPal checkout for **Check a Claim** at 20.00 USD only. `assets/paypal-checkout-staged.js` is not loaded by the live thank-you page. `cloudflare/paypal.js` verifies PayPal capture against claim ID, USD 20.00 and COMPLETED, then updates claims and a notification outbox. It does **not** capture affirmative acceptance of a versioned offer, schedule and withdrawal notices. The current claim intake's `terms_acknowledgement` boolean is insufficient evidence for the new contract archive.

## Draft implementation
`cloudflare/contract-checkout-acceptance-draft.js` adds an isolated function for writing the **full canonical contract snapshot**, SHA-256 and a separate server-side acceptance evidence record. It requires evidence explicitly marked as independently verified by a trusted server checkout flow. **This flag is an internal caller contract, not a cryptographic verification or a public API.** Do not pass client-provided `verified: true` directly to it. Existing records cannot be silently replaced with a different snapshot or event.

`cloudflare/migrations/contract-acceptance-archive-draft.sql` adds an independent table with no-update/no-delete triggers. It is NOT executed. These triggers require an explicit data-retention and lawful-erasure design before production use.

## Missing for real checkout
1. Final accepted Terms, Schedule and withdrawal PDF bytes, versions and hashes.
2. Server-issued checkout session and one-time acceptance event with authenticated customer capability; server-recorded timestamp and exact accepted versions.
3. Transactional link between accepted checkout session, existing claim ID and PayPal order/capture. Payment is not acceptance.
4. Support for the two 50.00 USD services: current PayPal code and schema hardcode 20.00 USD.
5. D1/R2/Resend bindings, migration review, privacy/retention and authenticated operator recovery.
6. End-to-end checkout wiring and production deployment only after explicit release authorization.

## RU — технический перевод
В действующем коде PayPal реализован только платеж за Check a Claim на 20 USD, причем фронтенд еще не активирован. Подтвержденный платеж не доказывает принятие договора. Добавлен изолированный черновой модуль хранения полной неизменяемой версии принятого заказа и свидетельства принятия, а также неисполненная миграция D1. Модуль не вызывается из production Worker. Для подключения нужны серверная фиксация согласия, юридические PDF, связь с PayPal и отдельное решение о хранении персональных данных.
