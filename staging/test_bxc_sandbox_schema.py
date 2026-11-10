#!/usr/bin/env python3
"""Validate BXC draft schema in a fresh in-memory SQLite database. No Cloudflare access."""
import pathlib
import sqlite3

schema = pathlib.Path("staging/bxc-sandbox-schema-draft.sql").read_text()
db = sqlite3.connect(":memory:")
db.execute("PRAGMA foreign_keys = ON")
db.executescript(schema)
required = {
 "claims": {"id","customer_email","claim_text","source_url","status","payment_status","notes"},
 "claim_access": {"claim_id","token_hash"},
 "paypal_orders": {"id","claim_id","paypal_order_id","amount","currency","status","capture_id","updated_at"},
 "notification_outbox": {"id","claim_id","event_type","status","attempts","updated_at","sent_at","last_error","created_at"},
 "contract_checkout_sessions": {"session_id","claim_id","customer_email","catalog_sha256","expires_at","status","snapshot_sha256"},
 "contract_acceptance_archive": {"order_id","snapshot_json","snapshot_sha256","acceptance_evidence_json","acceptance_evidence_sha256"},
 "contract_paypal_order_links": {"checkout_session_id","claim_id","paypal_order_id","snapshot_sha256"},
 "contract_paypal_create_attempts": {"checkout_session_id","claim_id","request_id","snapshot_sha256","status","paypal_order_id","updated_at"},
}
for table, expected in required.items():
 columns = {r[1] for r in db.execute(f"PRAGMA table_info({table})")}
 assert expected <= columns, f"{table}: missing {sorted(expected-columns)}"
for trigger in ("contract_acceptance_no_update","contract_acceptance_no_delete",
                "contract_paypal_link_no_update","contract_paypal_link_no_delete"):
 assert db.execute("SELECT 1 FROM sqlite_master WHERE type='trigger' AND name=?", (trigger,)).fetchone(), trigger
assert db.execute("PRAGMA foreign_key_check").fetchall() == []
# Re-applying the baseline should be safe on a fresh/unchanged schema.
db.executescript(schema)
assert db.execute("PRAGMA foreign_key_check").fetchall() == []
print("BXC sandbox schema: SQLite in-memory structure, triggers, idempotent DDL PASS")
