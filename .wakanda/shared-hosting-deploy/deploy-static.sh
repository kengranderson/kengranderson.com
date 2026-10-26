#!/usr/bin/env bash
# Author: Claude Code for Ken Granderson
# Owner: Black Facts Educational Foundation
# Last Updated: 2026-10-26
# Purpose: Publish a built static website into a folder on Linux shared hosting
#          (Bluehost and similar) over SSH. No sudo, systemd or nginx needed.
#
# Usage: deploy-static.sh [--profile FILE] [--dry-run] [--adopt] [--probe-only]
#
# Settings come from environment variables (GitHub Actions) or a profile file
# (local use, see deploy.profile.env.example). Required:
#   DEPLOY_SOURCE     local folder holding the built site (e.g. _site)
#   DEPLOY_HOST       ssh host name, IP or ~/.ssh/config alias
#   DEPLOY_PATH       site folder on the server, relative to the SSH user's home
#                     (e.g. public_html or public_html/kengranderson)
#   DEPLOY_SITE       short site name recorded in the folder (e.g. kengranderson)
# Optional:
#   DEPLOY_USER       ssh user (default: from ssh config)
#   DEPLOY_PORT       ssh port (default 22)
#   DEPLOY_SSH_KEY_FILE      private key file to use, and only that key
#   DEPLOY_KNOWN_HOSTS_FILE  pinned host keys; host keys are never accepted blindly
#   DEPLOY_PROTECT    extra space-separated top-level names never deleted or replaced
#   DEPLOY_DELETE     1 (default) removes files the build no longer has; 0 keeps them
#   DEPLOY_COMMIT, DEPLOY_REF, DEPLOY_RUN_URL, DEPLOY_ACTOR  recorded in wakanda-deploy.json
#
# Folder states:
#   missing/empty  created and filled.
#   managed        holds .wakanda-deploy for the same DEPLOY_SITE: synced.
#   other site     holds .wakanda-deploy for a different site: refused.
#   unmanaged      has files but no marker: refused unless --adopt. Adopting backs the
#                  folder up to ~/.wakanda/deploy-backups/ and keeps every existing
#                  top-level entry the build does not replace (listed in
#                  .wakanda-deploy-preserve, which you can edit later).
# Nested folders that hold their own .wakanda-deploy (another site) are always kept.
# Remote snippets below are single-quoted on purpose: they expand on the server.
# shellcheck disable=SC2016,SC2088,SC2029
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

say()  { printf '==> %s\n' "$*"; }
ok()   { printf 'OK  %s\n' "$*"; }
warn() { printf 'WARN %s\n' "$*" >&2; }
die()  { printf 'FAIL %s\n' "$*" >&2; exit 1; }
usage() { sed -n '/^# Usage:/,/^set -/p' "${BASH_SOURCE[0]}" | sed '$d' | sed 's/^# \{0,1\}//'; }

DRY_RUN=0; ADOPT=0; PROBE_ONLY=0; PROFILE=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --profile) PROFILE="${2:?--profile needs a file}"; shift 2 ;;
    --dry-run) DRY_RUN=1; shift ;;
    --adopt) ADOPT=1; shift ;;
    --probe-only) PROBE_ONLY=1; shift ;;
    -h|--help) usage; exit 0 ;;
    *) usage; die "Unknown argument: $1" ;;
  esac
done

if [[ -n "$PROFILE" ]]; then
  # shellcheck disable=SC1091
  source "${SCRIPT_DIR}/../linux-app-host/load-dotenv.sh"
  load_dotenv "$PROFILE"
fi
[[ "${DEPLOY_DRY_RUN:-0}" == 1 ]] && DRY_RUN=1
[[ "${DEPLOY_ADOPT:-0}" == 1 ]] && ADOPT=1

# Windows Git Bash: use the Windows OpenSSH so the Windows ssh-agent is used.
if [[ -d /c/Windows/System32/OpenSSH ]]; then export PATH="/c/Windows/System32/OpenSSH:$PATH"; fi

: "${DEPLOY_HOST:?DEPLOY_HOST is required}"
: "${DEPLOY_PATH:?DEPLOY_PATH is required}"
: "${DEPLOY_SITE:?DEPLOY_SITE is required}"
[[ "$PROBE_ONLY" == 1 ]] || : "${DEPLOY_SOURCE:?DEPLOY_SOURCE is required}"
DEPLOY_PORT="${DEPLOY_PORT:-22}"
DEPLOY_DELETE="${DEPLOY_DELETE:-1}"

