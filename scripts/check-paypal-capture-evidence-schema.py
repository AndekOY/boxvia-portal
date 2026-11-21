#!/usr/bin/env python3
"""Offline proof of additive PayPal evidence migration. No remote access."""
import pathlib,sqlite3
root=pathlib.Path(__file__).resolve().parents[1]
db=sqlite3.connect(":memory:")
db.execute("PRAGMA foreign_keys=ON")
db.execute("CREATE TABLE service_requests (id INTEGER PRIMARY KEY,service_code TEXT NOT NULL)")
db.executescript((root/"migrations/unified-orders-sandbox-v0.1.sql").read_text())
migration=(root/"migrations/paypal-capture-evidence-sandbox-v0.1.sql").read_text()
db.executescript(migration)
db.executescript(migration)  # idempotent
db.execute("INSERT INTO service_requests(id,service_code) VALUES(1,'one-question-review')")
db.execute("INSERT INTO service_orders(id,service_request_id,service_code,amount_minor,currency,capability_hash) VALUES(?,?,?,?,?,?)",("order-1",1,"one-question-review",5000,"USD","a"*64))
db.execute("INSERT INTO payment_attempts(id,order_id,provider,status,amount_minor,currency) VALUES(?,?,?,?,?,?)",("attempt-1","order-1","paypal","verified",5000,"USD"))
db.execute("INSERT INTO paypal_capture_evidence(capture_id,paypal_order_id,order_id,payment_attempt_id,amount_minor,currency,capture_digest) VALUES(?,?,?,?,?,?,?)",("capture-1","paypal-1","order-1","attempt-1",5000,"USD","b"*64))
def rejects(sql,args=()):
 try:db.execute(sql,args)
 except sqlite3.IntegrityError:return
 raise AssertionError("Unsafe SQL succeeded: "+sql)
rejects("INSERT INTO paypal_capture_evidence(capture_id,paypal_order_id,order_id,payment_attempt_id,amount_minor,currency,capture_digest) VALUES(?,?,?,?,?,?,?)",("capture-2","paypal-2","order-1","attempt-1",5000,"USD","c"*64))
rejects("UPDATE paypal_capture_evidence SET amount_minor=2000 WHERE capture_id='capture-1'")
rejects("DELETE FROM paypal_capture_evidence WHERE capture_id='capture-1'")
rejects("INSERT INTO paypal_capture_evidence(capture_id,paypal_order_id,order_id,payment_attempt_id,amount_minor,currency,capture_digest) VALUES(?,?,?,?,?,?,?)",("capture-3","paypal-3","missing","missing",5000,"USD","d"*64))
assert db.execute("SELECT COUNT(*) FROM paypal_capture_evidence").fetchone()[0]==1
print("PASS: additive/idempotent PayPal capture evidence migration, FK, unique constraints, immutable triggers")
print("NOT VERIFIED: live D1 backup, remote migration, provider API settlement")
