# BOXVIA — UNIFIED ORDERS SANDBOX READINESS RECORD

**Date:** 2026-11-21  
**Branch:** `work/technical-pilots-first-20261118`  
**Environment:** `boxvia-orders-sandbox` / `boxvia-bxc-sandbox`  
**Decision:** **HOLD — no production payment enablement**  
**Scope:** $50 fixed-price Unified Orders; excludes the separate legacy $20 Check a Claim flow.

## 1. Verified evidence (PASS)

| Control | Evidence | Boundary |
|---|---|---|
| Server-side canonical consent and offer/confidentiality records | Offline HTTP acceptance and sandbox migrations | Synthetic requests; not real customers |
| D1 immutability of consent/document records | Remote negative probe workflow `44905421029` | Sandbox D1 only |
| One attempt per order per provider | Remote negative verification `44905850620` | Sandbox D1 only |
| One attempt across payment providers per order | Remote negative verification `44906435574` | Sandbox D1 only |
| Read-only PayPal recovery: success and negative cases | HTTP acceptance `44909409210`, `44911063411` | Mock provider; no actual PayPal order |
| Checkout index guards, Stripe/PayPal differentiated HOLD behavior | HTTP acceptance `44911063411` | Stripe missing-index gate tested; PayPal held at earlier global gate |
| Worker deployment, health, D1 evidence audit | Sandbox run `44911063469` | Isolated Worker only |
| Remote readiness inventory | `44908510863` | `NO_EXISTING_ELIGIBLE_FIXTURE` |
| PayPal Sandbox OAuth diagnostic | `44908859995` | `BLOCKED_MISSING_SANDBOX_CREDENTIALS`; workflow SUCCESS does not mean OAuth PASS |
| Cloudflare isolated Worker secret-name inventory | `44909100603` | `BOTH_ABSENT`; only names inspected |

## 2. Unverified or blocked (NOT PASS)

1. **PayPal Sandbox OAuth:** missing `PAYPAL_SANDBOX_CLIENT_ID` and `PAYPAL_SANDBOX_CLIENT_SECRET` in both GitHub `boxvia-preview` workflow context and isolated Worker secret inventory. No real OAuth token was obtained.
2. **Provider recovery against real PayPal Sandbox order:** no pre-existing eligible checkout fixture with persisted provider order ID. Provider GET has only mock-based evidence.
3. **Actual end-to-end provider lifecycle:** no verified real PayPal Sandbox create/approve/capture/webhook/settlement and no Stripe provider lifecycle acceptance under the current HOLD.
4. **Production operational readiness:** real notifications, operator reconciliation, rollback, secret management and authorization to release payments are not established by these tests.
5. **PayPal creation missing-index HTTP scenario:** the global HOLD rejects this route before schema lookup. Do not claim this scenario was dynamically exercised without changing the HOLD boundary.

## 3. Release gates

**Gate A — sandbox credentials:** independently issued PayPal Sandbox client ID/secret must be provisioned as isolated Worker secrets; do not reuse live credentials or log secret values.

**Gate B — provider evidence:** validate OAuth, existing-order recovery and provider lifecycle using isolated test accounts and synthetic orders, with explicit authorization for any test transaction.

**Gate C — reconciliation:** verify one-order/one-attempt invariants, webhook deduplication, payment state transition, recovery, exception handling, and read-only audit.

**Gate D — production review:** verify customer notices, confidentiality and retention rules, operator fulfillment/notifications, deployment isolation, monitoring and rollback.

**Gate E — separate authorization:** require an explicit documented GO decision before changing production flags, routes, credentials or real payment behavior.

## 4. Immediate safe work

Continue offline negative tests, read-only audits, documentation and sandbox-only reviews without changing checkout flags.

Do not rerun applied migrations, do not copy production secrets, and do not create or capture real payments.

**Status:** **SANDBOX LOGIC ACCEPTED WITH EXCEPTIONS / PROVIDER INTEGRATION BLOCKED / PRODUCTION HOLD**.