# --- Validate inputs locally (the server checks the resolved path again) ---
[[ "$DEPLOY_SITE" =~ ^[A-Za-z0-9._-]+$ ]] || die "DEPLOY_SITE may only hold letters, digits, . _ -"
[[ "$DEPLOY_PORT" =~ ^[0-9]+$ ]] || die "DEPLOY_PORT must be a number"
DEPLOY_PATH="${DEPLOY_PATH%/}"
DEPLOY_PATH="${DEPLOY_PATH#./}"
case "$DEPLOY_PATH" in
  ""|"."|"~"|"/"|"~/") die "DEPLOY_PATH must name a folder inside the home folder, not the home folder itself" ;;
esac
[[ "$DEPLOY_PATH" =~ ^[A-Za-z0-9._/~-]+$ ]] || die "DEPLOY_PATH has characters that are not allowed: $DEPLOY_PATH"
[[ "/$DEPLOY_PATH/" != */../* && "/$DEPLOY_PATH/" != */./* ]] || die "DEPLOY_PATH may not contain . or .. segments"
DEPLOY_PATH="${DEPLOY_PATH#\~/}"
for name in ${DEPLOY_PROTECT:-}; do
  [[ "$name" =~ ^[A-Za-z0-9._-]+/?$ && "$name" != "." && "$name" != ".." ]] || die "DEPLOY_PROTECT entries must be top-level names: $name"
done

if [[ "$PROBE_ONLY" != 1 ]]; then
  [[ -d "$DEPLOY_SOURCE" ]] || die "DEPLOY_SOURCE is not a folder: $DEPLOY_SOURCE"
  [[ -n "$(ls -A "$DEPLOY_SOURCE")" ]] || die "DEPLOY_SOURCE is empty: $DEPLOY_SOURCE"
  [[ -f "$DEPLOY_SOURCE/index.html" || -f "$DEPLOY_SOURCE/index.php" ]] || die "DEPLOY_SOURCE has no index.html or index.php; is it the built site?"
  DEPLOY_SOURCE="$(cd "$DEPLOY_SOURCE" && pwd)"
fi

# --- SSH -------------------------------------------------------------------
SSH_OPTS=(-p "$DEPLOY_PORT" -o BatchMode=yes -o ConnectTimeout=20 -o ServerAliveInterval=15)
if [[ -n "${DEPLOY_SSH_KEY_FILE:-}" ]]; then
  [[ -f "$DEPLOY_SSH_KEY_FILE" ]] || die "DEPLOY_SSH_KEY_FILE not found"
  SSH_OPTS+=(-i "$DEPLOY_SSH_KEY_FILE" -o IdentitiesOnly=yes)
fi
if [[ -n "${DEPLOY_KNOWN_HOSTS_FILE:-}" ]]; then
  [[ -s "$DEPLOY_KNOWN_HOSTS_FILE" ]] || die "DEPLOY_KNOWN_HOSTS_FILE is missing or empty"
  SSH_OPTS+=(-o StrictHostKeyChecking=yes -o "UserKnownHostsFile=$DEPLOY_KNOWN_HOSTS_FILE")
fi
TARGET="$DEPLOY_HOST"
[[ -n "${DEPLOY_USER:-}" ]] && TARGET="${DEPLOY_USER}@${DEPLOY_HOST}"
remote() { ssh "${SSH_OPTS[@]}" "$TARGET" "$@"; }
# Remote snippets travel base64-encoded and get values as positional arguments, so
# nothing is spliced into code and stdin stays free for data.
remote_script() {
  local script="$1"; shift
  local b64; b64="$(printf '%s' "$script" | base64 | tr -d '\n')"
  remote "bash -c \"\$(echo $b64 | base64 -d)\" wakanda $(printf '%q ' "$@")"
}

# --- Probe the server --------------------------------------------------------
PROBE_SCRIPT='
set -u
rel="$1"; site="$2"
home="$(cd ~ && pwd -P)"
case "$rel" in /*) abs="$rel" ;; *) abs="$home/$rel" ;; esac
parent="$(dirname "$abs")"
# Resolve symlinks in the existing part of the path.
while [ ! -d "$parent" ]; do parent="$(dirname "$parent")"; done
resolved="$(cd "$parent" && pwd -P)/${abs#"$parent"/}"
[ "$parent" = "$abs" ] && resolved="$(cd "$abs" && pwd -P)"
case "$resolved/" in
  "$home/"?*/) ;;
  *) echo "error=path_outside_home"; exit 0 ;;
esac
[ "$resolved" = "$home" ] && { echo "error=path_is_home"; exit 0; }
echo "home=$home"
echo "abs=$resolved"
echo "os=$(uname -s) $(uname -r)"
command -v rsync >/dev/null 2>&1 && echo "rsync=$(rsync --version | head -1 | awk "{print \$3}")" || echo "rsync="
sudo -n true >/dev/null 2>&1 && echo "sudo=yes" || echo "sudo=no"
command -v systemctl >/dev/null 2>&1 && echo "systemctl=yes" || echo "systemctl=no"
if [ ! -e "$resolved" ]; then echo "state=missing"
elif [ ! -d "$resolved" ]; then echo "state=not_a_folder"
elif [ -z "$(ls -A "$resolved")" ]; then echo "state=empty"
elif [ -f "$resolved/.wakanda-deploy" ]; then
  owner="$(sed -n "s/^site=//p" "$resolved/.wakanda-deploy" | head -1)"
  if [ "$owner" = "$site" ]; then echo "state=managed"; else echo "state=other_site"; echo "owner=$owner"; fi
