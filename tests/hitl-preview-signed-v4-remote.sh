#!/usr/bin/env bash
set -euo pipefail
DB="baf79e93-cbea-4786-8779-974f3b3afbcc"
test "${PREVIEW_DB_ID:-}" = "$DB"
test "${PROD_DB_ID:-}" != "$DB"
SRC=$((700000000 + GITHUB_RUN_ID % 100000000))
CRED="synthetic-v4-${GITHUB_RUN_ID}"
CASE_SQL="(SELECT id FROM hitl_cases WHERE source_type='service' AND source_id=$SRC)"
execute(){ npx wrangler d1 execute "$DB" --remote --command "$1"; }
execute "INSERT INTO service_requests(id,service_code,service_title,customer_email,request_json,status) VALUES($SRC,'technical-pilot','SYNTHETIC SIGNED V4 TEST','synthetic@invalid.example','{}','new');" >/dev/null
execute "INSERT INTO hitl_cases(source_type,source_id,assessor) VALUES('service',$SRC,'TEST_ONLY');" >/dev/null
execute "INSERT INTO hitl_events(case_id,gate,decision,evidence_ref,actor) VALUES($CASE_SQL,'H1','PASS','synthetic/h1','TEST_ONLY'),($CASE_SQL,'H2','PASS','synthetic/h2','TEST_ONLY');" >/dev/null
execute "INSERT INTO hitl_authenticators(credential_id,owner_id,public_key_cose,rp_id,state,enrollment_ref) VALUES('$CRED','TEST_ONLY','synthetic','test.invalid','ACTIVE','SYNTHETIC_NOT_HUMAN');" >/dev/null
LAST=$(execute "SELECT COALESCE(MAX(id),0) AS last_id FROM hitl_events WHERE case_id=$CASE_SQL;" | sed -n 's/.*"last_id": \([0-9]*\).*/\1/p' | tail -1)
if ! [[ "$LAST" =~ ^[0-9]+$ ]]; then echo "Cannot parse snapshot; fail closed"; exit 1; fi
CH="synthetic-ch-${GITHUB_RUN_ID}"
INTENT="synthetic-intent-${GITHUB_RUN_ID}"
execute "INSERT INTO hitl_auth_challenges(id,case_id,gate,decision,payload_sha256,chain_head_sha256,credential_id,challenge_sha256,expires_at) VALUES('$CH',$CASE_SQL,'H3','PASS','$(printf 'a%.0s' {1..64})','$(printf 'b%.0s' {1..64})','$CRED','$(printf '%064x' "$GITHUB_RUN_ID")',CAST(strftime('%s','now') AS INTEGER)+300);" >/dev/null
execute "INSERT INTO hitl_verified_commit_intents(id,challenge_id,case_id,gate,payload_sha256,assertion_sha256,credential_id,evidence_ref,expected_last_event_id,verified_sign_count) VALUES('$INTENT','$CH',$CASE_SQL,'H3','$(printf 'a%.0s' {1..64})','$(printf '%064x' "$((GITHUB_RUN_ID+1))")','$CRED','synthetic/h3',$LAST,1);" >/dev/null
SQL="INSERT INTO hitl_events(case_id,gate,decision,evidence_ref,actor,signed_intent_id) VALUES($CASE_SQL,'H3','PASS','synthetic/h3','TEST_ONLY','$INTENT');"
set +e
execute "$SQL" > /tmp/hitl-race-1.log 2>&1 &
p1=$!
execute "$SQL" > /tmp/hitl-race-2.log 2>&1 &
p2=$!
wait "$p1"; r1=$?
wait "$p2"; r2=$?
set -e
if ! { [ "$r1" = 0 ] && [ "$r2" != 0 ]; } && ! { [ "$r2" = 0 ] && [ "$r1" != 0 ]; }; then
 echo "FAIL exactly one parallel H3 insert must succeed: $r1/$r2"
 cat /tmp/hitl-race-1.log /tmp/hitl-race-2.log
 exit 1
fi
echo "PASS one of two concurrent H3 writes accepted"
execute "SELECT COUNT(*) AS event_count FROM hitl_events WHERE case_id=$CASE_SQL AND gate='H3' AND decision='PASS';"
execute "SELECT COUNT(*) AS proof_count FROM hitl_auth_proofs WHERE challenge_id='$CH';"
execute "SELECT state FROM hitl_auth_challenges WHERE id='$CH';"
execute "SELECT sign_count FROM hitl_authenticators WHERE credential_id='$CRED';"
# Remote assertions are enforced in a single SQLite query that raises on mismatch.
# Using a deliberately invalid table name on mismatch causes the workflow to fail.
RESULT=$(execute "SELECT (SELECT COUNT(*) FROM hitl_events WHERE case_id=$CASE_SQL AND gate='H3' AND decision='PASS') AS event_count,(SELECT COUNT(*) FROM hitl_auth_proofs WHERE challenge_id='$CH') AS proof_count,(SELECT state FROM hitl_auth_challenges WHERE id='$CH') AS challenge_state,(SELECT sign_count FROM hitl_authenticators WHERE credential_id='$CRED') AS sign_count;")
echo "$RESULT"
echo "$RESULT" | grep -Eq '"event_count": ?1' 
echo "$RESULT" | grep -Eq '"proof_count": ?1'
echo "$RESULT" | grep -Eq '"challenge_state": ?"CONSUMED"'
echo "$RESULT" | grep -Eq '"sign_count": ?1'
if execute "$SQL" >/tmp/hitl-replay.log 2>&1; then echo 'FAIL replay accepted'; exit 1; fi
echo 'PASS replay rejected; exact one proof, challenge consumed, counter advanced'
echo 'IMPORTANT: synthetic DB intent is NOT WebAuthn verified human identity'
