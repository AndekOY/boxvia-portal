# BXC — Minimax legal completion and factual verification | 2026-11-11
Status: RELEASE BLOCKED — evidence-based preflight, not legal sign-off.

## Verified against primary public authorities
- Polish Consumer Rights Act, consolidated text Dz.U. 2026 poz. 1244 (ISAP https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU20260001244). The official UOKiK guidance identifies the 14-day ordinary online withdrawal period and the exception for fully performed services only with statutory prior express request/acknowledgment (https://prawakonsumenta.uokik.gov.pl/prawo-odstapienia-od-umowy/wylaczenia-prawa-do-odstapienia/).
- Online order with payment obligation requires clear final-order payment wording and specified information immediately before placing the order: Polish Consumer Rights Act art. 17; UOKiK guidance https://prawakonsumenta.uokik.gov.pl/prawo-do-informacji/sprzedaz-poza-lokalem-i-na-odleglosc/.
- Distance contract confirmation on durable medium before service begins where applicable: Consumer Rights Act art. 21.
- GDPR Article 13 requires specific information about actual processing, legal bases, recipients, retention, transfer safeguards, rights, data provision consequences and automated decision-making where applicable (Regulation (EU) 2016/679, Article 13).

## Verified from repository source, not from deployed Cloudflare or third-party account configuration
- Separate sandbox Worker configured via wrangler.bxc-sandbox.jsonc; BXC_SANDBOX_ONLY=true, PAYPAL_ENV=sandbox, PAYPAL_CHECKOUT_ENABLED=false; D1 binding DB. **Repository configuration does not prove currently deployed settings**.
- Sandbox checkout HTML has four explicit document acknowledgements, separate unchecked early-performance request and consequences acknowledgement; USD 20 displayed. Checkout is blocked unless reviewed catalog is supplied. PayPal order uses PAY_NOW in the draft server integration.
- PayPal draft backend verifies server-side completed capture and amount before formation; actual runtime transaction and order history not verified.
- Gmail draft adapter has sandbox-only, allowlisted recipient controls and requires owner OAuth; no real email dispatch or attachment receipt verified.
- Production Worker source has claim intake gating and Turnstile verification; this does not prove the currently deployed worker, actual cookies, analytics or storage retention.
- ChatGPT processing is restricted by documented owner policy to genuinely anonymized case material. No verification of individual operational practice.
- Intended Cloudflare, PayPal and Gmail providers are evidenced by source code; provider account legal roles, DPA, transfer country, subprocessors and SCC/adequacy are **not** evidenced by repository source.

## Outstanding facts that cannot be truthfully inferred from source code
1. Cloudflare account and D1 actual deployed bindings, data storage geography, processor terms, subprocessors and transfer mechanisms.
2. PayPal merchant account's applicable controller/processor disclosures and actual buyer payment data flows.
3. Gmail/Google account terms, data-processing role, international transfers and operational mailbox retention.
4. Actual website cookies, Cloudflare analytics/Turnstile behavior and consent obligations on deployed routes.
5. Actual retention schedule and deletion implementation for D1, logs, inbox, orders, legal acceptance and backup records.
6. Whether BoxVia has a DPO and whether any automated decision-making within GDPR Article 22 occurs in practice; do not infer either from source code alone.
7. Polish and cross-border tax/VAT treatment for the buyer categories allowed at checkout, invoices and price disclosure.
8. Consumer-facing language obligations and final legal classification of human analytical service with digital report.
9. Verified Gmail durable confirmation before lawful start and full PayPal sandbox end-to-end.
10. Owner's explicit legal release approval.

## Minimax decision
Use BXC-001 v0.2 and BXC-002 v0.2 as editorial candidates. Use BXC-WD-001 v0.3 as the concise statutory withdrawal candidate. BXC-PRIV-001 v0.2 remains **unpublishable** until actual Article 13 facts above are completed. No invented retention periods, third-country destinations, DPA or cookie status.

## Technical blocking rule
Do NOT populate BXC_CONTRACT_CATALOG_JSON from any review manifest; do NOT enable PAYPAL_CHECKOUT_ENABLED or deploy production. Once factual evidence and legal review are supplied, issue a new final four-document snapshot and explicit owner release decision.