else echo "state=unmanaged"
fi
if [ -d "$resolved" ]; then
  echo "free_kb=$(df -Pk "$resolved" | awk "NR==2{print \$4}")"
  echo "entries=$(ls -A "$resolved" | wc -l | tr -d " ")"
  find "$resolved" -mindepth 2 -maxdepth 4 -name .wakanda-deploy 2>/dev/null | while read -r m; do
    d="${m%/.wakanda-deploy}"; d="${d#"$resolved"/}"; echo "nested_site=${d%%/*}"
  done
  [ -f "$resolved/.wakanda-deploy-preserve" ] && sed "s/^/preserve=/" "$resolved/.wakanda-deploy-preserve"
fi
exit 0
'

say "Checking ${TARGET}:${DEPLOY_PATH} (port ${DEPLOY_PORT})"
PROBE="$(remote_script "$PROBE_SCRIPT" "$DEPLOY_PATH" "$DEPLOY_SITE")" || die "SSH login failed. Check host, user, port, key and known_hosts."
pget() { sed -n "s/^$1=//p" <<<"$PROBE" | head -1; }
ERR="$(pget error)"
[[ -z "$ERR" ]] || die "Server refused the path ($ERR): DEPLOY_PATH must resolve to a folder inside the SSH user's home"
ABS="$(pget abs)"; STATE="$(pget state)"; RSYNC_REMOTE="$(pget rsync)"
ok "Logged in. Folder: $ABS"
printf '    server: %s | rsync: %s | sudo: %s | systemctl: %s | free: %s KB | state: %s\n' \
  "$(pget os)" "${RSYNC_REMOTE:-none}" "$(pget sudo)" "$(pget systemctl)" "$(pget free_kb)" "$STATE"

[[ "$STATE" != not_a_folder ]] || die "$ABS exists and is not a folder"
[[ "$STATE" != other_site ]] || die "$ABS belongs to site '$(pget owner)', not '$DEPLOY_SITE'. Refusing."
if [[ "$STATE" == unmanaged && "$ADOPT" != 1 ]]; then
  die "$ABS already holds $(pget entries) item(s) not placed by this tool. Re-run with --adopt (Actions input adopt: true) to back them up and keep them."
fi
[[ "$PROBE_ONLY" == 1 ]] && { ok "Probe only; nothing changed."; exit 0; }

# --- Build the keep list ---------------------------------------------------
PROTECT=(.wakanda-deploy .wakanda-deploy-preserve wakanda-deploy.json .well-known cgi-bin .user.ini php.ini error_log)
[[ -f "$DEPLOY_SOURCE/.htaccess" ]] || PROTECT+=(.htaccess)
for name in ${DEPLOY_PROTECT:-}; do PROTECT+=("${name%/}"); done
while IFS= read -r name; do [[ -n "$name" ]] && PROTECT+=("$name"); done < <(sed -n 's/^nested_site=//p; s/^preserve=//p' <<<"$PROBE")

NEW_PRESERVE=()
if [[ "$STATE" == unmanaged ]]; then
  while IFS= read -r name; do
    [[ -z "$name" || -e "$DEPLOY_SOURCE/$name" ]] && continue
    NEW_PRESERVE+=("$name"); PROTECT+=("$name")
  done < <(remote_script 'cd "$1" && ls -A' "$ABS")
fi

FILTERS=(--exclude=.git/ --exclude=.github/)
for name in "${PROTECT[@]}"; do FILTERS+=("--filter=P /$name" "--exclude=/$name"); done
# Files the build ships at a protected name (e.g. its own .well-known) still go up.
for name in "${PROTECT[@]}"; do
  [[ -e "$DEPLOY_SOURCE/$name" && "$name" != .wakanda-deploy* && "$name" != wakanda-deploy.json ]] || continue
  for i in "${!FILTERS[@]}"; do [[ "${FILTERS[$i]}" == "--exclude=/$name" ]] && unset 'FILTERS[i]'; done
done
FILTERS=("${FILTERS[@]}")

