#!/usr/bin/env bash
# Author: Claude Code for Ken Granderson
# Owner: Black Facts Educational Foundation
# Last Updated: 2026-10-26
# Purpose: Refresh .wakanda/shared-hosting-deploy from a local clone of blackfacts/tools.
#
# Usage: scripts/sync-deploy-action.sh <path to blackfacts/tools clone>
set -euo pipefail

[[ $# -eq 1 ]] || { sed -n '/^# Usage:/p' "$0" | sed 's/^# //'; exit 2; }
SRC="$1/devops/shared-hosting-deploy"
DEST="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/.wakanda/shared-hosting-deploy"
[[ -f "$SRC/action.yml" ]] || { echo "FAIL $SRC/action.yml not found"; exit 1; }

commit="$(git -C "$1" log -1 --format=%H -- devops/shared-hosting-deploy)"
mkdir -p "$DEST"
for f in action.yml deploy-static.sh verify-site.sh; do cp "$SRC/$f" "$DEST/$f"; done
chmod +x "$DEST"/*.sh
sed -i "s/^- Source commit: .*/- Source commit: $commit/" "$DEST/SOURCE.md"
echo "OK  synced from blackfacts/tools $commit"
