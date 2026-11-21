#!/usr/bin/env python3
"""Real SQLite acceptance of Stripe paid-once transaction; no remote Cloudflare access."""
import sqlite3
import uuid
from pathlib import Path

db = sqlite3.connect(":memory:")
db.execute("PRAGMA foreign_keys=ON")
db.execute("CREATE TABLE service_requests(id INTEGER PRIMARY KEY)")
db.execute("INSERT INTO service_requests(id) VALUES (7001)")
db.executescript(Path("migrations/unified-orders-sandbox-v0.1.sql").read_text())
order = str(uuid.uuid4())
attempt = str(uuid.uuid4())
session = "cs_test_123456789"
payment = "pi_123456789"
event = "evt_123456789"
db.execute("INSERT INTO service_orders(id,service_request_id,service_code,amount_minor,currency,capability_hash,status) VALUES (?,7001,'one-question-review',5000,'USD',?,'checkout')",(order,"a"*64))
db.execute("INSERT INTO payment_attempts(id,order_id,provider,provider_order_id,status,amount_minor,currency) VALUES (?,?,'stripe',?,'pending',5000,'USD')",(attempt,order,session))
db.commit()

def settle(event_digest):
    with db:
        db.execute("INSERT OR IGNORE INTO payment_events(provider,event_id,event_type,payload_digest) VALUES ('stripe',?,'checkout.session.completed',?)",(event,event_digest))
        updated = db.execute(
            "UPDATE service_orders SET status='paid',paid_at=CURRENT_TIMESTAMP WHERE id=? AND status='checkout' AND amount_minor=5000 AND currency='USD' AND EXISTS (SELECT 1 FROM payment_events WHERE provider='stripe' AND event_id=? AND payload_digest=? AND processed_at IS NULL) AND EXISTS (SELECT 1 FROM payment_attempts WHERE id=? AND provider='stripe' AND provider_order_id=? AND amount_minor=5000 AND currency='USD' AND status IN ('created','pending','verified'))",
            (order,event,event_digest,attempt,session)).rowcount
        db.execute("UPDATE payment_attempts SET status='verified',provider_payment_id=?,verified_at=CURRENT_TIMESTAMP WHERE id=? AND provider='stripe' AND provider_order_id=? AND status IN ('created','pending','verified') AND EXISTS (SELECT 1 FROM service_orders WHERE id=? AND status='paid')",(payment,attempt,session,order))
        db.execute("INSERT OR IGNORE INTO fulfillment_outbox(id,order_id,status) SELECT ?,id,'pending' FROM service_orders WHERE id=? AND status='paid' AND EXISTS (SELECT 1 FROM payment_attempts WHERE id=? AND provider='stripe' AND provider_payment_id=? AND status='verified')",(str(uuid.uuid4()),order,attempt,payment))
        db.execute("UPDATE payment_events SET processed_at=CURRENT_TIMESTAMP WHERE provider='stripe' AND event_id=?",(event,))
    return updated

assert settle("b"*64)==1
assert settle("b"*64)==0
assert settle("c"*64)==0
assert db.execute("SELECT status FROM service_orders WHERE id=?",(order,)).fetchone()[0]=="paid"
assert db.execute("SELECT count(*) FROM fulfillment_outbox WHERE order_id=?",(order,)).fetchone()[0]==1
assert db.execute("SELECT count(*) FROM payment_events WHERE provider='stripe'").fetchone()[0]==1
assert db.execute("SELECT payload_digest FROM payment_events WHERE event_id=?",(event,)).fetchone()[0]=="b"*64
print("PASS: real SQLite paid-once, event replay, payload collision, one fulfillment")
