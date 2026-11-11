# BXC — Ordinary Gmail provider assessment
Date: 2026-11-11
Status: INTERNAL FACTUAL RECORD — RELEASE HOLD

## Owner-confirmed fact
The BoxVia mailbox intended for manual customer contract confirmations is an ordinary consumer Gmail account (@gmail.com), NOT Google Workspace. This fact is confirmed by the owner in the BXC conversation on 2026-11-11.

## Consequences
- Do not claim that the Google Workspace Data Processing Addendum applies to this mailbox.
- Do not claim an Article 28 GDPR processor contract with Google for this ordinary Gmail account without direct evidence.
- The ordinary Gmail privacy policy and consumer service terms are not automatically equivalent to a business processor agreement.
- Whether Google acts as an independent controller, processor or in other roles for particular data flows needs a documented assessment; do not assert that a privacy policy link alone satisfies Article 28.
- Actual sending, retention, recipient information, email headers and any third-country transfers have not been operationally verified.
- A durable-medium confirmation to the customer's email may be technically feasible, but legal sufficiency depends on complete and timely contents and demonstrable delivery.

## Minimax recommendation
Prefer a verified business email delivery service with applicable data-processing terms for live BXC contract confirmations (e.g., existing Resend integration if its DPA and account terms are verified), or use Google Workspace only after its applicable DPA and actual mailbox are confirmed.
Do not force a provider switch in sandbox without owner approval.
Keep transaction evidence in the separate controlled BoxVia system; do not rely on Gmail alone as a contract evidence repository.

## Draft privacy wording (EN, conditional)
'We use an email service provider to send contract confirmations and respond to customer requests. The provider and any applicable international-transfer safeguards are identified in our current privacy information.'
This is a placeholder only; **not sufficient as a final GDPR Article 13 notice** until the actual provider and legal basis are established.

## RU technical translation
'Мы используем поставщика электронной почты для отправки подтверждений договора и ответов на обращения клиентов. Поставщик и применимые гарантии международной передачи данных указываются в актуальной информации о конфиденциальности.'
Это только рабочая формулировка, не окончательное уведомление по статье 13 GDPR.

## Remaining gate
Choose and verify a lawful production mail provider and DPA/controller role, retention, transfers and actual dispatch evidence. BXC release remains HOLD; no production email or payments.
