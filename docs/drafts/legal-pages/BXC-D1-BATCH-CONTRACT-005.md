# BXC D1 batch contract — draft 005

**INTERNAL DRAFT / RELEASE HOLD** — 2026-11-09.

Cloudflare's current D1 Database API documents `batch()` as ordered, atomic, rollback-on-error execution of prepared statements: https://developers.cloudflare.com/d1/worker-api/d1-database/

A standalone **nonexecuting** JavaScript batch-contract builder was tested locally with Node's test runner: **10/10 passed**. The builder prepares a version-guarded UPDATE of `bxc_fulfillment` and an INSERT of `bxc_fulfillment_events`, using bound parameters. Delivery and closure transitions are deliberately blocked. The execution function always throws RELEASE_HOLD.

Artifact: `bxc-d1-batch-contract-v01.zip` supplied as a conversation attachment. Not deployed or imported by Worker.

**Critical unresolved issue:** the INSERT uses SQLite `changes()=1` to check the immediately preceding UPDATE. Whether this is reliable across separate prepared statements inside D1 `batch()` must be tested on isolated local D1 before treating the contract as sound. In particular, no-op/stale updates must produce neither an event nor a success response. Additionally, payment reconciliation, legal holds, disputes, actor authorization and evidence validation are not fully enforced by this draft SQL. The builder is not production-safe.

Next: isolated Wrangler D1 test with synthetic data, explicit stale/no-op and rollback assertions, then review a fail-closed mechanism for the zero-row UPDATE case. No remote D1 staging or production changes authorized.