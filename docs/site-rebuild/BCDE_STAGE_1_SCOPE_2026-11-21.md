# BCDE — Stage 1 (owner decision 2026-11-21)
Status: APPROVED SCOPE / NOT YET IMPLEMENTED OR ACCEPTED
Environment: work branch and isolated sandbox only; Production and main HOLD.

## Goal
Automatically create and privately archive a minimal immutable PDF commercial pack for every order. The owner downloads and sends the documents manually.

## Unified lifecycle
1. Intake; confirm service and customer identity.
2. Owner confirms scope, deliverable, deadline and final amount. Exactly two services fixed USD 50; remaining four are 'from' with individually accepted quotes.
3. Generate versioned 01_ORDER_TERMS.pdf from server-authoritative terms before acceptance; calculate SHA-256 digest.
4. Customer explicitly and separately accepts the offer and confidentiality terms, each with exact version and digest, bound to the order terms digest.
5. Persist immutable evidence and timestamps in D1; verify evidence server-side.
6. Generate 02_ACCEPTANCE_RECORD.pdf and manifest.json with hashes and references.
7. Enable Stripe and PayPal buttons only after server-side checks; fail closed.
8. Store PDFs privately; provide owner-authenticated download. Owner sends manually.

## Pack
01_ORDER_TERMS.pdf: parties, service, final price and currency, scope, deliverables, deadline, terms version, order ID.
02_ACCEPTANCE_RECORD.pdf: terms digest, offer and confidentiality document versions/digests, consent timestamps, order ID, evidence provenance. Do not mislabel as a cryptographic signature.
manifest.json: names, SHA-256 hashes, document versions, creation timestamps, archive status.

## Integrity and privacy
Private R2 (or equivalent), not public static links; owner authentication, short-lived downloads, no PII in object keys. Never overwrite accepted documents. Any price/scope change creates new version and requires renewed consent. Set retention and GDPR rules before release.

## Build gates
A. Approve actual offer and confidentiality text, company legal particulars, language and template.
B. Implement private storage, server-side PDF generation, owner-only download, sandbox only.
C. Link immutable document digests to D1 acceptance and enforce provider checks.
D. Test both fixed services and all four quote services, changed terms, missing consent, replay, unauthorized access and PDF failures.
E. Explicit owner approval before Production.

## Out of scope
Email API, automatic sending, invoices/faktura, KSeF, accounting integration, automated receipts and completion records. Commercial PDF is not a tax invoice.
