"""BXC synthetic SQLite staging verification. Never connects to production."""
import pathlib
import sqlite3
import unittest

ROOT = pathlib.Path(__file__).resolve().parent

def database():
    db = sqlite3.connect(':memory:')
    db.execute('PRAGMA foreign_keys=ON')
    db.executescript((ROOT / 'schema.sql').read_text())
    db.executescript((ROOT / 'seed.sql').read_text())
    return db

class StagingTests(unittest.TestCase):
    def setUp(self): self.db = database()
    def tearDown(self): self.db.close()
    def count(self): return self.db.execute((ROOT / 'verify.sql').read_text().split(';')[0]).fetchone()[0]
    def test_baseline_one_candidate(self): self.assertEqual(self.count(), 1)
    def test_five_synthetic_claims(self): self.assertEqual(self.db.execute('SELECT COUNT(*) FROM claims').fetchone()[0], 5)
    def test_fk_check_clean(self): self.assertEqual(self.db.execute('PRAGMA foreign_key_check').fetchall(), [])
    def test_three_no_action_foreign_keys(self):
        for table in ('claim_access','paypal_orders','notification_outbox'):
            keys = self.db.execute(f'PRAGMA foreign_key_list({table})').fetchall()
            self.assertEqual(len(keys),1)
            self.assertEqual(keys[0][2],'claims')
            self.assertEqual(keys[0][6],'NO ACTION')
    def test_paid_never_candidate(self):
        self.db.execute("UPDATE claims SET payment_status='paid' WHERE id=1001")
        self.assertEqual(self.count(),0)
    def test_order_blocks(self):
        self.db.execute("INSERT INTO paypal_orders(id,claim_id,paypal_order_id,amount,currency,status,created_at,updated_at) VALUES (3001,1001,'SYNTHETIC-ORDER-3001','20','USD','CREATED','2026-09-01T12:00:00Z','2026-09-01T12:00:00Z')")
        self.assertEqual(self.count(),0)
    def test_outbox_blocks(self):
        self.db.execute("INSERT INTO notification_outbox(id,claim_id,event_type,status,attempts,created_at,updated_at) VALUES (4001,1001,'created','sent',1,'2026-09-01T12:00:00Z','2026-09-01T12:00:00Z')")
        self.assertEqual(self.count(),0)
    def test_hold_blocks(self):
        self.db.execute('UPDATE bxc_retention_control SET legal_hold=1 WHERE claim_id=1001')
        self.assertEqual(self.count(),0)
    def test_dispute_blocks(self):
        self.db.execute('UPDATE bxc_retention_control SET dispute_open=1 WHERE claim_id=1001')
        self.assertEqual(self.count(),0)
    def test_unreconciled_blocks(self):
        self.db.execute('UPDATE bxc_retention_control SET payment_reconciled=0 WHERE claim_id=1001')
        self.assertEqual(self.count(),0)
    def test_missing_control_blocks(self):
        self.db.execute('DELETE FROM bxc_retention_control WHERE claim_id=1001')
        self.assertEqual(self.count(),0)
    def test_noncanonical_timestamp_blocks(self):
        self.db.execute("UPDATE claims SET created_at='2026-09-01 12:00:00' WHERE id=1001")
        self.assertEqual(self.count(),0)
    def test_fk_rejects_parent_deletion(self):
        with self.assertRaises(sqlite3.IntegrityError): self.db.execute('DELETE FROM claims WHERE id=1005')
    def test_outbox_unique_key(self):
        sql="INSERT INTO notification_outbox(id,claim_id,event_type,status,attempts,created_at,updated_at) VALUES (?,?,?,?,?,?,?)"
        self.db.execute(sql,(4001,1001,'created','sent',1,'2026-09-01T12:00:00Z','2026-09-01T12:00:00Z'))
        with self.assertRaises(sqlite3.IntegrityError): self.db.execute(sql,(4002,1001,'created','sent',1,'2026-09-01T12:00:00Z','2026-09-01T12:00:00Z'))
    def test_paypal_order_unique_key(self):
        with self.assertRaises(sqlite3.IntegrityError):
            self.db.execute("INSERT INTO paypal_orders(id,claim_id,paypal_order_id,amount,currency,status,created_at,updated_at) VALUES (3002,1001,'SYNTHETIC-ORDER-2005','20','USD','CREATED','2026-09-01T12:00:00Z','2026-09-01T12:00:00Z')")
    def test_capture_unique_nullable(self):
        self.db.execute("UPDATE paypal_orders SET capture_id='SYNTHETIC-CAPTURE' WHERE id=2005")
        self.db.execute("INSERT INTO paypal_orders(id,claim_id,paypal_order_id,amount,currency,status,capture_id,created_at,updated_at) VALUES (3003,1001,'SYNTHETIC-ORDER-3003','20','USD','CREATED',NULL,'2026-09-01T12:00:00Z','2026-09-01T12:00:00Z')")
        with self.assertRaises(sqlite3.IntegrityError): self.db.execute("UPDATE paypal_orders SET capture_id='SYNTHETIC-CAPTURE' WHERE id=3003")

if __name__=='__main__': unittest.main()
