#!/usr/bin/env bash
# Author: Claude Code for Ken Granderson
# Owner: Black Facts Educational Foundation
# Last Updated: 2026-10-26
# Purpose: Prove over HTTP that a deploy reached the live folder: the site's
#          wakanda-deploy.json must name the expected commit, and the home page
#          and any extra paths must answer 200.
#
# Usage: verify-site.sh <base-url> [expected-commit] [extra-path ...]
#   VERIFY_TRIES (default 10) and VERIFY_WAIT seconds (default 6) control retries.
#   VERIFY_INSECURE=1 skips TLS checks (only for a temporary URL without a certificate).
set -euo pipefail

ok()   { printf 'OK  %s\n' "$*"; }
die()  { printf 'FAIL %s\n' "$*" >&2; exit 1; }

[[ $# -ge 1 ]] || { sed -n '/^# Usage:/,/^set -/p' "$0" | sed '$d' | sed 's/^# \{0,1\}//'; exit 2; }
BASE="${1%/}"; EXPECT="${2:-}"; shift; [[ $# -gt 0 ]] && shift
[[ "$BASE" =~ ^https?://[^/]+ ]] || die "Base URL must start with http:// or https://: $BASE"
TRIES="${VERIFY_TRIES:-10}"; WAIT="${VERIFY_WAIT:-6}"
CURL=(curl -sS -L --max-time 30 -A "wakanda-deploy-verify/1.0")
[[ "${VERIFY_INSECURE:-0}" == 1 ]] && CURL+=(-k)

stamp=""
for ((i = 1; i <= TRIES; i++)); do
  # A unique query string gets past any page cache in front of the site.
  if stamp="$("${CURL[@]}" -f -H 'Cache-Control: no-cache' "$BASE/wakanda-deploy.json?t=$(date +%s)$i" 2>/dev/null)" \
     && { [[ -z "$EXPECT" ]] || grep -q "\"commit\":\"$EXPECT\"" <<<"$stamp"; }; then
    break
  fi
  stamp=""
  [[ $i -lt $TRIES ]] && sleep "$WAIT"
done
[[ -n "$stamp" ]] || die "$BASE/wakanda-deploy.json did not show commit ${EXPECT:-<any>} after $TRIES tries"
ok "Stamp: $stamp"

for path in "" "$@"; do
  code="$("${CURL[@]}" -o /dev/null -w '%{http_code}' "$BASE/${path#/}" || true)"
  [[ "$code" == 200 ]] || die "$BASE/${path#/} answered HTTP $code"
  ok "$BASE/${path#/} answered 200"
done
