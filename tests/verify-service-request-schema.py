#!/usr/bin/env python3
"""Verify a fresh SQLite/D1-compatible service_requests schema against Worker INSERT."""
from pathlib import Path
import sqlite3

migration = Path("cloudflare/migrations/0001_service_requests.sql").read_text()
worker = Path("cloudflare/service-request.js").read_text()
insert = "INSERT INTO service_requests (service_code, service_title, customer_email, request_json, status) VALUES (?, ?, ?, ?, 'new')"
assert insert in worker, "Worker INSERT changed; update schema contract test"

with sqlite3.connect(":memory:") as db:
    db.executescript(migration)
    cols = {row[1] for row in db.execute("PRAGMA table_info(service_requests)")}
    assert {"id", "service_code", "service_title", "customer_email", "request_json", "status", "created_at"} <= cols
    for code in (
        "one-question-review", "ai-governance-review", "technical-pilot",
        "pre-decision-review", "ai-governance-gap-assessment", "faar-stage-1"
    ):
        db.execute(insert, (code, "Synthetic title", "synthetic@example.org", '{"summary":"Synthetic"}'))
    assert db.execute("SELECT COUNT(*) FROM service_requests").fetchone()[0] == 6
    try:
        db.execute(insert, ("invalid-code", "Synthetic title", "synthetic@example.org", "{}"))
    except sqlite3.IntegrityError:
        pass
    else:
        raise AssertionError("Unknown service_code unexpectedly accepted")
print("PASS: fresh SQLite schema supports Worker INSERT for all six services; invalid code rejected.")
