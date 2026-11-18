# Audience-first site - static acceptance record
Date: 2026-11-18
Branch: work/technical-pilots-first-20261118
Status: RETEST (static checks passed; latest changes not yet deployed to Preview)
Production: unchanged

## Scope
- / (homepage)
- /services/
- /for-business/
- /for-developers/
- /for-creators/
- /for-researchers/

## Verified from GitHub source
- Each of six HTML files has exactly one h1 and one canonical tag.
- Section opening and closing tag counts match in all six.
- All six use English-only visible copy in checked HTML source.
- No em dash (U+2014) or en dash (U+2013) remains in these six files.
- Navigation has four audience entries and the shared Services, Reports, Research and Contact routes.
- Four audience pages link to existing service routes and carry explicit scope, evidence and human-accountability limitations.
- Four audience pages now include the existing Cloudflare Web Analytics beacon.
- Sitemap includes all four audience routes.
- The site language policy is English-only; Russian is the working language; chat translation is available when needed.

## Open acceptance gates
- Deploy latest branch changes to isolated Cloudflare Preview (not production).
- Verify desktop and mobile rendering, menu interaction, navigation, canonical links and CTA targets in browser.
- Check legal and privacy notices, accessibility and page load behavior.
- Verify public copy and offer mapping with the owner.
- Check remaining site routes for navigation consistency as a separate change set.
- Payment and intake integrations remain disabled in Preview and are not tested here.
- No production release without explicit owner approval.

## Classification
Static source checks: PASS.
Browser/Preview acceptance after latest commit: RETEST.
Full site acceptance: HOLD.
Production release: NOT AUTHORIZED.
