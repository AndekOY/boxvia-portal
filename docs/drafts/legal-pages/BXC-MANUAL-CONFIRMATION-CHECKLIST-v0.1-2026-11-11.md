# BXC — Manual paid-order confirmation checklist v0.1
Status: INTERNAL DRAFT — DO NOT USE FOR LIVE ORDERS UNTIL RELEASE GO
Date: 2026-11-11

## Gate 0 — do not begin without release approval
Approved contract documents, exact offer and price/tax disclosure, tested payment flow, customer acknowledgments, consumer-law and GDPR gates, and explicit owner GO must all be present. Current state: HOLD.

## For each paid order
[ ] Identify order ID and customer's verified checkout email.
[ ] Read the PayPal merchant transaction directly. Do not rely on PayPal notification email or a customer screenshot.
[ ] Verify COMPLETED capture, exact amount/currency, matching order ID, no prior processing/refund and no duplicate fulfillment.
[ ] Check acceptance event and four approved document version IDs, exact SHA-256 hashes, consent timestamps and optional early-performance choices.
[ ] Prepare complete copies of the *same four documents accepted by this customer*, not merely mutable links.
[ ] Send manually from owner Gmail to checkout email. Include full seller identity, order description/scope, total price/tax treatment, payment reference, contractual start/delivery conditions, complaints/contact and withdrawal information, including any lawful early-performance request and acknowledgment.
[ ] Save sent email in controlled evidence register: date/time with timezone, recipient, subject, Gmail Message-ID if available, attachment filenames/hashes, PayPal capture ID and operator. Sent status does not prove inbox delivery.
[ ] Monitor bounce/reply and handle failed delivery. Do not begin performance where confirmation or statutory commencement conditions remain unsatisfied.
[ ] Handle withdrawal, cancellation, refund and complaints under applicable Polish/EU law. No automatic loss of withdrawal right merely because payment was captured.

## Minimal email body (EN, to complete only from verified order)
Subject: BoxVia — Check a Claim | Contract confirmation | [ORDER ID]

Hello,

We confirm receipt and verification of your payment for BoxVia Check a Claim.

Order reference: [ORDER ID]
Service and agreed scope: [EXACT ACCEPTED DESCRIPTION]
Total paid: [AMOUNT, CURRENCY, TAX TREATMENT]
Payment reference: [PAYPAL CAPTURE REFERENCE]
Contract formation date and time: [VERIFIED TIME AND TIMEZONE]
Start and delivery conditions: [ORDER-SPECIFIC LAWFUL CONDITIONS]
Early-performance request: [YES/NO, ACCORDING TO ACCEPTANCE RECORD]

Attached are the four complete documents accepted or acknowledged during checkout:
1. General Service Terms [VERSION].
2. Consumer and Protected Sole Trader Schedule [VERSION].
3. Withdrawal Notice and Model Form [VERSION].
4. Privacy Notice [VERSION].

Contact and withdrawal requests: [VERIFIED PUBLIC CONTACT].

BoxVia
[VERIFIED SELLER LEGAL NAME AND ADDRESS]

## RU technical translation (not a substitute for EN email)
Тема: BoxVia — Check a Claim | Подтверждение договора | [НОМЕР ЗАКАЗА]

Здравствуйте.

Подтверждаем получение и проверку оплаты услуги BoxVia Check a Claim.

Номер заказа: [НОМЕР].
Услуга и согласованный объем: [ТОЧНОЕ ОПИСАНИЕ].
Общая сумма оплаты: [СУММА, ВАЛЮТА, НАЛОГОВЫЙ РЕЖИМ].
Платежный идентификатор: [PAYPAL CAPTURE].
Дата и время заключения договора: [ПОДТВЕРЖДЕННОЕ ВРЕМЯ И ЧАСОВОЙ ПОЯС].
Условия начала и предоставления результата: [УСЛОВИЯ КОНКРЕТНОГО ЗАКАЗА].
Запрос досрочного начала оказания услуги: [ДА/НЕТ ПО ЗАПИСИ СОГЛАСИЙ].

Прилагаются четыре полных документа, принятых или подтвержденных при оформлении заказа: общие условия, приложение для потребителей и защищенных индивидуальных предпринимателей, уведомление и форма отказа от договора, уведомление о конфиденциальности.

Контакт для обращений и отказа от договора: [ПОДТВЕРЖДЕННЫЙ КОНТАКТ].

BoxVia
[ПОДТВЕРЖДЕННЫЕ ИМЯ И АДРЕС ПРОДАВЦА]

## Architecture exclusions
No Resend. No Gmail API/OAuth automated sending. No mail-related API keys or DNS setup. PayPal notifications are signals only, not payment evidence. No real sending until owner GO.