# --- Dry run -----------------------------------------------------------------
if [[ "$DRY_RUN" == 1 ]]; then
  say "Dry run: nothing on the server changes"
  printf '    kept (never deleted): %s\n' "${PROTECT[*]}"
  [[ ${#NEW_PRESERVE[@]} -gt 0 ]] && printf '    would preserve existing: %s\n' "${NEW_PRESERVE[*]}"
  if [[ -n "$RSYNC_REMOTE" && "$STATE" != missing ]] && command -v rsync >/dev/null 2>&1; then
    DEL=(); [[ "$DEPLOY_DELETE" == 1 ]] && DEL=(--delete)
    CHANGES="$(rsync -rlt --checksum -n -i "${DEL[@]}" "${FILTERS[@]}" -e "ssh $(printf '%q ' "${SSH_OPTS[@]}")" \
      "$DEPLOY_SOURCE/" "$TARGET:$ABS/")"
    printf '    would upload: %s, would delete: %s\n' "$(grep -c '^<f' <<<"$CHANGES" || true)" "$(grep -c '^\*deleting' <<<"$CHANGES" || true)"
    grep '^\*deleting' <<<"$CHANGES" | head -20 | sed 's/^/    /' || true
  else
    printf '    would upload: %s files\n' "$(find "$DEPLOY_SOURCE" -type f | wc -l | tr -d ' ')"
  fi
  ok "Dry run finished"
  exit 0
fi

# --- Adopt: back up first --------------------------------------------------
NOW="$(date -u +%Y%m%dT%H%M%SZ)"
if [[ "$STATE" == unmanaged ]]; then
  say "Adopting $ABS: backing it up first"
  BACKUP="$(remote_script 'set -e; mkdir -p ~/.wakanda/deploy-backups; chmod 700 ~/.wakanda ~/.wakanda/deploy-backups
f=~/.wakanda/deploy-backups/"$2"-"$3".tar.gz; tar -czf "$f" -C "$1" .; echo "$f"' "$ABS" "$DEPLOY_SITE" "$NOW")" || die "Backup failed; nothing was changed"
  ok "Backup: $BACKUP"
  printf '%s\n' "${NEW_PRESERVE[@]}" | remote_script 'cat > "$1/.wakanda-deploy-preserve"' "$ABS"
  [[ ${#NEW_PRESERVE[@]} -gt 0 ]] && ok "Kept existing: ${NEW_PRESERVE[*]}"
fi
remote_script 'set -e; mkdir -p "$1"; [ -f "$1/.wakanda-deploy" ] || printf "site=%s\nfirst_deploy=%s\n" "$2" "$3" > "$1/.wakanda-deploy"' \
  "$ABS" "$DEPLOY_SITE" "$NOW"

# --- Upload ----------------------------------------------------------------
FILES="$(find "$DEPLOY_SOURCE" -type f | wc -l | tr -d ' ')"
if [[ -n "$RSYNC_REMOTE" ]] && command -v rsync >/dev/null 2>&1; then
  DEL=(); [[ "$DEPLOY_DELETE" == 1 ]] && DEL=(--delete-delay)
  say "Syncing $FILES files with rsync (checksums; only changed files move)"
  rsync -rlt --checksum --compress --delay-updates "${DEL[@]}" --chmod=D755,F644 \
    --stats "${FILTERS[@]}" -e "ssh $(printf '%q ' "${SSH_OPTS[@]}")" \
    "$DEPLOY_SOURCE/" "$TARGET:$ABS/" | grep -E '^(Number of (regular )?files transferred|Number of deleted files|Total transferred file size)' | sed 's/^/    /' || true
  [[ "${PIPESTATUS[0]}" == 0 ]] || die "rsync failed"
else
  warn "rsync is not available on both ends; uploading with tar (files are added and replaced, never deleted)"
  tar -C "$DEPLOY_SOURCE" --exclude=.git --exclude=.github -czf - . | remote_script 'set -e; cd "$1"; tar -xzf - --no-same-owner; find . -type d -exec chmod 755 {} +' "$ABS" \
    || die "tar upload failed"
fi
ok "Files uploaded"

# --- Stamp -------------------------------------------------------------------
STAMP="$(printf '{"site":"%s","commit":"%s","ref":"%s","deployed_at":"%s","run_url":"%s","actor":"%s","files":%s}\n' \
  "$DEPLOY_SITE" "${DEPLOY_COMMIT:-$(git -C "$DEPLOY_SOURCE" rev-parse HEAD 2>/dev/null || echo unknown)}" \
  "${DEPLOY_REF:-}" "$NOW" "${DEPLOY_RUN_URL:-}" "${DEPLOY_ACTOR:-${USER:-unknown}}" "$FILES")"
printf '%s' "$STAMP" | remote_script 'set -e; cat > "$1/wakanda-deploy.json.tmp"; chmod 644 "$1/wakanda-deploy.json.tmp"; mv "$1/wakanda-deploy.json.tmp" "$1/wakanda-deploy.json"' "$ABS"
ok "Deployed: $STAMP"
