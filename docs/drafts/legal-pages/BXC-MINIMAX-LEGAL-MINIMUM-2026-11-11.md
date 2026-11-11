# BXC — Minimax statutory minimum review | 2026-11-11
Status: INTERNAL REVIEW — NOT A LEGAL APPROVAL — HOLD
Basis: four v0.2 English candidate texts at commit 81777c87088edcdcf7e02e36f2efe0c9302ccd00.

## Principle
Keep BoxVia-specific contract rules minimal and refer to mandatory EU and Polish law wherever a reference is legally sufficient. A statutory reference is **not** a substitute for information that must be communicated directly before a distance sale or under GDPR Article 13.

## Document-by-document decision
- BXC-001 v0.2: CONDITIONAL PASS (editorial minimax). Provider, scope, price, contract formation and lawful 24-hour start are specified. Actual checkout must verify payment-button sequence, final price/tax treatment and contract formation.
- BXC-002 v0.2: CONDITIONAL PASS (editorial minimax). Consumer and protected sole-trader rights preserved by statutory reference. Pre-contract disclosure and durable-medium confirmation must be verified in actual flow.
- BXC-WD-001 v0.2: HOLD (mandatory information review). A concise withdrawal notice and model form exist, but exact statutory instruction requirements, service/digital classification, exceptions, early performance and proportionate-charge consequences must be verified against applicable law. Generic legal references alone are insufficient.
- BXC-PRIV-001 v0.2: HOLD (factual GDPR gaps). Article 13 requires actual retention periods/criteria, controller/processor and recipient disclosures, lawful bases by purpose, transfer safeguards where applicable, provision-of-data consequences, rights, and automated decision-making information as applicable. The text explicitly acknowledges unresolved facts and cannot be published as a final notice.

## Required minimal release gates
1. Confirm the legal classification of Check a Claim, including the human-performed service and digital delivery consequences.
2. Check Polish Consumer Rights Act and applicable EU rules for required pre-contract information, final payment action, withdrawal notice, early performance and durable confirmation.
3. Verify tax/VAT treatment and mandatory transaction-level price/invoice disclosures.
4. Establish actual Cloudflare, PayPal, Gmail and website data flows, transfers, retention, cookies and rights handling; complete GDPR Article 13 notice with verified facts only.
5. Verify server-side PayPal capture, consent and confirmation evidence in sandbox.
6. Recalculate final hashes after any approved edits; owner explicitly authorizes release.

## Source integrity
v0.2 source bytes and SHA-256 are in cloudflare/catalog/bxc-four-document-review-snapshot-v0.2.json, pinned to immutable commit 81777c87088edcdcf7e02e36f2efe0c9302ccd00. This is a review snapshot, **not** BXC_CONTRACT_CATALOG_JSON.

## Decision
NO-GO / HOLD. This is an internal text-based gap check, not a verified statutory legal opinion. No production deploy, live PayPal, contract publication or customer order enabled.
