# BXC-PRIV-002 — Privacy release facts and verification matrix
Date: 2026-11-11
Status: INTERNAL RELEASE GATE / NOT LEGAL APPROVAL
Source reviewed: docs/releases/candidates/BXC-PRIV-001-v0.1-EN.md
Decision: BXC remains HOLD. No real customer data may enter an unapproved checkout.

## Verified in the candidate text (draft statements, not operational verification)
- Controller: Andrey Ekhmenin – BoxVia; Szczecin address, NIP and contact are specified.
- Proposed processing: orders, acceptance records, payment references, submitted claim material, delivery, complaints, accounting and legal claims.
- Potential GDPR legal bases: Art. 6(1)(b), (c), (f), as applicable to each purpose.
- AI supports a human-performed analytical result; no automatic issuance of the deliverable.
- Customer rights and UODO complaint route are described.

## Open factual gates (do not infer answers)
| ID | Verification needed | Evidence required | Release rule |
|---|---|---|---|
| PRIV-01 | Actual processors and subprocessors for checkout, hosting, email, payments, analytics, AI assistance | Provider/service inventory with roles and data categories | HOLD until complete |
| PRIV-02 | Actual international data flows and transfer mechanisms | Country/recipient map; adequacy/SCC and supplementary measures as applicable | HOLD until verified |
| PRIV-03 | Purpose-by-purpose retention periods and deletion triggers | Retention schedule for order, tax, acceptance evidence, submitted claim, drafts, backups, Gmail sent records | HOLD until defined |
| PRIV-04 | Live cookies, telemetry, analytics and consent behavior | Technical inventory and observed browser/network behavior | HOLD until verified |
| PRIV-05 | Human/AI data boundary: anonymous default; pseudonymized exception only where lawful | Operating procedure and controlled input test | HOLD until verified |
| PRIV-06 | Data subject rights request handling | Access-controlled inbox, response procedure and deletion exceptions | HOLD until documented |
| PRIV-07 | Access restrictions, encryption, backup and incident response for evidence archives | Storage location, operator permissions, key and recovery procedures | HOLD until verified |
| PRIV-08 | Lawful basis and required transparency for each processing purpose | Purpose/legal-basis matrix; legitimate interest assessment where relied upon | HOLD until reviewed |
| PRIV-09 | Checkout notice version integrity | Frozen EN bytes, SHA-256, version, immutable public URL, archived accepted snapshot | HOLD until verified |
| PRIV-10 | Publication and legal sign-off | Owner authorization and jurisdiction-specific review | HOLD until approved |

## Release protocol
1. Fill each item from primary operational evidence; distinguish confirmed, absent and unknown.
2. Amend EN Privacy Notice only to reflect verified processing; do not promise unsupported safeguards.
3. Conduct RU internal technical-equivalence review of final EN text.
4. Freeze and hash the exact EN document bytes and archive the accepted version.
5. Run checkout and durable-confirmation tests using synthetic identities only.
6. Seek express owner approval before deployment, payment activation or real Gmail sending.

## Execution boundary
The GitHub Actions workflow was configured, but successful execution has not been verified through available workflow results. Do not report tests as passing. This document is not evidence that any listed factual gate is satisfied.
