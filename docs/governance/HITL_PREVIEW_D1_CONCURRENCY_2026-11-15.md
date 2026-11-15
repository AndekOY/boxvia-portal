# HITL Preview D1 Concurrency Acceptance - 2026-11-15
Status: PASS within tested D1 scope / production HOLD
GitHub Actions: https://github.com/AndekOY/boxvia-portal/actions/runs/43707913345
Environment: isolated Cloudflare Preview D1 baf79e93-cbea-4786-8779-974f3b3afbcc

## Verified evidence
The job executed two concurrent Wrangler remote D1 INSERT commands attempting H5 PASS for the same synthetic case after H1-H4 PASS.
Log records:
- PASS exactly one of two concurrent H5 commands accepted
- PASS final case status PASS and exactly one H5 event

## Scope boundaries
This validates one real two-request concurrency scenario at D1 database level.
It does not constitute exhaustive concurrency proof, and does not test HTTP API authorization, origin checks, or deployment behavior.
Synthetic case retained as immutable test evidence. No customer record was modified.
Production main, Worker and D1 unchanged.

## Next required acceptance
Deploy a separate preview Worker with dedicated preview D1 binding and separate owner token, then execute HTTP authorization and gate tests.
Do not deploy to production without owner approval.
