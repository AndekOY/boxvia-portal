# BCDE Cloudflare Access — sandbox rollout (2026-11-21)
Status: CODE IMPLEMENTED / CLOUDFLARE ACCESS CONFIGURATION NOT APPLIED / NOT ACCEPTED.
Scope: isolated boxvia-orders-sandbox Worker only. Production/main HOLD.

## Owner authentication
- Owner page /bcde-owner and /api/bcde/* independently verify a signed Cloudflare Access RS256 JWT.
- Required Worker variables: BCDE_ACCESS_TEAM_DOMAIN (example: team.cloudflareaccess.com), BCDE_ACCESS_AUD (the exact Access application AUD tag), BCDE_OWNER_EMAIL (exact permitted email).
- Identity must match the email claim in a verified JWT; checks issuer, audience, iat, nbf, exp and Cloudflare JWKS signature. Fail closed on missing configuration or invalid tokens.
- Remove obsolete BCDE_OWNER_TOKEN after independent acceptance; it is not used by BCDE anymore.
- No authentication token or passkey is typed into the owner console.

## Cloudflare Zero Trust setup (manual dashboard, not yet performed)
1. Create a **separate self-hosted Access application** for hostname boxvia-orders-sandbox.andeks.workers.dev, with two protected paths: /bcde-owner and /api/bcde/*; if dashboard does not support multi-path on one app, create two apps and configure an accepted AUD for each or use a single application protecting the entire sandbox hostname. Do NOT protect webhook paths without an explicit provider strategy.
2. Access policy: Allow only the owner's verified identity via existing passkey-capable login method. Do not reuse the HITL preview application's AUD tag or allow policy blindly.
3. Record Access team domain and application AUD tag; configure sandbox Worker variables above. Never put identity secrets in repository.
4. Verify unauthorized access to both owner UI and API is blocked; verified owner can load UI and API; payment webhook and test routes retain their intended behavior.
5. Review Access application policy, identity provider behavior, and logs before accepting.

## Important isolation note
A self-hosted Access app scoped to the **entire sandbox hostname** would also gate Stripe webhook and checkout routes, breaking provider calls. Prefer distinct owner-only hostname or correct path-specific Access applications. If paths cannot be isolated safely, do not deploy until an owner-specific hostname is configured.

## Known limitations
Cloudflare configuration cannot be applied through current GitHub connector; the user must create the Access application and set Worker variables in Cloudflare dashboard. R2, D1 migrations, Unicode PDF, and commercial acceptance source verification remain outstanding. Existing JWT tests are offline and are not an end-to-end Access test.
