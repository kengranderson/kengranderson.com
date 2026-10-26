# Decisions

> **Author:** Claude Code for Ken Granderson  
> **Owner:** Ken Granderson  
> **Last Updated:** 2026-10-26  
> **Status:** Active

Newest last. "Proposed" means an agent chose it to keep work moving and Ken can reverse it.

## Made

**D-01 Keep the site as plain HTML and jQuery.** No framework migration. The build copies the site as it is and adds generated data beside it. (Kickoff handoff.)

**D-02 Content as one JSON file per record, validated by JSON Schema.** Collections `work`, `philosophy`, `events`; stable ids equal to file names; `draft`/`review`/`published` status; provenance in `sources`; publishing requires an `approval` block. Details in `content/README.md`. *Proposed.*

**D-03 Node 22 for tooling, with one dependency (ajv).** Node because the site is JavaScript and the shared launcher already uses Node; ajv because writing a schema validator by hand is the "custom implementation of commodity functionality" the shared standards discourage. *Proposed.*

**D-04 `highlights.json` stays the timeline's source of truth.** It is validated (structure errors fail; missing files and duplicate anchors warn) but not converted. Converting it is editorial work for later.

**D-05 Remove `build.cmd`, `generatejson/`, and `CLAUDE-PROJECT-GOAL.txt`.** Ken asked for a clean repository root (2026-10-26). See `docs/repository-audit.md`.

**D-06 Publish with rsync over SSH from GitHub Actions.** Ken plans Bluehost shared hosting with SSH (2026-10-26). rsync sends only changed files, needs nothing installed on the server beyond rsync, and works without sudo. Merging to `master` publishes. The build writes `build-manifest.json` (commit plus a hash of every file) and the deploy confirms the live site serves the expected commit.

**D-07 File headers name Owner: Ken Granderson.** The shared standard says Black Facts Educational Foundation; this is a personal site. *Proposed; Ken to confirm.*

**D-08 Deploy is off by default and dry-run until told otherwise.** Two repository variables: `DEPLOY_ENABLED=true` turns on the deploy job (dry runs only), and `DEPLOY_DRY_RUN=false` makes it change the server. Deleting files on the server is a third, separate switch (`DEPLOY_DELETE=true`) and protects `.well-known/`, `cgi-bin/`, `.htaccess`, `.user.ini`, and `error_log`.

## Waiting on Ken

0. **Install the workflow file**: move `tools/ci/site.yml` to `.github/workflows/site.yml` (one commit with Ken's credentials; see `tools/ci/README.md`).
1. **Server details** for the Bluehost account: host or IP, SSH username, and the folder kengranderson.com is served from.
2. **Activation**: approve turning on dry runs, then live publishing.
3. **Cutover**: whether kengranderson.com's DNS moves to Bluehost, and when. Nothing here touches DNS.
4. **Review gate**: whether merges to `master` need Ken's approval in GitHub (branch protection, or required reviewers on the `production` environment), or whether an agent may merge when Ken says "publish".
5. **Directory listings**: `/media/` and `/photos/` had IIS directory listings. Keep them on Apache (an `.htaccess` with `Options +Indexes`) or drop them.
6. **Known timeline issues**: fix the three missing images and the duplicate `350years` anchor, or leave them.
7. **D-07** owner line.
