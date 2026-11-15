import sqlite3
from pathlib import Path
db=sqlite3.connect(":memory:",isolation_level=None)
root=Path("cloudflare")
for path in ("hitl-registry-migration.sql","hitl-human-attestation-migration.sql","hitl-signed-commit-guard-preview.sql","hitl-signed-atomic-preview.sql","hitl-signed-explicit-intent-v2-preview.sql"):
 db.executescript((root/path).read_text())
db.execute("INSERT INTO hitl_cases(source_type,source_id,assessor) VALUES('service',345,'TEST_ONLY')")
case=db.execute("SELECT id FROM hitl_cases").fetchone()[0]
def event(gate,intent=None):
 db.execute("INSERT INTO hitl_events(case_id,gate,decision,evidence_ref,actor,signed_intent_id) VALUES(?,?,'PASS','synthetic/evidence','TEST_ONLY',?)",(case,gate,intent))
def reject(gate,intent=None):
 try:event(gate,intent)
 except sqlite3.IntegrityError:return
 raise AssertionError(f"unexpected acceptance {gate} {intent}")
event("H1");event("H2")
db.execute("INSERT INTO hitl_authenticators(credential_id,owner_id,public_key_cose,rp_id,state,enrollment_ref) VALUES('synthetic-key','TEST_ONLY','synthetic','test.invalid','ACTIVE','synthetic')")
def intent(gate,n):
 db.execute("INSERT INTO hitl_auth_challenges(id,case_id,gate,decision,payload_sha256,chain_head_sha256,credential_id,challenge_sha256,expires_at) VALUES(?, ?,?,'PASS',?,?,'synthetic-key',?,CAST(strftime('%s','now') AS INTEGER)+120)",(f"challenge-{n}",case,gate,"a"*64,"b"*64,f"{n:064x}"))
 db.execute("INSERT INTO hitl_verified_commit_intents(id,challenge_id,case_id,gate,payload_sha256,assertion_sha256,credential_id) VALUES(?,?,?,? ,?,?,'synthetic-key')",(f"intent-{n}",f"challenge-{n}",case,gate,"a"*64,f"{n+100:064x}"))
intent("H3",1);intent("H3",2)
reject("H3")
reject("H3","nonexistent")
event("H3","intent-2")
assert db.execute("SELECT state FROM hitl_verified_commit_intents WHERE id='intent-1'").fetchone()[0]=="PENDING"
assert db.execute("SELECT state FROM hitl_verified_commit_intents WHERE id='intent-2'").fetchone()[0]=="CONSUMED"
assert db.execute("SELECT state FROM hitl_auth_challenges WHERE id='challenge-2'").fetchone()[0]=="CONSUMED"
assert db.execute("SELECT count(*) FROM hitl_auth_proofs").fetchone()[0]==1
reject("H3","intent-2")
reject("H4","intent-1")
print("PASS exact intent selection with two eligible H3 intents; no arbitrary first-match")
intent("H4",3);event("H4","intent-3")
intent("H5",4);event("H5","intent-4")
assert db.execute("SELECT status FROM hitl_cases").fetchone()[0]=="PASS"
assert db.execute("SELECT count(*) FROM hitl_auth_proofs").fetchone()[0]==3
reject("H5","intent-4")
print("PASS H3-H5 atomic proof, challenge consumption, replay rejection, final PASS")
print("LIMIT synthetic intents are not signed or owner-verified; NOT production-safe")
