# BXC-TAX-CAC-001 — Check a Claim tax disclosure | v0.1 | EN/RU
Date: 2026-11-10
Status: INTERNAL IMPLEMENTATION DRAFT — NOT A TAX RULING OR RELEASE
Basis: BXC-TAX-001, BXC-ORDER-001, BXC-001/005; owner-approved final price rule; CEIDG 2026-11-06, Polish VAT register and VIES 2026-11-09.

## 1. Fixed commercial terms / Утвержденные коммерческие условия
EN: The final amount charged by BoxVia for Check a Claim is USD 20.00. Any VAT that BoxVia is legally required to collect is included in this price, not added on top. A recipient's own reverse-charge obligations, if applicable, are separate from the amount collected by BoxVia.
RU: Окончательная сумма, взимаемая BoxVia за Check a Claim, составляет 20,00 USD. VAT, который BoxVia обязана начислить по закону, включается в эту цену и не добавляется сверх нее. Самостоятельные налоговые обязанности получателя при reverse charge, если применимо, отделены от суммы, взимаемой BoxVia.

## 2. Confirmed seller status / Подтвержденный статус исполнителя
EN: Seller: Andrey Ekhmenin – BoxVia; NIP 8513329301; REGON 541534837; VAT-UE PL8513329301; registered postal address ul. Żwirki i Wigury 13/4, 71-176 Szczecin, Poland; contact and complaints: andrzej.ekhmenin@gmail.com. CEIDG status active as of 2026-11-06; Polish VAT status czynny and VIES valid as of 2026-11-09. These are dated registry results, not a live continuous warranty.
RU: Исполнитель: Andrey Ekhmenin – BoxVia; NIP 8513329301; REGON 541534837; VAT-UE PL8513329301; почтовый адрес ul. Żwirki i Wigury 13/4, 71-176 Szczecin, Polska; обращения и жалобы: andrzej.ekhmenin@gmail.com. CEIDG: активная деятельность по состоянию на 06.11.2026; польский VAT: czynny и VIES: valid по состоянию на 09.11.2026. Это результаты проверок на конкретные даты.

## 3. Order-level decision matrix / Матрица налогового решения по заказу
| Customer / Клиент | Provisional treatment / Предварительная модель | Required evidence / Необходимое подтверждение | Gate |
| --- | --- | --- | --- |
| Polish consumer, human-reviewed service | Normally Polish VAT within USD 20 gross at applicable rate | Service classification, current VAT rate, invoice and FX treatment | HOLD until SKU decision |
| Polish business | Normally Polish VAT within USD 20 at applicable rate | Business identity, exact supply and rate | HOLD until SKU decision |
| EU taxable business outside Poland | General B2B place-of-supply may be customer's country; reverse charge may apply | Valid VAT ID/VIES where relevant, establishment, customer status, exception analysis, invoice note | HOLD until order decision |
| EU consumer outside Poland | Human-performed service may follow general B2C place-of-supply; exceptions must be checked | Consumer country, actual degree of automation, special rules | HOLD until order decision |
| Non-EU consumer | Special place-of-supply rules may apply to consultancy; do not assume zero worldwide tax | Customer location, exact service classification, foreign indirect tax | HOLD until order decision |
| Fully automated AI output | Could qualify as electronically supplied service; separate tax route | Degree of human involvement, customer location, OSS/foreign tax analysis | HOLD / separate SKU classification |

## 4. Conditional customer wording / Условный текст для клиента
EN: “Total payable to BoxVia: USD 20.00. Applicable VAT, if chargeable by BoxVia, is included in this total. The tax treatment and any legally required breakdown or reverse-charge notice will be stated in your order confirmation/invoice after verification of the customer and service classification. No additional VAT will be charged by BoxVia above USD 20.00 without a new expressly agreed order.”
RU: «Итого к оплате BoxVia: 20,00 USD. Применимый VAT, если BoxVia обязана его начислить, включен в эту сумму. Налоговый режим и предусмотренная законом разбивка либо указание reverse charge будут отражены в подтверждении заказа/счете после проверки категории клиента и услуги. BoxVia не начисляет VAT сверх 20,00 USD без нового прямо согласованного заказа».

**NOT FOR LIVE CHECKOUT:** This generic wording does not replace a transaction-specific mandatory tax disclosure before a binding consumer purchase. If required tax treatment is unresolved, block the paid order and escalate; do not accept payment and promise to determine tax afterward.

## 5. Owner/accountant decision required / Требуемое решение
- Confirm Check a Claim is in fact a human-performed individualized analytical service, not an automated electronic service.
- Confirm PKWiU/service classification and Polish VAT rate for the defined Polish consumer transaction.
- Confirm place-of-supply and reverse-charge routing for the specific cross-border cases enabled at launch.
- Confirm invoice currency conversion, rounding, KSeF obligations and applicable consumer price presentation.
- Approve exact final checkout disclosure by customer class; freeze version and hash with other contract documents.

Disposition: TAX REGISTRATION VERIFIED; SKU VAT CLASSIFICATION AND CHECKOUT RELEASE NOT YET VERIFIED.
