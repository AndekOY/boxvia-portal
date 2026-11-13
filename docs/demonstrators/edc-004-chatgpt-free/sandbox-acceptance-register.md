# EDC-004 — Sandbox acceptance register

**Date:** 2026-11-13  
**Status:** HOLD / NOT ACCEPTED FOR PRODUCTION

## Approved reference

Google Drive: `PIZZA BoxVia_Check_a_Claim_TEMPLATE_TWO_PAGE_DRAFT_v3.pdf` (file ID `1STmMnzNuVNf4c9pLXYiTiVa7xkg52zCm`).

Reference inspected: 2 A4 pages (595.28 × 841.89 pt), one embedded image and one hyperlink on each page; ten sections across two pages. Reference page 1 title: Evidence Assessment Report; page 2: Reasoning & Methodological Record.

## Implemented in sandbox

- [x] Single claim and identified first-party OpenAI Help Center FAQ.
- [x] Controlled SUPPORTED finding with explicit qualification.
- [x] English PDF committed at `assets/reports/everyday-claims/EDC-004_ChatGPT_Free_SUPPORTED_EN.pdf`.
- [x] Bilingual EN/RU report text in `report-bilingual-draft-v0.3.md`.
- [x] Reproducible PDF generator in `scripts/build_edc004.py`.
- [x] Automated preflight script `scripts/qa_edc004_pdf.py` wired to sandbox-only GitHub Actions workflow.
- [x] Production untouched.

## Acceptance still required

- [ ] Confirm GitHub Actions **PASS** for the PDF preflight on the current branch commit. The mere presence of the workflow is not proof of a passing run.
- [ ] Render both pages of the **generated EDC-004 PDF** and compare visually with approved template: logo, hierarchy, margins, color, typography, footer, legibility and absence of collisions.
- [ ] Ensure generated PDF's source version, access time and evidence quotes are verifiably recorded; retain source snapshot or clearly disclose its absence.
- [ ] Reconfirm OpenAI Help Center wording immediately before approval.
- [ ] Generate and inspect a Russian technical-translation PDF, preserving the same methodological limits and using Cyrillic-capable fonts.
- [ ] Editorial/methodological sign-off.
- [ ] Separate owner authorization before merging or deploying to Production.

## Important control

The generated English PDF cannot be declared visually accepted from inspection of the *reference template alone*. The automated preflight validates PDF structure, not equivalence of the rendered design. The approved template and EDC-004 output must both be rendered and inspected.

**Decision:** SANDBOX HOLD. No merge or Production deploy.
