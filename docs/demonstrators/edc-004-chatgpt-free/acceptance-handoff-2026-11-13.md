# EDC-004 | Acceptance handoff — 2026-11-13

**Branch:** `sandbox/edc-004-chatgpt-free-20261113`  
**Decision:** NOT YET READY FOR FINAL ACCEPTANCE. Production HOLD.

## Delivered
- EN report PDF committed: `assets/reports/everyday-claims/EDC-004_ChatGPT_Free_SUPPORTED_EN.pdf`.
- EN generator: `scripts/build_edc004.py`.
- RU technical-translation generator: `scripts/build_edc004_ru.py`.
- Sandbox workflow builds both PDFs and checks 2-page A4, section presence, canonical logo and footer links.
- Approved reference: `PIZZA BoxVia_Check_a_Claim_TEMPLATE_TWO_PAGE_DRAFT_v3.pdf`, Drive ID `1STmMnzNuVNf4c9pLXYiTiVa7xkg52zCm`.

## Remaining objective acceptance gates
1. Confirm latest GitHub Actions workflow completed successfully and RU PDF was actually committed to this branch.
2. Download/render **both generated PDFs**; visually compare each page to the approved template, including no clipping, overlaps, font substitution or illegible content.
3. Capture immutable or timestamped primary-source evidence from OpenAI Help Center article 6783457, commercial-use FAQ, with exact text, URL, access time, and hash or archive reference. Current report explicitly discloses absence of such a snapshot.
4. Verify the live FAQ wording again at sign-off and reconcile any changes.
5. Final EN/RU editorial sign-off, then request explicit owner GO for Production.

**Do not mark PASS** based solely on generator commits, unobserved workflow execution, or inspection of the template rather than the generated PDFs. This file documents the actual evidence boundary.
