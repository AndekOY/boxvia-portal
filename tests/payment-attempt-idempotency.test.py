#!/usr/bin/env python3
"""Prove sandbox payment attempt uniqueness and migration reentrancy offline."""
import sqlite3,pathlib
db=sqlite3.connect(":memory:")
db.execute("CREATE TABLE payment_attempts (id TEXT PRIMARY KEY,order_id TEXT NOT NULL,provider TEXT NOT NULL)")
sql=(pathlib.Path(__file__).resolve().parents[1]/"migrations/payment-attempt-idempotency-sandbox-v0.4.sql").read_text()
db.executescript(sql)
db.executescript(sql)
db.execute("INSERT INTO payment_attempts VALUES ('first','synthetic','stripe')")
db.execute("INSERT INTO payment_attempts VALUES ('second','synthetic','paypal')")
for provider in ("stripe","paypal"):
 try:db.execute("INSERT INTO payment_attempts VALUES (?,?,?)",("duplicate-"+provider,"synthetic",provider))
 except sqlite3.IntegrityError:pass
 else:raise AssertionError("Duplicate provider attempt accepted: "+provider)
assert db.execute("SELECT count(*) FROM payment_attempts").fetchone()[0]==2
print("PASS: per-order/provider uniqueness, cross-provider independence, idempotent migration")
