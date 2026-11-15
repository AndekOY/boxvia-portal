import sqlite3
from pathlib import Path
root=Path("cloudflare")
db=sqlite3.connect(":memory:",isolation_level=None)
for path in ("hitl-registry-migration.sql","hitl-human-attestation-migration.sql","hitl-signed-commit-guard-preview.sql","hitl-signed-atomic-preview.sql"):
    db.executescript((root/path).read_text())
db.execute("INSERT INTO hitl_cases(source_type,source_id,assessor) VALUES('service',987,'TEST_ONLY')")
case=db.execute("SELECT id FROM hitl_cases").fetchone()[0]
def event(gate):
    db.execute("INSERT INTO hitl_events(case_id,gate,decision,evidence_ref,actor) VALUES(?,?,'PASS','synthetic/test','TEST_ONLY')",(case,gate))
event("H1");event("H2")
def blocked(gate):
    try: event(gate)
    except sqlite3.IntegrityError: return
    raise AssertionError(f"unsigned {gate} accepted")
blocked("H3")
db.execute("INSERT INTO hitl_authenticators(credential_id,owner_id,public_key_cose,rp_id,state,enrollment_ref) VALUES('synthetic-key','TEST_ONLY','not-a-real-key','test.invalid','ACTIVE','test')")
def prepare(gate,tag):
    db.execute("""INSERT INTO hitl_auth_challenges(id,case_id,gate,decision,payload_sha256,chain_head_sha256,credential_id,challenge_sha256,expires_at)
        VALUES(?, ?,?,'PASS',?,?,'synthetic-key',?,CAST(strftime('%s','now') AS INTEGER)+120)""",(f"challenge-{tag}",case,gate,"a"*64,"b"*64,format(int(tag), "064x")))
    db.execute("""INSERT INTO hitl_verified_commit_intents(id,challenge_id,case_id,gate,payload_sha256,assertion_sha256,credential_id)
        VALUES(?,?,?,? ,?,?,'synthetic-key')""",(f"intent-{tag}",f"challenge-{tag}",case,gate,"a"*64,format(int(tag)+100,"064x")))
prepare("H3","1")
event("H3")
assert db.execute("SELECT count(*) FROM hitl_auth_proofs").fetchone()[0]==1
assert db.execute("SELECT state FROM hitl_auth_challenges WHERE id='challenge-1'").fetchone()[0]=="CONSUMED"
assert db.execute("SELECT state FROM hitl_verified_commit_intents WHERE id='intent-1'").fetchone()[0]=="CONSUMED"
blocked("H3")
print("PASS H3 event, proof, challenge and intent paired atomically; replay rejected")
prepare("H4","2");event("H4")
prepare("H5","3");event("H5")
assert db.execute("SELECT status FROM hitl_cases").fetchone()[0]=="PASS"
assert db.execute("SELECT count(*) FROM hitl_auth_proofs").fetchone()[0]==3
blocked("H5")
print("PASS H4/H5 proof pairing, final case PASS and post-close rejection")
try:
    db.execute("UPDATE hitl_auth_proofs SET uv=0 WHERE id=1")
    raise AssertionError("proof modified")
except sqlite3.IntegrityError: pass
print("PASS immutable proof")
print("LIMIT: synthetic intents are NOT authenticated WebAuthn assertions; no identity claim")
