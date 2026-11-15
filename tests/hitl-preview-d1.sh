#!/usr/bin/env bash
# Destructive only to dedicated synthetic HITL cases in preview D1. Never production.
set -euo pipefail
: "${PREVIEW_DB_ID:?missing preview id}"
: "${PROD_DB_ID:?missing production id}"
[[ "$PREVIEW_DB_ID" != "$PROD_DB_ID" ]] || { echo "Refusing production database"; exit 1; }
[[ "$PREVIEW_DB_ID" == "baf79e93-cbea-4786-8779-974f3b3afbcc" ]] || { echo "Unexpected preview database"; exit 1; }
run() { npx wrangler d1 execute "$PREVIEW_DB_ID" --remote --command "$1"; }
pass=0
expect_success() {
  local label="$1" sql="$2"
  if run "$sql" > /tmp/hitl-step.log 2>&1 && grep -q '"success": true' /tmp/hitl-step.log; then
    echo "PASS $label"; pass=$((pass+1))
  else
    echo "FAIL $label"; cat /tmp/hitl-step.log; exit 1
  fi
}
expect_reject() {
  local label="$1" sql="$2"
  if run "$sql" > /tmp/hitl-step.log 2>&1; then
    echo "FAIL $label: unexpected acceptance"; cat /tmp/hitl-step.log; exit 1
  else
    echo "PASS $label: rejected"; pass=$((pass+1))
  fi
}
# Distinct synthetic IDs, with no customer content. Keep immutable test events for audit.
ID="$(( 800000000 + GITHUB_RUN_ID % 100000000 ))"
echo "Synthetic source id: $ID"
expect_success "create synthetic case" "INSERT INTO hitl_cases(source_type,source_id,assessor) VALUES('claim',$ID,'Andrey Ekhmenin');"
expect_reject "duplicate case" "INSERT INTO hitl_cases(source_type,source_id) VALUES('claim',$ID);"
expect_reject "H5 without H1-H4" "INSERT INTO hitl_events(case_id,gate,decision,evidence_ref,actor) VALUES((SELECT id FROM hitl_cases WHERE source_type='claim' AND source_id=$ID),'H5','PASS','synthetic/test','Andrey Ekhmenin');"
expect_reject "actor mismatch" "INSERT INTO hitl_events(case_id,gate,decision,evidence_ref,actor) VALUES((SELECT id FROM hitl_cases WHERE source_type='claim' AND source_id=$ID),'H1','PASS','synthetic/test','Other Person');"
for gate in H1 H2 H3; do
  expect_success "$gate PASS" "INSERT INTO hitl_events(case_id,gate,decision,evidence_ref,actor) VALUES((SELECT id FROM hitl_cases WHERE source_type='claim' AND source_id=$ID),'$gate','PASS','synthetic/test','Andrey Ekhmenin');"
done
expect_success "H3 HOLD" "INSERT INTO hitl_events(case_id,gate,decision,evidence_ref,actor) VALUES((SELECT id FROM hitl_cases WHERE source_type='claim' AND source_id=$ID),'H3','HOLD','synthetic/test','Andrey Ekhmenin');"
expect_reject "H4 after H3 HOLD" "INSERT INTO hitl_events(case_id,gate,decision,evidence_ref,actor) VALUES((SELECT id FROM hitl_cases WHERE source_type='claim' AND source_id=$ID),'H4','PASS','synthetic/test','Andrey Ekhmenin');"
for gate in H3 H4 H5; do
  expect_success "$gate PASS" "INSERT INTO hitl_events(case_id,gate,decision,evidence_ref,actor) VALUES((SELECT id FROM hitl_cases WHERE source_type='claim' AND source_id=$ID),'$gate','PASS','synthetic/test','Andrey Ekhmenin');"
done
expect_reject "event after H5 PASS" "INSERT INTO hitl_events(case_id,gate,decision,evidence_ref,actor) VALUES((SELECT id FROM hitl_cases WHERE source_type='claim' AND source_id=$ID),'H1','PASS','synthetic/test','Andrey Ekhmenin');"
expect_reject "immutable update" "UPDATE hitl_events SET decision='HOLD' WHERE case_id=(SELECT id FROM hitl_cases WHERE source_type='claim' AND source_id=$ID);"
expect_reject "immutable delete" "DELETE FROM hitl_events WHERE case_id=(SELECT id FROM hitl_cases WHERE source_type='claim' AND source_id=$ID);"
expect_success "verify final PASS" "SELECT status FROM hitl_cases WHERE source_type='claim' AND source_id=$ID AND status='PASS';"
echo "PASS: $pass preview D1 command-level checks"
echo "LIMITATION: HTTP owner API and parallel writes are not exercised here."
