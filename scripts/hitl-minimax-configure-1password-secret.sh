#!/usr/bin/env bash
# Local operator-only bridge from an external secret manager to GitHub Actions.
# This script never receives or prints key material in ChatGPT or CI.
# Requires 1Password CLI (op), GitHub CLI (gh), and an existing vault item.
set -euo pipefail
repo="AndekOY/boxvia-portal"
secret="HITL_ARCHIVE_AES256_KEY_B64URL"
if [[ -z "${HITL_1PASSWORD_SECRET_REFERENCE:-}" ]]; then
  echo "HOLD: set HITL_1PASSWORD_SECRET_REFERENCE to an existing op:// vault field reference" >&2
  exit 2
fi
command -v op >/dev/null || { echo "HOLD: 1Password CLI not installed" >&2; exit 2; }
command -v gh >/dev/null || { echo "HOLD: GitHub CLI not installed" >&2; exit 2; }
gh auth status >/dev/null 2>&1 || { echo "HOLD: GitHub CLI authentication required" >&2; exit 2; }
# No shell trace, command substitution, command-line secret, plaintext file, or stdout secret.
# Validate exact base64url shape without disclosing it; stream the same bytes into gh.
op read "$HITL_1PASSWORD_SECRET_REFERENCE" | node --input-type=module -e '
  import {stdin,stdout,stderr} from "node:process";
  let value="";
  for await (const chunk of stdin) value+=chunk;
  value=value.trim();
  if(!/^[A-Za-z0-9_-]{43}$/.test(value)||Buffer.from(value,"base64url").length!==32){
    stderr.write("HOLD: secret is not a 32-byte unpadded base64url key\n");
    process.exit(2);
  }
  stdout.write(value);
' | gh secret set "$secret" --repo "$repo"
echo "Configured GitHub Actions secret name; key withheld. External custody and restore remain UNESTABLISHED until verified."
