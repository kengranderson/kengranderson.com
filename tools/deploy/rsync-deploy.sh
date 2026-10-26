#!/usr/bin/env bash
# Author: Claude Code for Ken Granderson
# Owner: Black Facts Educational Foundation
# Canonical source: blackfacts/tools devops/static-site-publish (copy updates from there)
# Last Updated: 2026-10-26
# Purpose: Publish a built static site folder to a server over SSH with rsync, then confirm
#          the live site serves the expected commit. Works on shared hosting (no sudo, no services).
#          Application-neutral: everything comes from environment variables.
#
# Required: DEPLOY_HOST, DEPLOY_USER, DEPLOY_PATH (absolute folder on the server, e.g. /home/<user>/public_html)
# Optional: DEPLOY_PORT (22), DEPLOY_SOURCE (dist), DEPLOY_DRY_RUN (true), DEPLOY_DELETE (false),
#           DEPLOY_SSH_KEY_FILE (ssh default), DEPLOY_KNOWN_HOSTS_FILE (ssh default),
#           VERIFY_URL (a published file that contains the commit id, e.g. https://example.org/build-manifest.json),
#           EXPECTED_COMMIT (the commit VERIFY_URL must contain; required when VERIFY_URL is set)
# If DEPLOY_SOURCE/build-manifest.json exists and says "includesDrafts": true, the publish is refused.
#
# Dry run is the default. Set DEPLOY_DRY_RUN=false to change anything on the server.
set -euo pipefail

fail() { echo "deploy: $*" >&2; exit 1; }

: "${DEPLOY_HOST:?DEPLOY_HOST is required}"
: "${DEPLOY_USER:?DEPLOY_USER is required}"
: "${DEPLOY_PATH:?DEPLOY_PATH is required}"
DEPLOY_PORT="${DEPLOY_PORT:-22}"
DEPLOY_SOURCE="${DEPLOY_SOURCE:-dist}"
DEPLOY_DRY_RUN="${DEPLOY_DRY_RUN:-true}"
DEPLOY_DELETE="${DEPLOY_DELETE:-false}"

case "$DEPLOY_PATH" in
  /*) ;;
  *) fail "DEPLOY_PATH must be an absolute path, got '$DEPLOY_PATH'" ;;
esac
case "$DEPLOY_PATH" in
  / | /home | /home/ | /home[0-9] | /home[0-9]/ | /home/*/ | /home[0-9]/*/ | */"$DEPLOY_USER" | */"$DEPLOY_USER"/) fail "DEPLOY_PATH '$DEPLOY_PATH' is too broad; point it at the site's web folder" ;;
esac
[[ "$DEPLOY_PORT" =~ ^[0-9]+$ ]] || fail "DEPLOY_PORT must be a number"

[[ -d "$DEPLOY_SOURCE" ]] || fail "$DEPLOY_SOURCE not found; run the build first"
manifest="$DEPLOY_SOURCE/build-manifest.json"
if [[ -f "$manifest" ]] && grep -q '"includesDrafts": true' "$manifest"; then
  fail "refusing to publish a preview build that includes draft content"
fi
if [[ -n "${VERIFY_URL:-}" && -z "${EXPECTED_COMMIT:-}" ]]; then
  fail "VERIFY_URL is set, so EXPECTED_COMMIT is required"
fi

ssh_opts=(-p "$DEPLOY_PORT" -o BatchMode=yes -o StrictHostKeyChecking=yes)
[[ -n "${DEPLOY_SSH_KEY_FILE:-}" ]] && ssh_opts+=(-i "$DEPLOY_SSH_KEY_FILE" -o IdentitiesOnly=yes)
[[ -n "${DEPLOY_KNOWN_HOSTS_FILE:-}" ]] && ssh_opts+=(-o "UserKnownHostsFile=$DEPLOY_KNOWN_HOSTS_FILE")
ssh_cmd="ssh ${ssh_opts[*]}"
target="$DEPLOY_USER@$DEPLOY_HOST"

echo "deploy: checking SSH access to $target:$DEPLOY_PORT"
# shellcheck disable=SC2029 # DEPLOY_PATH is meant to expand locally.
ssh "${ssh_opts[@]}" "$target" "command -v rsync >/dev/null || { echo 'rsync is not installed on the server' >&2; exit 3; }; test -d '$DEPLOY_PATH' || { echo 'folder $DEPLOY_PATH does not exist on the server' >&2; exit 4; }"

# --checksum: a fresh CI checkout has new timestamps, so compare content to send only changed files.
# shellcheck disable=SC2054 # --chmod takes a comma-separated value.
rsync_opts=(--recursive --links --compress --checksum --human-readable --itemize-changes --stats --chmod=D755,F644)
if [[ "$DEPLOY_DELETE" == "true" ]]; then
  # Remove files that are no longer in the build, but never server-managed ones.
  rsync_opts+=(--delete-after --filter='P .well-known/' --filter='P cgi-bin/' --filter='P .htaccess' --filter='P .user.ini' --filter='P error_log')
fi
if [[ "$DEPLOY_DRY_RUN" != "false" ]]; then
  rsync_opts+=(--dry-run)
  echo "deploy: DRY RUN, nothing on the server will change"
fi

rsync "${rsync_opts[@]}" -e "$ssh_cmd" "$DEPLOY_SOURCE/" "$target:$DEPLOY_PATH/"

if [[ "$DEPLOY_DRY_RUN" != "false" ]]; then
  echo "deploy: dry run finished"
  exit 0
fi

if [[ -n "${VERIFY_URL:-}" ]]; then
  echo "deploy: confirming $VERIFY_URL"
  published=$(curl --fail --silent --show-error --location --retry 3 --retry-delay 5 "$VERIFY_URL")
  if ! grep -qF "$EXPECTED_COMMIT" <<<"$published"; then
    fail "$VERIFY_URL does not contain commit $EXPECTED_COMMIT; check which folder the domain serves"
  fi
  echo "deploy: $VERIFY_URL reports commit $EXPECTED_COMMIT"
fi
echo "deploy: done"
