import sqlite3
from pathlib import Path
base=Path("cloudflare")
db=sqlite3.connect(":memory:")
for name in ["hitl-registry-migration.sql","hitl-human-attestation-migration.sql","hitl-signed-commit-guard-preview.sql"]:
    db.executescript((base/name).read_text())
db.execute("INSERT INTO hitl_cases(source_type,source_id,assessor) VALUES('service',123,'TEST_ONLY')")
case_id=db.execute("SELECT id FROM hitl_cases").fetchone()[0]
for gate in ("H1","H2"):
    db.execute("INSERT INTO hitl_events(case_id,gate,decision,evidence_ref,actor) VALUES(?,?,'PASS','synthetic/test','TEST_ONLY')",(case_id,gate))
try:
    db.execute("INSERT INTO hitl_events(case_id,gate,decision,evidence_ref,actor) VALUES(?,'H3','PASS','synthetic/test','TEST_ONLY')",(case_id,))
    raise AssertionError("unsigned H3 PASS was accepted")
except sqlite3.IntegrityError as exc:
    assert "hitl_verified_intent_required" in str(exc),str(exc)
print("PASS unsigned H3 PASS blocked at database trigger")
db.execute("INSERT INTO hitl_events(case_id,gate,decision,evidence_ref,actor) VALUES(?,'H3','HOLD','synthetic/test','TEST_ONLY')",(case_id,))
print("PASS H3 HOLD allowed")
db.execute("INSERT INTO hitl_authenticators(credential_id,owner_id,public_key_cose,rp_id,state,enrollment_ref) VALUES('test-credential','TEST_ONLY','synthetic','test.invalid','ACTIVE','synthetic/test')")
db.execute("INSERT INTO hitl_auth_challenges(id,case_id,gate,decision,payload_sha256,chain_head_sha256,credential_id,challenge_sha256,expires_at) VALUES('test-challenge',?,'H3','PASS',?,?,?, ?,CAST(strftime('%s','now') AS INTEGER)+120)",(case_id,'a'*64,'b'*64,'test-credential','c'*64))
db.execute("INSERT INTO hitl_verified_commit_intents(id,challenge_id,case_id,gate,payload_sha256,assertion_sha256,credential_id) VALUES('test-intent','test-challenge',?,'H3',? ,?,'test-credential')",(case_id,'a'*64,'d'*64))
db.execute("INSERT INTO hitl_events(case_id,gate,decision,evidence_ref,actor) VALUES(?,'H3','PASS','synthetic/test','TEST_ONLY')",(case_id,))
print("PASS synthetic verified-intent fixture permits H3 PASS")
print("LIMIT: fixture does not verify signature or enforce intent consumption; NOT production-safe")
