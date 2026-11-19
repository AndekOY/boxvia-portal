# BoxVia Site Rebuild Plan v2.1
Date: 2026-11-19
Status: OWNER APPROVED / EXECUTION IN PROGRESS
Branch: work/technical-pilots-first-20261118
Release: Preview only; main and Production HOLD until separate explicit approval.

## Binding decisions
- The $20 Check a Claim offer is retired from the future public catalog, but its successfully paid real-world test is an operational reference implementation. Preserve source, verified records and historical order evidence until the $50 replacement flows have passed acceptance.
- The two $50 entry services are One Question Review and Focused AI Governance Review. Their individual scope, deliverables, intake and identifiers must remain distinct.
- Both PayPal and Stripe are intended payment choices. Existing PayPal success does NOT prove Stripe integration or readiness.
- Starting-price services require an agreed quotation before generating a payable order. No client-controlled price.
- Home is provisionally accepted editorially, subject to final acceptance. Four audiences remain equally prominent.
- New /library/ landing page: BoxVia Knowledge Library, navigation to Sample Reports, Research, ANDEKS & Methods, Technology & Demonstrators; no copying canonical research/normative content.
- Every sentence starts on a new rendered line in public copy, with narrowly justified legal/contractual/normative exceptions.
- Public website English only; Russian working language; precise technical translation for review.
- No Production/main modifications, no live Stripe charge, no real client data in Preview.

## Ordered work packages and gates
0. Home: remove Check a Claim as an active offer, verify CTA, responsive rendering, one-sentence-per-line rule. Preserve operational claim code for migration.
1. Audiences: Business, Developers, Creators, Researchers. For each: audience problem, object, result, fitting services, examples, CTA, responsive and SEO QA.
2. Services catalog: six services, no $20 public sale; differentiate the two $50 entry offers; check all links and metadata.
3A. Audit proven Check a Claim path end to end: form, Turnstile, server gates, PayPal create/capture, D1 persistence, notification, fulfillment, privacy, abuse prevention, historical data and rollback.
3B. Design a server-authoritative service order abstraction: service_id, approved price/currency, intake, order state, provider, external payment IDs, webhook/capture verification, idempotency, audit trail, safe notification and retention. Define Stripe requirements and readiness gate separately.
3C. Implement and test the two $50 services in isolated sandbox/Preview, each with PayPal and Stripe routes. PASS only on verified provider confirmation and D1 state; do not treat redirects as payment proof.
3D. Extend approved order infrastructure to $200 and four scoped services with quotation-first flow where applicable. Note: six active services total: two $50, $200, Technical Pilot from $250, Project Definition Review from $250, AI Governance & Compliance Gap Assessment from $300.
4. Create /library/ as a navigation landing page, audit and organize /reports/, /research/, /andeks/, /technology/, /are/, /era/, /research/eas/, and architecture references. Separate examples, synthetic demonstrators, methods, normative materials and publications; retain canonical links and publication status/version.
5. About, Contact, Legal, Privacy; GDPR, confidentiality, applicable law, jurisdiction, commercial terms and source/disclosure rules.
6. Full acceptance: static checks, routes/redirects, sitemap, canonical, forms, Turnstile, PayPal, Stripe, accessibility, desktop/mobile, security, evidence and explicit release decision.

## Mandatory acceptance evidence per page
Audience and purpose; 10-15 second comprehension; clear scope and outputs; sentence-per-rendered-line; EN plain language and normative precision; correct CTA; no obsolete $20 commercial offer; canonical and sitemap; responsive QA; backend/form verification where applicable; PASS / RETEST / HOLD / UNESTABLISHED.

## Operational controls
- Preserve existing claims, PayPal orders and receipts. Do not drop D1 tables.
- Retire /evidence-check/ only after redirect mapping, inbound links, payment callbacks and historical thank-you URLs are reviewed. Redirect policy is NOT yet approved.
- Preview deployment uses isolated boxvia-site-preview-20261118. Existing boxvia-service-preview and Production are separate.
- The initial technical audit is documented in PAYMENT_MIGRATION_AUDIT_2026-11-19.md. Follow with a concrete migration design before changing payment handlers.
