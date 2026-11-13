# EDC-004 — PDF production and acceptance status

Date: 2026-11-13. Sandbox branch only.

## Local rendered QA completed
- English and Russian two-page A4 PDFs generated with ReportLab and rendered for inspection.
- Each version: exactly 2 pages, one embedded BoxVia image and one footer URL annotation on each page.
- Cyrillic font embedded in RU PDF; EN and RU text extracted successfully.
- Local PDFs available in the ChatGPT conversation as downloadable artifacts. **They are not yet confirmed committed to GitHub**.

## GitHub status
- EN PDF already exists in the sandbox branch.
- RU PDF generator and sandbox-only Actions workflow exist in the branch.
- At the time of this record, the RU PDF was not found in the sandbox repository tree; GitHub workflow success is unconfirmed.
- Therefore the GitHub version and local rendered versions must not be treated as byte-identical or fully synchronized.

## Source-evidence gate
- The controlling primary source is OpenAI Help Center article 6783457, commercial-use FAQ.
- A timestamped immutable source capture and SHA-256 have not been obtained. The report discloses this limitation.
- No immutable archival evidence should be fabricated.

## Acceptance decision
**HOLD — awaiting GitHub RU artifact confirmation, direct visual review of the exact committed PDFs, and primary-source snapshot/recency check.**
No Production merge or deployment is authorized.
