#!/usr/bin/env python3
"""Verify fresh D1 schema against the observed Preview table contract and Worker INSERT.

Only an in-memory SQLite database is used. No remote D1 changes.
"""
from pathlib import Path
import sqlite3

migration = Path("cloudflare/migrations/0001_service_requests.sql").read_text()
worker = Path("cloudflare/service-request.js").read_text()
insert = "INSERT INTO service_requests (service_code, service_title, customer_email, request_json, status) VALUES (?, ?, ?, ?, 'new')"
assert insert in worker, "Worker INSERT changed; update schema contract test"

with sqlite3.connect(":memory:") as db:
    db.executescript(migration)
    columns = list(db.execute("PRAGMA table_info(service_requests)"))
    assert [row[1] for row in columns] == [
        "id", "service_code", "service_title", "customer_email",
        "request_json", "status", "created_at", "updated_at"
    ], "Fresh schema columns differ from audited Preview D1"
    assert columns[5][4] == "'new'"
    assert columns[6][4] == "CURRENT_TIMESTAMP"
    assert columns[7][4] == "CURRENT_TIMESTAMP"
    indexes = {row[1] for row in db.execute("PRAGMA index_list(service_requests)")}
    assert {"idx_service_requests_created_at", "idx_service_requests_review"} <= indexes

    for code in (
        "one-question-review", "ai-governance-review", "technical-pilot",
        "pre-decision-review", "ai-governance-gap-assessment", "faar-stage-1"
    ):
        db.execute(insert, (code, "Synthetic title", "synthetic@example.org", '{"summary":"Synthetic"}'))
    assert db.execute("SELECT COUNT(*) FROM service_requests").fetchone()[0] == 6
    assert db.execute("SELECT COUNT(*) FROM service_requests WHERE updated_at IS NOT NULL").fetchone()[0] == 6

    for status in ("new", "reviewing", "closed", "deleted"):
        db.execute("UPDATE service_requests SET status=? WHERE id=1", (status,))
        assert db.execute("SELECT status FROM service_requests WHERE id=1").fetchone()[0] == status

    for status in ("in_review", "invalid"):
        try:
            db.execute("UPDATE service_requests SET status=? WHERE id=1", (status,))
        except sqlite3.IntegrityError:
            pass
        else:
            raise AssertionError(f"Unsupported status accepted: {status}")

    # The audited remote table has no CHECK restriction on service_code.
    # Validation of allowed service codes belongs to the Worker services map.
    db.execute(insert, ("synthetic-unknown-code", "Synthetic title", "synthetic@example.org", "{}"))
    assert db.execute("SELECT COUNT(*) FROM service_requests").fetchone()[0] == 7

    # Re-running the fresh-install SQL must not destroy existing data.
    db.executescript(migration)
    assert db.execute("SELECT COUNT(*) FROM service_requests").fetchone()[0] == 7

print("PASS: fresh SQLite schema matches audited Preview columns/statuses/index names and Worker INSERT.")
