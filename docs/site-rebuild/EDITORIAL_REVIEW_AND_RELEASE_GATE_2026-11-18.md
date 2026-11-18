# Public site editorial review and release gate
Date: 2026-11-18
Branch: work/technical-pilots-first-20261118
Status: GITHUB CHANGES COMPLETE FOR EDITORIAL PASS / RUNTIME QA PENDING
Production: NOT AUTHORIZED

## Owner-approved decisions
- Public site English only; Russian for working discussion and accurate technical translations in chat as needed.
- Four audiences are first-class navigation routes, with one shared services catalog.
- No permanent service priority on the homepage; promote individual audience and service pages.
- Scope of BoxVia is wider than AI; project definition is an independent service.
- Public-facing name: Project Definition Review; FAAR Stage 1 remains a methodology name.
- Plain, precise, visitor-first language; no em or en dashes.
- Keep specialist language where needed in ANDEKS, research and architect materials.
- Maintain evidence limits, human accountability and confidentiality safeguards.

## GitHub change set
1. Added approved policy docs/governance/BOXVIA_PUBLIC_LANGUAGE_STANDARD_v1.0.md.
2. Simplified homepage and four audience pages.
3. Simplified service catalog, Technical Pilot, Project Definition Review, Pre-Decision Review and AI Governance & Compliance Gap Assessment.
4. Adjusted One Question Review explanation of insufficient evidence.
5. Aligned public Project Definition Review links in About, Technology, Research and Reports.
6. Preserved request form endpoints, service identifiers, prices and legal statements.
7. Added scripts/check-public-site.mjs for repeatable static QA.

## Deliberately unchanged
- /faar/ canonical URL and hidden request service ID faar-stage-1, to avoid breaking intake routing.
- Published FAAR Stage 1 demonstrator titles and methodology identifiers.
- Existing service prices and lead times.
- Backend, PayPal, Stripe, Cloudflare production bindings and deployment.
- Specialist research, ANDEKS, ARE, ERA and EAS normative material, unless a public service link required alignment.

## Acceptance gates
- Editorial scope and naming: READY FOR OWNER REVIEW.
- GitHub changes committed to isolated branch: PASS.
- Static route, link and typography validation: NOT EXECUTED in this environment; run `node scripts/check-public-site.mjs` locally or in CI.
- Request forms and Turnstile: NOT TESTED.
- Desktop and mobile visual QA: NOT TESTED for latest revision.
- Cloudflare Preview: NOT DEPLOYED for latest revision.
- Production release: HOLD, requires explicit owner approval.

## Required before release
1. Run static script from repository root and resolve failures; review warnings.
2. Review desktop and mobile navigation, forms, links, wording and pricing.
3. Confirm technical translation where any English meaning is uncertain.
4. Show owner the GitHub diff and request explicit approval.
5. Only then deploy the approved commit to Cloudflare; keep production separate until final acceptance.
