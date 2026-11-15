#!/usr/bin/env python3
"""Local SQLite test harness for the HITL migration; not a Cloudflare D1 integration test.
Usage: python3 tests/test_hitl_sqlite.py
"""
import sqlite3
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from tempfile import TemporaryDirectory

SQL = (Path(__file__).resolve().parents[1] / "cloudflare" / "hitl-registry-migration.sql").read_text()

def setup(db):
    con = sqlite3.connect(db, timeout=10)
    con.executescript(SQL)
    con.execute("INSERT INTO hitl_cases(source_type,source_id) VALUES('claim',1)")
    con.execute("INSERT INTO hitl_cases(source_type,source_id) VALUES('service',1)")
    con.commit()
    return con

def event(con, case_id, gate, decision="PASS", actor="Andrey Ekhmenin"):
    con.execute("INSERT INTO hitl_events(case_id,gate,decision,evidence_ref,actor) VALUES(?,?,?,?,?)",
                (case_id,gate,decision,"test/evidence",actor))
    con.commit()

def rejected(fn):
    try:
        fn()
    except sqlite3.DatabaseError:
        return
    raise AssertionError("Expected database rejection")

def run():
    with TemporaryDirectory() as tmp:
        db = tmp + "/hitl.sqlite"
        con = setup(db)
        assert con.execute("SELECT COUNT(*) FROM hitl_cases").fetchone()[0] == 2
        rejected(lambda: con.execute("INSERT INTO hitl_cases(source_type,source_id) VALUES('claim',1)"))
        rejected(lambda: event(con,1,"H5"))
        rejected(lambda: event(con,1,"H2"))
        rejected(lambda: event(con,1,"H1",actor="Other Person"))
        event(con,1,"H1")
        event(con,1,"H2")
        event(con,1,"H3")
        event(con,1,"H3","HOLD")
        rejected(lambda: event(con,1,"H4"))
        event(con,1,"H3")
        event(con,1,"H4")
        con.commit()
        con.close()
        def race(_):
            c = sqlite3.connect(db,timeout=10)
            try:
                event(c,1,"H5")
                return "ok"
            except sqlite3.DatabaseError:
                return "rejected"
            finally:
                c.close()
        with ThreadPoolExecutor(max_workers=2) as pool:
            results=list(pool.map(race,range(2)))
        assert sorted(results)==["ok","rejected"],results
        con=sqlite3.connect(db)
        assert con.execute("SELECT status FROM hitl_cases WHERE id=1").fetchone()[0]=="PASS"
        assert con.execute("SELECT COUNT(*) FROM hitl_events WHERE case_id=1 AND gate='H5'").fetchone()[0]==1
        rejected(lambda: event(con,1,"H1"))
        rejected(lambda: con.execute("UPDATE hitl_events SET decision='HOLD' WHERE case_id=1"))
        rejected(lambda: con.execute("DELETE FROM hitl_events WHERE case_id=1"))
        event(con,2,"H1","STOP")
        assert con.execute("SELECT status FROM hitl_cases WHERE id=2").fetchone()[0]=="STOP"
        rejected(lambda: event(con,2,"H2"))
        print("PASS: 14 local SQLite assertions / scenarios, including two concurrent H5 inserts.")
        print("NOT TESTED: Cloudflare D1 preview, HTTP API, real authentication, production.")
if __name__=="__main__":
    run()
