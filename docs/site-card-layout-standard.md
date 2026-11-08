# BoxVia Site Card Layout Standard

Status: APPROVED
Approved: 2026-11-08
Reference implementation: `services/one-question-review/index.html` (hero `.oqr-intro`).

## Desktop composition

- Left: visual / branded card, **37.5%** of the content columns.
- Right: title, service description, price, and primary PDF/action button, **62.5%**.
- CSS grid: `grid-template-columns: minmax(250px, .75fr) minmax(0, 1.25fr)`.
- Column gap: **28px**.
- Align content vertically to the center (`align-items: center`).
- Preserve intrinsic media aspect ratio; do not stretch the BoxVia logo.
- Heading size: `clamp(2rem, 3.6vw, 3.25rem)`.
- Lead text: `1.08rem`, line-height `1.5`, vertical margin `12px 0`.
- Price line-height: `1.5`.
- Ensure the text column has `min-width: 0`.

## Mobile composition

- At viewport width <= 760px, use a single column (`minmax(0,1fr)`).
- Visual card appears before text and controls.
- Preserve button usability, legibility and proportional spacing.

## Scope and implementation

- Default standard for new BoxVia two-column branded **hero/service cards**.
- Apply to existing equivalent cards when updating them, without overriding distinct content-specific layouts.
- Do not apply 37.5/62.5 proportions to unrelated multi-card grids, reports, or footers.
- Preserve BoxVia brand assets and existing link destinations and form behavior.
- Use the reference implementation for exact CSS details and visual QA.
