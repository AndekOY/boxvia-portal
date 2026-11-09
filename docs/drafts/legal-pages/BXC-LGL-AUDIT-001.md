# BXC-LGL-AUDIT-001 | Legal & Trust Layer v0.1 — integrated pre-release audit
Date: 2026-11-09 | INTERNAL REVIEW | NOT A LEGAL OPINION | NOT RELEASED

## Evidence boundary
Reviewed eight draft EN/RU Markdown files in GitHub branch `draft/bxc-legal-trust-v01`, plus the already reviewed BXC-001/002/004 and BXC-UX-001 architecture. This is a **documentary consistency and gap audit**, not a live cookie scan, deployed site review, external legal counsel signoff or tax ruling. No public page route was created. The public-facing legal language remains draft.

## Inventory and crosswalk
| Draft | Primary internal source | Assessment |
|---|---|---|
| legal-index | BXC-001, BXC-006 | CONDITIONAL — verified email/effective date absent |
| terms | BXC-001 | CONDITIONAL — legal signoff, complaints, order formation |
| consumer-rights | BXC-002, BXC-004 | HOLD — full statutory notice/form and current law check |
| privacy | BCAF-DHS, GDPR | HOLD — no actual data map or retention/processor audit |
| cookies | actual Cloudflare/PayPal/analytics implementation | HOLD — no actual inventory or consent testing |
| confidentiality | BCAF NDA/DHS/DISC/GATE | CONDITIONAL — distinguish released vs draft controls |
| service-terms | BXC-001/005, BXC-UX-001, BCAF-SOW | HOLD — consumer 24h consent and SKU VAT route |
| complaints | BXC-002, BXC-004 | HOLD — verified mailbox, response period, ADR |

## Cross-document findings
**F01 — P0 — Missing verified contact.** Provider identity and registered address recorded from 2026 evidence, but no confirmed public email for privacy, complaints, withdrawal and contractual notices. Do not invent or deploy a placeholder.
**F02 — P0 — Consumer withdrawal notice/form incomplete.** The draft explains the concept but does not supply the complete Polish statutory model form and mandatory information. The exact service/digital-content legal classification and applicable country-specific rights remain unresolved.
**F03 — P0 — 24-hour SLA and early-performance request.** Commercial promise retained; lawful consumer start requires separate affirmative request and required acknowledgment. If absent, do not charge for an undisclosed incompatible 24h commitment. UI and server records remain unimplemented.
**F04 — P0 — GDPR data map missing.** Verify request/email data, D1, Turnstile, Workers logs, payment metadata, transactional email, backups, processors, retention, security, transfer safeguards, data subject requests. Current privacy draft intentionally uses OPEN placeholders; it is not publication-ready.
**F05 — P0 — Cookies/tracking unverified.** Inventory first-party and third-party cookies and similar storage on initial form, payment return, analytics and PayPal. Do not claim essential-only or implement a decorative banner.
**F06 — P0 — Contract acceptance and durable confirmation.** Identify actual binding order step, legal version snapshot/hash, unticked assent, prepayment disclosures, payment obligation wording, durable email and receipt evidence.
**F07 — P1 — Tax treatment.** Final price collected by BoxVia is fixed; VAT included where chargeable. Per-SKU service classification, EU B2B/B2C, non-EU, currency/PLN invoice and KSeF implications need separate verification. Do not assert 23% for every order.
**F08 — P1 — Language scope.** EN and RU technical translations exist. Whether Polish-language disclosures are legally necessary for targeted Polish consumers must be assessed. No unilateral designation of RU as legally controlling.
**F09 — P1 — Complaint timing/ADR.** Current law, response deadline, effect of silence and ADR disclosures must be verified. No invented fixed response promise.
**F10 — P1 — Confidentiality boundaries.** Public explanation must not accidentally incorporate unreleased BCAF, COS or BQS modules or imply certification. Draft currently distinguishes them, but exact legal NDA/SOW incorporation remains conditional.
**F11 — P1 — Source provenance.** Current legal research references Dz.U. 2026 poz. 1244 and a future amendment. Verify official consolidated law and any intervening effective amendments at release date. This audit did not independently re-check ELI or UOKiK websites.
**F12 — P2 — UX/navigation.** Eight routes proposed, but no routing components, footer links, SEO canonical/hreflang, accessibility or mobile checks have been implemented.
**F13 — P1 — Document consistency.** Terms, service terms and legal index all state FINAL CUSTOMER PRICE consistently. Terms and consumer rights preserve statutory remedies. 24h promise is conditional on lawful early performance and accepted scope; ensure no hidden redefinition of existing published payment-confirmation deadline.
**F14 — P1 — Data minimization.** Do not store unnecessary payment or personal data in D1; capture only necessary versioned consent and transaction evidence with a justified retention schedule.

## Proposed release order
1. Confirm public legal/complaints/privacy email and registration disclosures.
2. Audit real production data flows and cookies without changes.
3. Verify full consumer withdrawal notice and statutory model form, service classification and Polish-language obligations.
4. Finalize per-SKU tax routing and final-price invoice wording.
5. Redline EN/RU and approve canonical texts with immutable versions and effective dates.
6. Implement eight page components only on isolated draft branch, then internal preview/test.
7. Only after approved legal pages: add versioned prepayment disclosures, optional early-performance consent, durable confirmation and audit records.
8. Owner + COS formal release gate before any merge or deployment.

## Result
DOCUMENTS PRESENT: 8/8; EN/RU sections present: 8/8.
CONTENT COHERENCE: PRELIMINARY / CONDITIONAL.
LEGAL COMPLIANCE: NOT VERIFIED.
GDPR/COOKIE COMPLIANCE: NOT VERIFIED.
LIVE ROUTES: NOT CREATED.
PRODUCTION / PAYPAL / CLOUDFLARE D1: UNCHANGED.
**DISPOSITION: INTERNAL DRAFT COMPLETE — RELEASE HOLD.**
