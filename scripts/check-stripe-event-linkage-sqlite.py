#!/usr/bin/env python3
"""Sandbox-only SQLite proof of additive event linkage and replay safety."""
import sqlite3,uuid
from pathlib import Path
db=sqlite3.connect(":memory:")
db.execute("PRAGMA foreign_keys=ON")
db.execute("CREATE TABLE service_requests(id INTEGER PRIMARY KEY)")
db.execute("INSERT INTO service_requests VALUES (1)")
db.executescript(Path("migrations/unified-orders-sandbox-v0.1.sql").read_text())
db.executescript(Path("migrations/stripe-event-order-links-sandbox-v0.1.sql").read_text())
order=str(uuid.uuid4()); attempt=str(uuid.uuid4())
db.execute("INSERT INTO service_orders(id,service_request_id,service_code,amount_minor,currency,status,capability_hash) VALUES (?,1,'one-question-review',5000,'USD','checkout',?)",(order,"a"*64))
db.execute("INSERT INTO payment_attempts(id,order_id,provider,provider_order_id,status,amount_minor,currency) VALUES (?,?,'stripe','cs_test_123456789','pending',5000,'USD')",(attempt,order))
event="evt_123456789";digest="b"*64
def settle():
  with db:
    db.execute("INSERT OR IGNORE INTO payment_events(provider,event_id,event_type,payload_digest) VALUES ('stripe',?,'checkout.session.completed',?)",(event,digest))
    changed=db.execute("UPDATE service_orders SET status='paid',paid_at=CURRENT_TIMESTAMP WHERE id=? AND status='checkout' AND EXISTS (SELECT 1 FROM payment_events WHERE provider='stripe' AND event_id=? AND payload_digest=? AND processed_at IS NULL)",(order,event,digest)).rowcount
    if changed:
      db.execute("UPDATE payment_attempts SET status='verified',provider_payment_id='pi_123456789',verified_at=CURRENT_TIMESTAMP WHERE id=?",(attempt,))
      db.execute("INSERT INTO stripe_event_order_links(provider,event_id,order_id,payment_attempt_id,stripe_session_id,payload_digest) VALUES ('stripe',?,?,?,?,?)",(event,order,attempt,"cs_test_123456789",digest))
      db.execute("INSERT OR IGNORE INTO fulfillment_outbox(id,order_id) VALUES (?,?)",(str(uuid.uuid4()),order))
    db.execute("UPDATE payment_events SET processed_at=CURRENT_TIMESTAMP WHERE provider='stripe' AND event_id=?",(event,))
  return changed
assert settle()==1
assert settle()==0
assert db.execute("SELECT count(*) FROM stripe_event_order_links WHERE order_id=? AND event_id=? AND payment_attempt_id=?",(order,event,attempt)).fetchone()[0]==1
assert db.execute("SELECT count(*) FROM fulfillment_outbox WHERE order_id=?",(order,)).fetchone()[0]==1
assert db.execute("SELECT count(*) FROM payment_attempts WHERE order_id=? AND status='verified'",(order,)).fetchone()[0]==1
try:
  db.execute("INSERT INTO stripe_event_order_links(provider,event_id,order_id,payment_attempt_id,stripe_session_id,payload_digest) VALUES ('stripe',?,?,?,?,?)",(event,str(uuid.uuid4()),attempt,"cs_test_123456789",digest))
  raise AssertionError("event collision was accepted")
except sqlite3.IntegrityError:pass
print("PASS: additive linkage, replay, unique fulfillment, event collision")
