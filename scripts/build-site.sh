#!/usr/bin/env bash
# Author: Claude Code for Ken Granderson
# Owner: Black Facts Educational Foundation
# Last Updated: 2026-10-26
# Purpose: Assemble the publishable site into _site: the legacy folders build.cmd copies,
#          then the new React site from web/ (pre-built to static HTML) on top.
#          The old one-page site stays reachable as classic.html.
#          Broken JSON, a failed web build or a missing linked file fails the build;
#          a missing highlight image is only a warning.
#          SITE_MODE=production hides drafts and editorial flags (default: preview).
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

# New site: web/ renders every page to HTML at build time (see web/README.md).
mv "$OUT/index.html" "$OUT/classic.html"
if [[ -f "$ROOT/web/package-lock.json" ]]; then npm ci --prefix "$ROOT/web" --no-audit --no-fund; else npm install --prefix "$ROOT/web" --no-audit --no-fund; fi
npm run build --prefix "$ROOT/web"
cp -a "$ROOT/web/dist/site/." "$OUT/"

fail=0
python3 -m json.tool "$OUT/highlights.json" >/dev/null || { echo "FAIL highlights.json is not valid JSON"; fail=1; }
# Every local src/href in every page must exist (paths are relative to the page's own folder).
while IFS= read -r page; do
  dir="$(dirname "$page")"
  while IFS= read -r ref; do
    [[ -e "$dir/$ref" ]] || { echo "FAIL ${page#$OUT/} links to missing $ref"; fail=1; }
  done < <(grep -o '\(src\|href\)="[^"#:?]*"' "$page" | sed 's/^[a-z]*="//; s/"$//' | grep -v "^/\|[' +]" | grep . | sort -u)
done < <(find "$OUT" -maxdepth 4 -name '*.html' -not -path '*/capri-service-manual/*' -not -path '*/kendudeism/*' -not -path '*/lib/*' -not -path '*/share/*' -not -path '*/media/*' -not -path '*/photos/*' -not -path '*/images/*')
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
