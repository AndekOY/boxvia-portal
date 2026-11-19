#!/usr/bin/env python3
"""Offline D1 SQLite migration preflight. Never connects to Cloudflare."""
import pathlib
import sqlite3

root = pathlib.Path(__file__).resolve().parents[1]
migration = (root / "migrations/unified-orders-sandbox-v0.1.sql").read_text()
db = sqlite3.connect(":memory:")
db.execute("PRAGMA foreign_keys=ON")
# Minimal structural stand-in ONLY. Actual existing D1 service_requests schema must
# be independently inspected before applying this migration to any remote database.
db.execute("CREATE TABLE service_requests (id INTEGER PRIMARY KEY, service_code TEXT NOT NULL)")
db.executescript(migration)
tables = {r[0] for r in db.execute("SELECT name FROM sqlite_master WHERE type='table'")}
required = {"service_orders", "service_quotes", "payment_attempts", "payment_events", "fulfillment_outbox"}
assert required <= tables, required - tables
db.execute("INSERT INTO service_requests (id,service_code) VALUES (7,'one-question-review')")
db.execute("INSERT INTO service_orders (id,service_request_id,service_code,amount_minor,currency,capability_hash) VALUES (?,?,?,?,?,?)",
           ("order-1", 7, "one-question-review", 5000, "USD", "a"*64))
try:
    db.execute("INSERT INTO service_orders (id,service_request_id,service_code,amount_minor,currency,capability_hash) VALUES (?,?,?,?,?,?)",
               ("order-2", 7, "one-question-review", 5000, "USD", "b"*64))
except sqlite3.IntegrityError:
    pass
else:
    raise AssertionError("Duplicate service request accepted")
try:
    db.execute("INSERT INTO payment_attempts (id,order_id,provider,status,amount_minor,currency) VALUES (?,?,?,?,?,?)",
               ("attempt-bad", "missing", "stripe", "created", 5000, "USD"))
except sqlite3.IntegrityError:
    pass
else:
    raise AssertionError("Missing order foreign key accepted")
db.execute("INSERT INTO payment_attempts (id,order_id,provider,provider_order_id,status,amount_minor,currency) VALUES (?,?,?,?,?,?,?)",
           ("attempt-1", "order-1", "stripe", "cs_test_unique", "created", 5000, "USD"))
try:
    db.execute("INSERT INTO payment_attempts (id,order_id,provider,provider_order_id,status,amount_minor,currency) VALUES (?,?,?,?,?,?,?)",
               ("attempt-2", "order-1", "stripe", "cs_test_unique", "created", 5000, "USD"))
except sqlite3.IntegrityError:
    pass
else:
    raise AssertionError("Duplicate provider order accepted")
db.execute("INSERT INTO payment_events (provider,event_id,event_type,payload_digest) VALUES (?,?,?,?)",
           ("stripe", "evt_1", "checkout.session.completed", "c"*64))
try:
    db.execute("INSERT INTO payment_events (provider,event_id,event_type,payload_digest) VALUES (?,?,?,?)",
               ("stripe", "evt_1", "checkout.session.completed", "c"*64))
except sqlite3.IntegrityError:
    pass
else:
    raise AssertionError("Duplicate webhook event accepted")
print("PASS: offline migration schema, FK, request deduplication, provider order uniqueness, event replay protection")
print("NOT VERIFIED: actual D1 schema, remote migration, provider checkout, atomic paid transition")
