# Dedicated BCDE Owner Worker — sandbox rollout
Status: implementation committed; deployment and Cloudflare Access policy not yet verified.

## Isolation
Worker: boxvia-bcde-owner
URL after deployment: https://boxvia-bcde-owner.andeks.workers.dev/
Config: wrangler.bcde-owner.jsonc
D1: boxvia-bxc-sandbox (shared read/write sandbox database)
Payment Worker: boxvia-orders-sandbox — unchanged, not placed behind Access.
No Stripe/PayPal/webhook endpoints in dedicated BCDE Worker.

## Deploy sequence
1. In GitHub Actions manually dispatch 'BoxVia BCDE Owner - isolated sandbox deploy' from work/technical-pilots-first-20261118. This is intentionally not an automatic production deploy.
2. Check workflow logs and confirm isolated Worker appears in Cloudflare Workers & Pages.
3. In Cloudflare Zero Trust > Access > Applications > Create > Self-hosted and private > Workers, select only boxvia-bcde-owner. Type 'A Worker's production and preview URLs' is acceptable for this isolated Worker because it has no payment endpoints.
4. Set Allow policy to the owner's verified email identity only; use the existing passkey-enabled identity provider as appropriate.
5. Record the Access application AUD tag and the Access team domain. Set Worker variables BCDE_ACCESS_TEAM_DOMAIN, BCDE_ACCESS_AUD and BCDE_OWNER_EMAIL on boxvia-bcde-owner only. Never put credentials or JWTs in GitHub.
6. Verify an unauthenticated browser cannot access / or /api/bcde/download; authorized owner sees the console without token input. Check API calls with the browser Access session.
7. Add private R2 binding BCDE_ARCHIVE and sandbox D1 migrations only after separate configuration and evidence checks. Until then, PDF generation must fail closed.
8. Run full end-to-end test before any commercial use.

## Caveats
Cloudflare Access and Worker variables are not configured by the GitHub commit. The isolated Worker deliberately returns 401 until Access JWT verification variables are configured. No auto-email, faktura, KSeF, or Production changes.
