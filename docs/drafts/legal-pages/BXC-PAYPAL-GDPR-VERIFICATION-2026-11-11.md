# BXC — PayPal GDPR and payment data verification
Date: 2026-11-11
Status: PRIMARY PUBLIC DOCUMENTS + SOURCE REVIEW COMPLETE; MERCHANT ACCOUNT UNVERIFIED; HOLD

## Sources
- PayPal Poland User Agreement https://www.paypal.com/pl/legalhub/paypal/useragreement-full (public page searched 2026-11-11; search result reports last update 2026-11-04; separately opened cache reports 2026-05-06 — verify live effective version at release).
- PayPal Poland Privacy Statement https://www.paypal.com/pl/legalhub/paypal/privacy-full (search result reports 2026-10-12; separately opened cache reports 2026-05-06 — verify live effective version at release).
- GitHub cloudflare/paypal-contract-wired-draft.js, draft/bxc-legal-trust-v01, source inspected 2026-11-11.

## Findings from public PayPal documents
- The Polish User Agreement applies to PayPal business accounts; contracting entity is PayPal (Europe) S.à r.l. et Cie, S.C.A., Luxembourg.
- PayPal describes collecting payer identifiers, transaction and technical data, financial information and conducting its own risk/fraud and compliance processing. Do not imply BoxVia controls PayPal's entire processing.
- PayPal states retention criteria for its own customer data, including the relationship plus up to 10 years or a period required by applicable local law, subject to exceptions. This is **not** BoxVia's retention period.
- PayPal describes automated risk/fraud decisions; these are PayPal's decisions, not proof of BoxVia automated decisions.
- International transfers and onward recipients require PayPal's own published terms, not an assumption of EU-only processing.

## Findings from BXC integration source
- Orders API v2 with CAPTURE intent, USD 20.00, custom_id = claim ID, description 'BoxVia Check a Claim'.
- Browser is not sent PayPal credentials. OAuth and PayPal API requests are server-side.
- Order creation uses return/cancel URLs with claim ID and checkout session ID. These identifiers can be visible in URL and access logs; do not treat them as secret credentials.
- Server verifies PayPal order status COMPLETED, exactly one capture, capture status COMPLETED, USD 20.00, and matching custom_id before marking payment complete and contract formed.
- D1 stores PayPal order ID, capture ID, status, claim linkage, checkout session, acceptance snapshot hash, formation time. No card PAN/CVV storage is evident in reviewed source.
- The PayPal API response may contain additional payer details, but reviewed code does not establish persistent storage of all returned fields.
- Runtime screenshot verified PAYPAL_ENV=sandbox, PAYPAL_CHECKOUT_ENABLED=false, BXC_SANDBOX_ONLY=true.

## Minimax privacy wording — EN candidate
'Payments are processed by PayPal. For order verification and accounting, BoxVia processes transaction identifiers, payment status, amount and related order information. PayPal separately processes payment and fraud-prevention data under its own privacy statement: https://www.paypal.com/pl/legalhub/paypal/privacy-full. BoxVia does not request payment-card numbers or security codes through its service intake.'

## RU technical translation
'Платежи обрабатывает PayPal. Для подтверждения заказа и учета BoxVia обрабатывает идентификаторы транзакций, статус и сумму платежа, а также связанные сведения о заказе. PayPal самостоятельно обрабатывает платежные данные и сведения для предотвращения мошенничества в соответствии со своей политикой конфиденциальности: https://www.paypal.com/pl/legalhub/paypal/privacy-full. BoxVia не запрашивает номера платежных карт или коды безопасности через форму заявки.'

## Remaining verification
1. Merchant account identity, country and applicable legal documents in the actual PayPal Business account; do not disclose credentials.
2. Sandbox merchant settings and buyer experience (PayPal account optional/card option), if legally relevant; no real payments.
3. Sample **synthetic** Orders API capture response with personal fields redacted; verify D1 persisted columns and no accidental logging.
4. BoxVia accounting/VAT retention and applicable privacy notice, independent from PayPal's retention.
5. Confirm the live dates of PayPal legal pages, because public search and open caches yielded different version dates.

No production activation, live payment or legal publication authorized.

## PayPal Business dashboard screenshot — 2026-11-11
Owner-provided screenshot of paypal.com/businessmanage/account/aboutBusiness shows the Business information page for a PayPal profile labeled BoxVia and a populated PayPal Merchant ID (identifier deliberately omitted from this record). This confirms access to a merchant/business-profile interface and a merchant identifier; it does NOT establish account registration country, legal owner, tax residency, actual account restrictions, or applicability of a particular country-specific agreement. Next evidence: open Business information > Update or Account owner information and provide a redacted screenshot showing only account country, legal business type and business name; hide identifiers, address, contact details and financial information. No settings should be changed.
