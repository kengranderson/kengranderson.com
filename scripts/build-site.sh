#!/usr/bin/env bash
# Author: Claude Code for Ken Granderson
# Owner: Black Facts Educational Foundation
# Last Updated: 2026-10-26
# Purpose: Assemble the publishable site into _site (the same set build.cmd copies)
#          and check it before deploy. Broken JSON or a missing page fails the build;
#          a missing highlight image is only a warning.
#
# Usage: scripts/build-site.sh [output-folder]   (default: _site)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC="$ROOT/KenGranderson"
OUT="${1:-$ROOT/_site}"

# Keep this list in step with build.cmd.
DIRS=(capri-service-manual css fonts images js lib media share photos kendudeism)
FILES=(favicon.ico highlights.json index.html)

rm -rf "$OUT"; mkdir -p "$OUT"
for d in "${DIRS[@]}"; do cp -a "$SRC/$d" "$OUT/$d"; done
for f in "${FILES[@]}"; do cp -a "$SRC/$f" "$OUT/$f"; done
# IIS-only settings do nothing on Apache; their .htaccess twins ship instead.
find "$OUT" -iname web.config -delete

fail=0
python3 -m json.tool "$OUT/highlights.json" >/dev/null || { echo "FAIL highlights.json is not valid JSON"; fail=1; }
while IFS= read -r ref; do
  [[ -e "$OUT/$ref" ]] || { echo "FAIL index.html links to missing $ref"; fail=1; }
done < <(grep -o '\(src\|href\)="[^"#:?]*"' "$OUT/index.html" | sed 's/^[a-z]*="//; s/"$//; s#^/##' | grep -v "[' +]" | grep . | sort -u)
missing=0
while IFS= read -r ref; do
  [[ -e "$OUT/$ref" ]] || { echo "WARN highlights.json names missing image $ref"; missing=$((missing + 1)); }
done < <(python3 -c 'import json,sys
for year in json.load(open(sys.argv[1])).values():
    for item in year:
        for u in item.get("mediaUrls", []):
            if "/" in u and not u.startswith(("http:", "https:", "//")): print(u)' "$OUT/highlights.json")
[[ $fail -eq 0 ]] || exit 1

printf 'OK  built %s: %s files, %s (%s highlight image warnings)\n' "$OUT" \
  "$(find "$OUT" -type f | wc -l | tr -d ' ')" "$(du -sh "$OUT" | cut -f1)" "$missing"
