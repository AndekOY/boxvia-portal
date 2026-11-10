# BXC-REL-001 — Release readiness and owner decision record
Date: 2026-11-10
Status: PREPARED / RELEASE NOT AUTHORIZED
Object: Check a Claim $20 checkout contract catalog v0.1

## Verified from project documents
- BXC-001/002/003/004/005/006/TAX/ORDER owner-approved 2026-11-09 for INTERNAL LEGAL REVIEW BASELINE ONLY, not external publication or COS release.
- Final customer price: USD 20.00; any VAT collected by BoxVia must be included, not added on top.
- BXC-004 records provider identity from invoice template: Andrey Ekhmenin – BoxVia; NIP 8513329301; REGON 541534837; ul. Żwirki i Wigury 13/4, 71-176 Szczecin, Polska. NOT independently current-verified in this record.
- BXC-TAX-001 records VAT/VAT-UE verification on 2026-11-09 via owner-supplied evidence. This is not a SKU-specific VAT classification.
- Current 2026 Polish Consumer Rights Act consolidation: Dz.U. 2026 poz. 1244, ELI; review changes effective as of transaction date.

## Documents mapped
- terms: BXC-001 v0.1, owner-approved INTERNAL baseline; no final immutable released bytes.
- schedule: BXC-002 v0.1, owner-approved INTERNAL baseline; no final immutable released bytes.
- withdrawal: BXC-WD-001 v0.1 EN/RU review draft; not released.
- privacy: approved public exact-version document not established.
- checkout: BXC-005 v0.1 internal baseline, not released.
- contract confirmation: template v0.2 exists in Drive, dispatch and durable proof not implemented.

## Gate disposition
| Gate | Evidence | Decision |
|---|---|---|
| Seller identity and contacts | Invoice template, no fresh CEIDG/contact confirmation | HOLD |
| Price | Owner-approved USD 20 final amount | BASELINE CONFIRMED |
| SKU VAT treatment | Conditional matrix, not transaction-level decision | HOLD |
| Withdrawal notice/model form | BXC-WD-001 draft | HOLD |
| Protected sole trader / cross-border law | Research only | HOLD |
| Public privacy and GDPR notice | Exact released document not verified | HOLD |
| EN/RU exact final versions | Drafts, no release snapshots | HOLD |
| SHA256 exact immutable document bytes | No final publication artifacts | HOLD |
| Durable contract confirmation | Template only; dispatch unverified | HOLD |
| Owner/COS external release authority | Explicitly not granted | HOLD |

## Minimal owner decision (not yet made)
[ ] Approve the reviewed final client-facing EN/RU Terms, Schedule, Withdrawal Notice and Privacy Notice with exact immutable files and version numbers.
[ ] Confirm provider CEIDG data and customer contact/complaint/withdrawal channels.
[ ] Approve Check a Claim tax/VAT routing for defined customer/jurisdiction cases.
[ ] Approve separate early-performance UX and durable confirmation mechanism.
[ ] Authorize BXC checkout SANDBOX use of the released document catalog (separate from Production release).
[ ] Authorize production customer-facing publication separately after E2E PASS and required legal review.

No checkboxes above are approved by this file. Status remains HOLD.
Do not populate BXC_CONTRACT_CATALOG_JSON with draft hashes, enable PayPal, deploy production, or claim external release based on this record.


## STATUS UPDATE — 2026-11-10 — EN-only candidate freeze
- Provider identity: verified by owner-supplied CEIDG extract 2026-11-06, VAT registry and VIES 2026-11-09; customer-facing contact owner-confirmed: andrzej.ekhmenin@gmail.com. Identity/contact gate is CLOSED for drafting, subject to current verification at publication.
- Publication language: EN only. RU remains internal technical translation; any additional mandatory consumer language must be handled if required by law.
- Tax policy: general applicable-jurisdiction reference approved; USD 20 final payable to BoxVia; legally mandatory transaction-specific tax information cannot be waived by generic wording.
- Service model: individualized human-performed analysis with substantive human involvement; AI only assists; no fully automated client result.
- EN withdrawal candidate: docs/releases/candidates/BXC-WD-001-v0.1-EN.md; SHA-256 e7addd2fbc3a9626feef4afee33c401f973e7d2950040d0da8dbe66733429e41.
- EN privacy candidate: docs/releases/candidates/BXC-PRIV-001-v0.1-EN.md; SHA-256 e2e2e3ef15961066c9d1b2eac357fe5f6e18d08d6fbaaa3c72fc36e06d15fc7a.
- These SHA-256 values apply to the exact UTF-8 candidate files fetched from the draft branch. Any edits require new hash and version. Candidate hashes MUST NOT be substituted for published release hashes.
- OPEN: Verify actual GDPR subprocessors/AI tools, transfers, retention, cookies/analytics and required Article 13 disclosures; review statutory withdrawal text, form, protected sole-trader/cross-border requirements and 24h early-performance flow; finalize EN Terms and Schedule; durable contract confirmation, checkout legal gate and explicit owner/COS publication authorization.
- RELEASE DECISION: HOLD. No public deployment or PayPal enablement authorized or performed.
