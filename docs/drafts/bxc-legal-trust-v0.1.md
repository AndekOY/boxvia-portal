# BXC Legal & Trust Layer v0.1 — implementation draft

**Status:** INTERNAL DRAFT — NOT RELEASED — NOT DEPLOYED  
**Branch:** `draft/bxc-legal-trust-v01`  
**Decision date:** 2026-11-09

## Decision and dependency

Build and review legal, contractual, privacy, confidentiality and consumer-rights pages **before** wiring checkout consent and payment to them. Preserve the $20 final price and the 24-hour Check a Claim value proposition. No deployment or production edits without owner approval, legal/tax gates and COS release.

This branch contains a planning document only. No production routes, checkout handlers, D1 schema, PayPal settings or deployed pages are modified.

## Proposed public information architecture

| Route | Scope | Governing source |
|---|---|---|
| `/legal/` | Index, verified legal identity, contact, versions, effective dates | BXC-001, registry evidence |
| `/legal/terms/` | General service terms, orders, scope, acceptance, pricing, liability | BXC-001 |
| `/legal/consumer-rights/` | Withdrawal, early performance, proportional payment, complaints, protected JDG | BXC-002, BXC-004 |
| `/legal/privacy/` | Controller, purposes, lawful bases, processors, transfers, retention, rights | BCAF-DHS, actual data-flow inventory, GDPR |
| `/legal/cookies/` | Essential cookies, analytics/marketing only if actually used, controls | actual runtime/cookie audit |
| `/legal/confidentiality/` | Public vs confidential submissions, no-secret input, permitted disclosures | BCAF-NDA/DHS/DISC/GATE, released citation policy within scope |
| `/legal/service-terms/` | SKU schedules: Check a Claim, Technical Pilot, independent assessment | BXC-001/005, BCAF-SOW |
| `/legal/complaints/` | Verified contact, remedies, complaint handling, dispute resolution | BXC-002, Polish consumer law |

The routes are **proposed**, not yet created. No document is automatically public merely because it exists internally.

## Content and publication controls

1. Draft EN canonical and RU technical translation; align legal meaning, versions and dates. Determine whether Polish-language consumer text is required for actual market and targeting before publication.
2. Use confirmed BoxVia legal identity; verify contact email, registered address disclosure, applicable register information, VAT ID, and effective dates. Do not invent provider contact.
3. Privacy page requires actual Cloudflare Workers/D1, Turnstile, PayPal, email, logs, retention, subprocessors and cross-border transfer inventory. Never fabricate GDPR legal bases or retention periods.
4. Cookie page must be based on observed cookies and analytics; do not use generic consent banners without a cookie audit.
5. Consumer rights must address service vs digital-content classification, early performance request, withdrawal form, protected nonprofessional JDG and durable confirmation. No blanket waiver.
6. Price is the final amount collected by BoxVia, including VAT legally chargeable by BoxVia. Recipient reverse-charge obligations may still exist.
7. Terms must be version-fixed for each order; archive exact accepted bytes/hash and language. A later website edit cannot retroactively change the order.
8. Public BCAF confidentiality explanations are distinct from unreleased internal controls and do not disclose restricted methods or client records.
9. Footer/navigation and checkout links should point to published approved URLs only after all gates; never point customers to draft branch.
10. Preserve existing Check a Claim intake -> verified request -> PayPal flow. Implement checkout changes only after pages are approved.

## Build sequence

**Phase L1:** legal inventory and source-to-page crosswalk; unresolved-fact register.  
**Phase L2:** eight page texts in EN/RU, plus statutory withdrawal form and SKU-specific order summary.  
**Phase L3:** legal/tax/privacy review and consumer test cases; fix gaps.  
**Phase L4:** draft page components and internal preview on isolated branch, with no deployment.  
**Phase L5:** versioned terms acceptance, early-performance request, durable email and audit fields in isolated checkout patch.  
**Phase L6:** owner approval, COS release decision, controlled merge/deploy, regression checks.

## Release gates (all OPEN unless expressly stated)

- G1: Complete and verified provider/contact details.
- G2: Legal review of Polish consumer law, protected JDG and international consumer scope.
- G3: SKU-specific VAT, currency, invoice and final-price review.
- G4: Privacy data-flow, retention, subprocessors, cookies and consent audit.
- G5: EN/RU equivalence; PL obligations assessed.
- G6: Terms/withdrawal/versioned consent and durable confirmation tests.
- G7: No disclosure of confidential BCAF/COS/BQS material.
- G8: Owner signoff and COS release.

## References

- BXC-001 through BXC-006; BXC-TAX-001; BXC-ORDER-001.
- BXC-UX-001: https://docs.google.com/document/d/13VUSDMjQg6uxaBHkSTy-wiEkrjF6aBdv8YcXkuowvQw/edit
- BXC-005: https://docs.google.com/document/d/1pqDIj7WfB067mBoFVW_fHEzbeQomOS2PJqXehl_5I6E/edit
- BXC-002: https://docs.google.com/document/d/1En4C9wBkpKkv5UdBr68oB0qQ2P22mZxIb_7hcmdtekA/edit

**No live changes.**
