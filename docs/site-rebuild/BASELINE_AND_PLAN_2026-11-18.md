# BoxVia site restructuring — baseline and acceptance plan
Date: 2026-11-18
Status: WORKING / NOT ACCEPTED
Branch: work/technical-pilots-first-20261118
Production release: PROHIBITED without owner approval

## Verified baseline
Canonical repository: AndekOY/boxvia-portal, default branch main.
Runtime: Cloudflare Worker with static HTML assets; D1 database binding.
Canonical pilot URL: /services/technical-pilot/.
Sitemap contains 21 public URLs.
Current home hero: "Independent evidence checks and AI research".
Current top navigation: Services, Products, Technology, Research, Check a Claim.
Current service catalog: Check a Claim (20 USD), One Question Review (50 USD), Focused AI Governance Review (50 USD), Pre-Decision Review (200 USD), Technical Pilot (from 250 USD), FAAR Stage 1 (from 250 USD), AI Governance Gap Assessment (from 300 USD).
Technical Pilot currently offers Evidence Review and Scenario Pilot, with scope/price agreed before starting.
PayPal implementation is claim-specific, validates USD 20.00, and records verified captures in D1. Generalized payment infrastructure and Stripe are not verified.
Approved HITL messaging: "Human-Accountable Independent Assessment" / "AI-assisted. Human-assessed. Evidence-based."

## Proposed TO-BE homepage (not yet accepted)
1. Hero: Technical Pilots as the flagship. One scenario, defined version, bounded written report. Primary CTA /services/technical-pilot/; secondary CTA /reports/.
2. Two review modes: Evidence Review (existing records) and Scenario Pilot (agreed execution).
3. Who it serves: AI builders, developers, engineering teams, organizations evaluating agent behavior.
4. What the report establishes: observation, supporting evidence, limitations, UNESTABLISHED where appropriate.
5. How to start: non-sensitive request -> written scope/feasibility/price -> agreed payment -> assessment -> report.
6. Sample Reports: distinguish synthetic/research illustrations from paid engagements.
7. Supporting services: smaller evidence reviews and larger individually scoped assessments.
8. ANDEKS/Research: methodological basis, not a competing primary CTA.
9. Human accountability and confidentiality: approved HITL language and legal boundaries.

## Proposed IA
Home -> Technical Pilot -> Sample Reports -> Services -> Research / ANDEKS -> About / Contact.
Preserve existing canonical routes pending full link audit and redirect decisions.
Check a Claim is NOT automatically cancelled. Pizza Test must be absent from published product positioning; repo-wide content and metadata scan is still required.

## Risks and acceptance criteria
- Scope ambiguity: evidence review is not represented as executed runtime testing.
- Human accountability: approved tagline is positioning, not case-specific proof of review.
- Payment: existing PayPal flow is tied to claims; do not extend by changing client-side price or redirect.
- Stripe: merchant readiness and API integration unverified.
- SEO: preserve canonical URLs and sitemap; no deletions without redirects.
- Confidentiality: request only non-sensitive initial details.
- RU/EN: technical translation required; Russian text excludes ё.
- Preview: requires independently verified deployment; a GitHub commit is not a Preview.
- Acceptance: baseline -> change set -> tests -> Preview -> evidence -> PASS/RETEST/HOLD/UNESTABLISHED.
- No merge or production deployment without explicit owner approval.

## Next work package
1. Verify remaining 21 routes, cross-links, current forms and governance files.
2. Prepare homepage EN/RU content and code diff in this isolated branch.
3. Run static checks and request preview verification.
4. Present evidence and acceptance decision; do not release production.
