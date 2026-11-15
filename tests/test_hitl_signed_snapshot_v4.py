import sqlite3
from pathlib import Path
db=sqlite3.connect(':memory:',isolation_level=None)
for f in ('hitl-registry-migration.sql','hitl-human-attestation-migration.sql','hitl-signed-commit-guard-preview.sql','hitl-signed-atomic-preview.sql','hitl-signed-explicit-intent-v2-preview.sql','hitl-signed-evidence-v3-preview.sql','hitl-signed-snapshot-v4-preview.sql'):
 db.executescript((Path('cloudflare')/f).read_text())
db.execute("INSERT INTO hitl_cases(source_type,source_id,assessor) VALUES('service',12345,'TEST_ONLY')")
case=db.execute('SELECT id FROM hitl_cases').fetchone()[0]
def event(gate,decision='PASS',intent=None):
 db.execute("INSERT INTO hitl_events(case_id,gate,decision,evidence_ref,actor,signed_intent_id) VALUES(?,?,?,'synthetic/review','TEST_ONLY',?)",(case,gate,decision,intent))
def reject(gate,intent):
 try:event(gate,intent=intent)
 except sqlite3.IntegrityError:return
 raise AssertionError('unexpected acceptance: '+str(intent))
event('H1');event('H2')
db.execute("INSERT INTO hitl_authenticators(credential_id,owner_id,public_key_cose,rp_id,state,enrollment_ref) VALUES('synthetic','TEST_ONLY','fake','test.invalid','ACTIVE','synthetic')")
def prepare(gate,n,snapshot,counter):
 db.execute("INSERT INTO hitl_auth_challenges(id,case_id,gate,decision,payload_sha256,chain_head_sha256,credential_id,challenge_sha256,expires_at) VALUES(?,?,?,'PASS',?,?,'synthetic',?,CAST(strftime('%s','now') AS INTEGER)+120)",(f'challenge-{n}',case,gate,'a'*64,'b'*64,f'{n:064x}'))
 db.execute("INSERT INTO hitl_verified_commit_intents(id,challenge_id,case_id,gate,payload_sha256,assertion_sha256,credential_id,evidence_ref,expected_last_event_id,verified_sign_count) VALUES(?,?,?,?,?,?,'synthetic','synthetic/review',?,?)",(f'intent-{n}',f'challenge-{n}',case,gate,'a'*64,f'{n+100:064x}',snapshot,counter))
last=lambda:db.execute('SELECT COALESCE(MAX(id),0) FROM hitl_events WHERE case_id=?',(case,)).fetchone()[0]
prepare('H3',1,last(),1)
event('H3',intent='intent-1')
assert db.execute("SELECT sign_count FROM hitl_authenticators").fetchone()[0]==1
assert db.execute('SELECT count(*) FROM hitl_auth_proofs').fetchone()[0]==1
reject('H3','intent-1')
print('PASS H3 atomic proof and monotonic counter')
prepare('H4',2,last(),2)
event('H4',decision='HOLD')
reject('H4','intent-2')
assert db.execute("SELECT state FROM hitl_verified_commit_intents WHERE id='intent-2'").fetchone()[0]=='PENDING'
prepare('H4',3,last(),1)
reject('H4','intent-3')
prepare('H4',4,last(),3)
event('H4',intent='intent-4')
assert db.execute("SELECT sign_count FROM hitl_authenticators").fetchone()[0]==3
print('PASS stale snapshot and counter replay blocked')
prepare('H5',5,last(),4)
event('H5',intent='intent-5')
assert db.execute("SELECT status FROM hitl_cases").fetchone()[0]=='PASS'
assert db.execute('SELECT count(*) FROM hitl_auth_proofs').fetchone()[0]==3
print('PASS final H5 atomic proof and case closure')
print('LIMIT: synthetic intents; no cryptographic assertion or human identity verified')
