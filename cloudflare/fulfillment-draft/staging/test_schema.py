# INTERNAL DRAFT / RELEASE HOLD. LOCAL SQLITE ONLY.
import sqlite3, unittest
from pathlib import Path
SCHEMA = Path(__file__).with_name('schema.sql').read_text()
class TestSchema(unittest.TestCase):
    def setUp(self):
        self.db=sqlite3.connect(':memory:')
        self.db.executescript(SCHEMA)
        self.db.execute("INSERT INTO claims VALUES(1,'paid')")
        self.db.execute("INSERT INTO bxc_fulfillment(claim_id,updated_at) VALUES(1,'2026-11-09T17:00:00Z')")
    def tearDown(self): self.db.close()
    def test_initial_state(self):
        self.assertEqual(self.db.execute('SELECT state,state_version FROM bxc_fulfillment').fetchone(),('new',0))
    def test_no_orphan_fulfillment(self):
        with self.assertRaises(sqlite3.IntegrityError): self.db.execute("INSERT INTO bxc_fulfillment(claim_id,updated_at) VALUES(999,'x')")
    def test_no_orphan_event(self):
        with self.assertRaises(sqlite3.IntegrityError): self.db.execute("INSERT INTO bxc_fulfillment_events(claim_id,from_state,to_state,actor,occurred_at,idempotency_key,state_version) VALUES(999,'new','in_review','op','x','k',1)")
    def test_no_cascade(self):
        with self.assertRaises(sqlite3.IntegrityError): self.db.execute('DELETE FROM claims WHERE id=1')
    def test_invalid_state(self):
        with self.assertRaises(sqlite3.IntegrityError): self.db.execute("UPDATE bxc_fulfillment SET state='unknown' WHERE claim_id=1")
    def test_negative_version(self):
        with self.assertRaises(sqlite3.IntegrityError): self.db.execute('UPDATE bxc_fulfillment SET state_version=-1 WHERE claim_id=1')
    def test_delivered_needs_evidence(self):
        with self.assertRaises(sqlite3.IntegrityError): self.db.execute("UPDATE bxc_fulfillment SET state='delivered' WHERE claim_id=1")
    def test_closed_needs_delivery(self):
        with self.assertRaises(sqlite3.IntegrityError): self.db.execute("UPDATE bxc_fulfillment SET state='closed' WHERE claim_id=1")
    def test_duplicate_event_key(self):
        sql="INSERT INTO bxc_fulfillment_events(claim_id,from_state,to_state,actor,occurred_at,idempotency_key,state_version) VALUES(1,'new','in_review','op','x','k',?)"
        self.db.execute(sql,(1,))
        with self.assertRaises(sqlite3.IntegrityError): self.db.execute(sql,(2,))
    def test_duplicate_claim_version(self):
        sql="INSERT INTO bxc_fulfillment_events(claim_id,from_state,to_state,actor,occurred_at,idempotency_key,state_version) VALUES(1,'new','in_review','op','x',?,1)"
        self.db.execute(sql,('k1',))
        with self.assertRaises(sqlite3.IntegrityError): self.db.execute(sql,('k2',))
    def test_cas(self):
        sql="UPDATE bxc_fulfillment SET state='in_review',state_version=state_version+1 WHERE claim_id=1 AND state='new' AND state_version=0"
        self.assertEqual(self.db.execute(sql).rowcount,1)
        self.assertEqual(self.db.execute(sql).rowcount,0)
    def test_fk_integrity(self): self.assertEqual(self.db.execute('PRAGMA foreign_key_check').fetchall(),[])
if __name__=='__main__': unittest.main(verbosity=2)
