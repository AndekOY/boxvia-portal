#!/usr/bin/env python3
"""Read-only, aggregate-only sandbox D1 readiness report. No order IDs or PII."""
import json
import sys

COUNTERS = (
    "orders_total", "pending_orders", "checkout_orders", "attempts_total",
    "orphan_attempts", "orphan_consents", "unbound_attempts",
    "checkout_without_provider_binding", "duplicate_order_attempts",
    "pending_with_reserved_attempt", "consent_without_canonical_source",
)
BLOCKERS = (
    "orphan_attempts", "orphan_consents", "checkout_without_provider_binding",
    "duplicate_order_attempts", "consent_without_canonical_source",
)
RECONCILE = ("unbound_attempts", "pending_with_reserved_attempt")


def evaluate(payload):
    if not isinstance(payload, list) or len(payload) != 1:
        raise ValueError("Unexpected D1 response envelope")
    result = payload[0]
    if result.get("success") is not True or not isinstance(result.get("results"), list) or len(result["results"]) != 1:
        raise ValueError("D1 query did not succeed")
    row = result["results"][0]
    if not isinstance(row, dict) or any(
        type(row.get(k)) is not int or row[k] < 0 for k in COUNTERS
    ):
        raise ValueError("Missing or invalid aggregate counter")
    if row["pending_orders"] + row["checkout_orders"] > row["orders_total"]:
        raise ValueError("Inconsistent order status counts")
    if row["duplicate_order_attempts"] > row["attempts_total"]:
        raise ValueError("Inconsistent duplicate counter")
    if any(row[k] for k in BLOCKERS):
        status = "FAIL_INTEGRITY"
    elif any(row[k] for k in RECONCILE):
        status = "BLOCKED_RECONCILIATION"
    else:
        status = "PASS_AGGREGATE"
    return status, {k: row[k] for k in COUNTERS}


def main():
    if len(sys.argv) != 2:
        raise SystemExit("Usage: unified-orders-readiness-report.py <wrangler-json>")
    try:
        with open(sys.argv[1], encoding="utf-8") as handle:
            status, counts = evaluate(json.load(handle))
    except (OSError, ValueError, KeyError, TypeError, json.JSONDecodeError) as exc:
        print("READINESS: FAIL_INVALID_EVIDENCE", file=sys.stderr)
        raise SystemExit(1) from exc
    print("UNIFIED ORDERS SANDBOX — AGGREGATE READINESS")
    for key, value in counts.items():
        print(f"{key}: {value}")
    print("D1_INTEGRITY:", status)
    print("PROVIDER_OAUTH: BLOCKED_MISSING_SANDBOX_CREDENTIALS (last verified 2026-11-21; recheck separately)")
    print("PROVIDER_RECOVERY_FIXTURE: BLOCKED_NO_ELIGIBLE_FIXTURE (last verified 2026-11-21; recheck separately)")
    print("PRODUCTION_CHECKOUT: HOLD")
    print("No customer fields, IDs, tokens or payment provider calls included.")
    if status == "FAIL_INTEGRITY":
        raise SystemExit(1)


if __name__ == "__main__":
    main()
