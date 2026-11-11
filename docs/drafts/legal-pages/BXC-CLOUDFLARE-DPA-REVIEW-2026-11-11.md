# BXC — Cloudflare DPA evidence review
Date: 2026-11-11
Status: DOCUMENT REVIEW COMPLETE / ACCOUNT APPLICABILITY NOT VERIFIED / BXC HOLD

## Primary document
Owner-provided PDF: Cloudflare Data Processing Addendum, Version 6.4, April 3, 2026, 17 PDF pages.
Evidence: uploaded document in BXC conversation, not a signed customer-specific agreement.

## Findings
1. Preamble, p.1: DPA forms part of the Main Agreement; effective from signing or other agreement to the DPA. **Cannot conclude account-specific effective date or acceptance from PDF alone.**
2. §2.3, p.3: Customer is Controller (or Processor), Cloudflare Processor (or sub-Processor), as applicable. BoxVia controller role is an operational assessment, not proven by the DPA alone.
3. §3.1(a),(c),(e),(i), pp.3-4: documented instructions, security measures, breach notification, and deletion/return after termination or completion subject to legal exceptions.
4. §4.3-4.4, p.5-6: general subprocessor authorization; public list https://www.cloudflare.com/gdpr/subprocessors/; changes notified at least 30 days in advance and objections within 10 days.
5. §6.1-6.4, pp.6-8: potential processing outside EEA/UK/Switzerland; EU SCCs for restricted transfers (controller-to-processor Module Two where applicable); DPF claims and fallback SCCs if certification lapses. **Not an EU-only processing commitment.**
6. Annex 1, pp.11-13: data types include IP addresses, Customer Content and administrator logs; retention description is tied to the Main Agreement/necessity, not a precise BXC record-retention period.
7. Annex 2, pp.14-17: documented technical and organizational measures; infrastructure access logs retained for 12 months (p.16). **This is distinct from D1 Time Travel's maximum 7-day recovery window.**
8. Annex 2, p.14: Cloudflare describes geographically distributed backups at alternative sites; this does not establish BXC D1 backup location or customer-specific retention.

## Verified sandbox settings from owner screenshots
D1: Region Eastern Europe; Jurisdiction None; Read replication Disabled; Time Travel maximum past 7 days (actual available 2026-11-10 16:24 to 2026-11-11 11:16).
Worker: BXC_SANDBOX_ONLY true; PAYPAL_ENV sandbox; PAYPAL_CHECKOUT_ENABLED false.
These observations must not be presented as EU-only residency or production deployment facts.

## Minimalist external wording (EN draft; not approved)
'We use Cloudflare to operate and secure our website and service infrastructure. Cloudflare may process technical and service data on our behalf under its applicable Data Processing Addendum. Where personal data is transferred outside the EEA, applicable safeguards under the GDPR, including adequacy decisions or standard contractual clauses where relevant, are used. See Cloudflare’s DPA and subprocessor information for details.'

## RU technical translation (draft)
'Мы используем Cloudflare для работы и защиты сайта и сервисной инфраструктуры. Cloudflare может обрабатывать технические и сервисные данные по нашему поручению на основании применимого соглашения об обработке данных (DPA). При передаче персональных данных за пределы ЕЭЗ используются применимые гарантии GDPR, включая решения об адекватности защиты или стандартные договорные положения, когда это требуется. Подробности приведены в DPA Cloudflare и сведениях о субобработчиках.'

## Remaining gates
- Verify that version 6.4 DPA is applicable to the actual BoxVia Cloudflare account under its Main Agreement; no account-specific acceptance evidence yet.
- Verify current Cloudflare subprocessor list and relevant transfer mechanism/certification as of release.
- Confirm actual BXC production data categories, retention/deletion practice and provider inventory.
- Do not publish legal text or enable payments without explicit owner GO.


## Cloudflare subprocessor register — owner-provided text, reviewed 2026-11-11
Source URL stated in DPA §4.4: https://www.cloudflare.com/gdpr/subprocessors/
The owner supplied the page text headed "Cloudflare Subprocessors", last updated **2025-10-01**. This is an owner-provided snapshot, not independently re-fetched or verified as the latest version.
- Third parties listed: Slack Technologies, Zendesk, Salesforce (support/account management); Google LLC (Cloudflare Developer Platform, Zero Trust, AI Gateway); Oracle America (Developer Platform, cache reserve); AWS (Email Security); CoreWeave and Nebius (Workers AI); Anthropic, OpenAI, xAI and Groq (AI Gateway).
- Locations listed include the United States, EEA and several other jurisdictions; Cloudflare group affiliates include entities inside and outside the EEA.
- Inclusion in Cloudflare's overall register **does not establish that a particular subprocessor receives BXC data**. In particular do not infer AI Gateway, Workers AI or Email Security usage from the list.
- DPA §4.4 describes notification at least 30 days before new/replacement subprocessors begin processing, and a 10-day objection window.
- No EU-only residency representation is supportable.
- Status: public register text examined; relevant BXC service-specific recipients and current live register still to be checked at release. Account-specific DPA incorporation remains unverified.

Minimalist privacy disclosure principle: link to Cloudflare's current DPA and subprocessor register; describe possible international processing and GDPR Chapter V safeguards without enumerating every supplier or promising EU-only processing.
