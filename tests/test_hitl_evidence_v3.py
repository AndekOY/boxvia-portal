import sqlite3
from pathlib import Path
db=sqlite3.connect(":memory:",isolation_level=None)
for name in ("hitl-registry-migration.sql","hitl-human-attestation-migration.sql","hitl-signed-commit-guard-preview.sql","hitl-signed-atomic-preview.sql","hitl-signed-explicit-intent-v2-preview.sql","hitl-signed-evidence-v3-preview.sql"):
 db.executescript((Path("cloudflare")/name).read_text())
db.execute("INSERT INTO hitl_cases(source_type,source_id,assessor) VALUES('service',765,'TEST_ONLY')")
case=db.execute("SELECT id FROM hitl_cases").fetchone()[0]
def event(gate,ref="synthetic/review",intent=None):
 db.execute("INSERT INTO hitl_events(case_id,gate,decision,evidence_ref,actor,signed_intent_id) VALUES(?,?,'PASS',?,'TEST_ONLY',?)",(case,gate,ref,intent))
def blocked(gate,ref,intent):
 try:event(gate,ref,intent)
 except sqlite3.IntegrityError:return
 raise AssertionError(f"accepted invalid {gate} {ref}")
event("H1");event("H2")
db.execute("INSERT INTO hitl_authenticators(credential_id,owner_id,public_key_cose,rp_id,state,enrollment_ref) VALUES('synthetic-key','TEST_ONLY','synthetic','test.invalid','ACTIVE','synthetic')")
def prepare(gate,n,ref):
 db.execute("INSERT INTO hitl_auth_challenges(id,case_id,gate,decision,payload_sha256,chain_head_sha256,credential_id,challenge_sha256,expires_at) VALUES(?, ?,?,'PASS',?,?,'synthetic-key',?,CAST(strftime('%s','now') AS INTEGER)+120)",(f"challenge-{n}",case,gate,"a"*64,"b"*64,f"{n:064x}"))
 db.execute("INSERT INTO hitl_verified_commit_intents(id,challenge_id,case_id,gate,payload_sha256,assertion_sha256,credential_id,evidence_ref) VALUES(?,?,?,? ,?,?,'synthetic-key',?)",(f"intent-{n}",f"challenge-{n}",case,gate,"a"*64,f"{n+100:064x}",ref))
prepare("H3",1,"synthetic/review")
blocked("H3","synthetic/altered","intent-1")
blocked("H3","synthetic/review",None)
assert db.execute("SELECT state FROM hitl_verified_commit_intents WHERE id='intent-1'").fetchone()[0]=="PENDING"
event("H3","synthetic/review","intent-1")
assert db.execute("SELECT count(*) FROM hitl_auth_proofs").fetchone()[0]==1
blocked("H3","synthetic/review","intent-1")
prepare("H4",2,"synthetic/judgment")
blocked("H4","synthetic/review","intent-2")
event("H4","synthetic/judgment","intent-2")
prepare("H5",3,"synthetic/report")
blocked("H5","synthetic/review","intent-3")
event("H5","synthetic/report","intent-3")
assert db.execute("SELECT status FROM hitl_cases").fetchone()[0]=="PASS"
assert db.execute("SELECT count(*) FROM hitl_auth_proofs").fetchone()[0]==3
print("PASS v3 exact intent/evidence binding and atomic proof pairing H3-H5")
print("PASS mismatched evidence, unsigned event, replay rejected")
print("LIMIT synthetic intents, not WebAuthn identity verification")
