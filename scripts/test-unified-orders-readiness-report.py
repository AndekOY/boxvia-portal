#!/usr/bin/env python3
"""Regression tests for the aggregate-only readiness classifier."""
import importlib.util
import pathlib
import unittest

spec = importlib.util.spec_from_file_location("readiness", pathlib.Path(__file__).with_name("unified-orders-readiness-report.py"))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class ReadinessTests(unittest.TestCase):
    def payload(self, **changes):
        row = {key: 0 for key in module.COUNTERS}
        row.update(orders_total=2, pending_orders=1, checkout_orders=1, attempts_total=1)
        row.update(changes)
        return [{"success": True, "results": [row]}]

    def test_clean(self):
        self.assertEqual(module.evaluate(self.payload())[0], "PASS_AGGREGATE")

    def test_orphan_fails(self):
        self.assertEqual(module.evaluate(self.payload(orphan_attempts=1))[0], "FAIL_INTEGRITY")

    def test_duplicate_fails(self):
        self.assertEqual(module.evaluate(self.payload(duplicate_order_attempts=1))[0], "FAIL_INTEGRITY")

    def test_checkout_unbound_fails(self):
        self.assertEqual(module.evaluate(self.payload(checkout_without_provider_binding=1))[0], "FAIL_INTEGRITY")

    def test_ambiguous_reservation_requires_reconciliation(self):
        self.assertEqual(module.evaluate(self.payload(unbound_attempts=1))[0], "BLOCKED_RECONCILIATION")

    def test_pending_with_attempt_requires_reconciliation(self):
        self.assertEqual(module.evaluate(self.payload(pending_with_reserved_attempt=1))[0], "BLOCKED_RECONCILIATION")

    def test_integrity_overrides_reconciliation(self):
        self.assertEqual(module.evaluate(self.payload(orphan_consents=1, unbound_attempts=1))[0], "FAIL_INTEGRITY")

    def test_missing_counter_rejected(self):
        payload = self.payload()
        del payload[0]["results"][0]["orphan_consents"]
        with self.assertRaises(ValueError):
            module.evaluate(payload)

    def test_invalid_envelope_rejected(self):
        with self.assertRaises(ValueError):
            module.evaluate([{"success": False, "results": [{}]}])


if __name__ == "__main__":
    unittest.main()
