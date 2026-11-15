#!/usr/bin/env bash
# Real concurrent H5 attempts against isolated Cloudflare Preview D1.
set -euo pipefail
: "${PREVIEW_DB_ID:?}" "${PROD_DB_ID:?}" "${GITHUB_RUN_ID:?}"
[[ "$PREVIEW_DB_ID" == "baf79e93-cbea-4786-8779-974f3b3afbcc" && "$PREVIEW_DB_ID" != "$PROD_DB_ID" ]] || exit 1
ID="$(( 700000000 + GITHUB_RUN_ID % 100000000 ))"
execsql() { npx wrangler d1 execute "$PREVIEW_DB_ID" --remote --command "$1"; }
execsql "INSERT INTO hitl_cases(source_type,source_id) VALUES('service',$ID);" >/dev/null
for gate in H1 H2 H3 H4; do
  execsql "INSERT INTO hitl_events(case_id,gate,decision,evidence_ref,actor) VALUES((SELECT id FROM hitl_cases WHERE source_type='service' AND source_id=$ID),'$gate','PASS','synthetic/concurrent','Andrey Ekhmenin');" >/dev/null
done
SQL="INSERT INTO hitl_events(case_id,gate,decision,evidence_ref,actor) VALUES((SELECT id FROM hitl_cases WHERE source_type='service' AND source_id=$ID),'H5','PASS','synthetic/concurrent','Andrey Ekhmenin');"
set +e
execsql "$SQL" > /tmp/hitl-concurrent-1.log 2>&1 & p1=$!
execsql "$SQL" > /tmp/hitl-concurrent-2.log 2>&1 & p2=$!
wait "$p1"; r1=$?
wait "$p2"; r2=$?
set -e
if [[ "$(( (r1==0) + (r2==0) ))" != 1 ]]; then
 echo "FAIL: expected exactly one accepted H5, got exit codes $r1 and $r2"
 cat /tmp/hitl-concurrent-1.log /tmp/hitl-concurrent-2.log
 exit 1
fi
echo "PASS exactly one of two concurrent H5 commands accepted"
execsql "SELECT status, (SELECT COUNT(*) FROM hitl_events WHERE case_id=hitl_cases.id AND gate='H5') AS h5_count FROM hitl_cases WHERE source_type='service' AND source_id=$ID;" > /tmp/hitl-concurrent-final.log
python3 - <<'PY'
import json,re
s=open('/tmp/hitl-concurrent-final.log').read()
start=s.find('[\n  {')
if start<0: raise SystemExit('FAIL: no JSON results in Wrangler output')
data=json.loads(s[start:])
rows=data[0]['results']
assert len(rows)==1 and rows[0]['status']=='PASS' and rows[0]['h5_count']==1, rows
print('PASS final case status PASS and exactly one H5 event')
PY
