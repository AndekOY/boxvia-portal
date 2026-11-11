# BXC — MINIMAX final consumer and privacy release gate
Date: 2026-11-11
Status: INTERNAL REVIEW / NO LIVE RELEASE

## Fixed by owner
- Consumer-only PL/EU scope; USD 20 final gross price; human-performed assessment; manual Gmail confirmation.
- Owner-approved interim retention: unpaid 30 days inactivity, working material 90 days after delivery, final reports 12-month review, nonessential Gmail correspondence 12-month review; statutory/claims evidence preserved as legally required.
- Separate accountant review skipped by owner. This is a process decision, **not** tax-rate validation.
- Four documents: BXC-001 v0.2, BXC-002 v0.2, BXC-WD-001 v0.3, BXC-PRIV-001 v0.2. All remain candidates.

## Consumer checkout: source-grounded checks
PASS IN DRAFT SOURCE: separate terms, consumer schedule, withdrawal and privacy acknowledgments; optional early-performance request and consequences checkbox initially unchecked; verified order summary required; amount USD 20; manual durable confirmation intended; PayPal sandbox redirect host restricted.
NOT VERIFIED: statutory suitability of final payment-button sequence and actual PayPal handoff; EU consumer language rules; complaint/ADR details; service-vs-digital-content classification; lawful handling of the withdrawal period in runtime; actual confirmation delivery.
BLOCKED: no immutable approved four-document catalog or real order; sandbox payment switch disabled.

## Privacy: source-grounded checks
PASS IN DRAFT SOURCE: initial processors identified (Cloudflare, PayPal, Gmail); no direct analytics scripts observed in checkout HTML; minimal fields; owner-approved retention criteria now inserted into BXC-PRIV-001 v0.2.
NOT VERIFIED: live Cloudflare analytics/Turnstile/cookies/logging and backup retention; provider processing roles and transfer mechanisms; live PayPal/Gmail account settings; Article 13 recipient/transfer details; operational deletion procedure.
BLOCKED: do not publish the current privacy candidate as a complete Article 13 notice.

## Smallest next evidence needed
1. Cloudflare account settings and browser Network/Cookies check of intended checkout. No credentials, access tokens or customer data.
2. PayPal merchant identity and terms plus Google/Gmail account handling and actual retention. No credentials.
3. Final consumer disclosure and PayPal button review, including required country/language handling for PL/EU.
4. Approve immutable EN docs and RU technical translations, verify hashes; then one synthetic PayPal sandbox test and explicit owner go-live decision.

## Stop conditions
No real personal data or live payments until privacy and consumer-law disclosures are correct. No extra infrastructure, generalized tax engine, automatic email, broad test suite, or production changes.
