# BXC-TEST-002 — Four-document integrity gate
Date: 2026-11-11
Status: CODE CHANGES COMMITTED / RUNTIME TEST NOT EXECUTED
Release: HOLD

## Issue
Previously, the BXC accepted contract snapshot required three hashed documents (Terms, Schedule, Withdrawal). The checkout displayed Privacy Notice separately, without an immutable accepted-document SHA-256. The manual email confirmation assembly could attach Privacy Notice without matching it to an accepted snapshot.

## Correction in draft branch
1. cloudflare/bxc-sandbox-worker-draft.js: catalog requires four immutable acceptedDocuments entries, including privacy, each with a SHA-256 hash. The catalog response now exposes privacy through the same document list, not a separate unversioned entry.
2. cloudflare/contract-checkout-evidence-draft.js: acceptance event requires all four document IDs.
3. cloudflare/contract-confirmation-dispatch-gate-draft.js: all four complete document bytes must hash to the accepted snapshot reference; missing or changed Privacy Notice is a hard error.
4. cloudflare/bxc-sandbox-public/checkout/index.html: checks optional early-performance selection before creating the checkout session.

## Important boundaries
- Privacy Notice acknowledgment is evidence of provision, not blanket GDPR consent.
- The source map is NOT a deployable catalog. It still lacks approved public URLs and release hashes.
- Four-document integrity is necessary but does not certify the legal adequacy of the Privacy Notice.
- No end-to-end runtime test has been performed, no payment made, no Gmail sent, and no deployment occurred.

## Minimal runtime test cases (not yet executed)
- Four correct documents: archive acceptance, read back immutable event, prepare confirmation.
- Omit privacy: catalog/acceptance and confirmation must reject.
- Alter one byte of privacy: confirmation must reject.
- Duplicate privacy document: snapshot validator must reject.
- Early-performance false/false: valid choice, no lawful early start inferred.
- Early-performance true/false: reject before creating a session.
- Early-performance true/true: preserve server timestamp/version, but do not waive withdrawal automatically.
- No real-client data, no PayPal activation.

## Next decision gates
Complete final EN legal and GDPR factual review; freeze exact approved bytes and hashes; build reviewed sandbox catalog; execute negative and positive tests; verify manual Gmail confirmation process; obtain explicit owner release approval.
