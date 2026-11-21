#!/usr/bin/env python3
"""Offline SQLite proof for sandbox-only immutable consent migration."""
import pathlib,sqlite3
root=pathlib.Path(__file__).resolve().parents[1]
sql=(root/"migrations/order-consent-immutability-sandbox-v0.3.sql").read_text()
db=sqlite3.connect(":memory:")
db.executescript("""
CREATE TABLE order_terms_acceptances (order_id TEXT PRIMARY KEY, terms_digest TEXT NOT NULL);
CREATE TABLE order_document_sources (order_id TEXT PRIMARY KEY, scope_text TEXT NOT NULL);
INSERT INTO order_terms_acceptances VALUES ('synthetic-order','digest');
INSERT INTO order_document_sources VALUES ('synthetic-order','canonical');
""")
db.executescript(sql)
db.executescript(sql)
for table,column,new in [
 ("order_terms_acceptances","terms_digest","changed"),
 ("order_document_sources","scope_text","changed")]:
 for statement in (
  f"UPDATE {table} SET {column}=? WHERE order_id='synthetic-order'",
  f"DELETE FROM {table} WHERE order_id='synthetic-order'"):
  try:
   db.execute(statement,(new,) if "UPDATE" in statement else ())
  except sqlite3.IntegrityError:
   pass
  else:
   raise AssertionError("Mutation was not blocked: "+statement)
assert db.execute("SELECT terms_digest FROM order_terms_acceptances").fetchone()==("digest",)
assert db.execute("SELECT scope_text FROM order_document_sources").fetchone()==("canonical",)
print("PASS: canonical sources and accepted terms reject UPDATE and DELETE; repeated migration safe")
