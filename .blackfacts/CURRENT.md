# Current Project State

> **Project-owned file.** Keep this concise and operational. Replace stale details rather than appending a permanent session log.

**Last Updated:** 2026-10-26  
**Status:** Workflow foundation in review; publishing not switched on

## Current Objective

Make the agent-driven publishing workflow operational: request -> agent -> PR -> merge to master -> GitHub Actions -> kengranderson.com. Editorial content and redesign are separate work.

## Current State

- Validation, deterministic build, local preview, and the gated SSH/rsync publish job exist (branch `claude/project-thread-rhxstz`, pending merge).
- Three example draft records exist (work, philosophy, event). Nothing is published from `content/` yet.
- The home page still reads `KenGranderson/highlights.json`, unchanged.
- The workflow file is parked at `tools/ci/site.yml` (the cloud agent's token cannot write `.github/workflows/`); it must be moved into `.github/workflows/` with Ken's credentials.
- No server is configured. Deploy variables and secrets are not set.

## Verification

- **Verified:** 13 tooling tests pass; content validates (0 errors, 4 pre-existing timeline warnings); two builds of the same commit are byte-identical; built home page renders 23 headings and 87 entries in Chromium with no new console errors; publish script tested against a local SSH server (dry run, live, incremental, delete with protected paths, wrong host key refused, post-publish commit check); key setup script tested in PowerShell 7 on Linux.
- **Not yet verified:** the GitHub Actions run itself on GitHub; Bluehost (SSH, rsync, paths); the key setup script on Windows PowerShell 5.1.

## Decisions and Constraints

- See `docs/decisions.md` (D-01 to D-08). Ken approves publication of any record, public deployment, DNS/hosting, and changes to historical material.

## Blockers / Open Questions

- Waiting on Ken: Bluehost host, user, and folder; approval to enable dry runs then live publishing; DNS cutover timing; merge approval policy. Full list in `docs/decisions.md`.

## Exact Next Action

Install the workflow file (`tools/ci/README.md`). After merge: Ken sets up Bluehost SSH and runs `tools/deploy/Initialize-DeployAccess.ps1` (steps in `docs/publishing-workflow.md`), then sets `DEPLOY_ENABLED=true` for a dry run.

## Read First Next Session

- `AGENTS.md`
- `.blackfacts/project.yml`
- `docs/publishing-workflow.md`
- `content/README.md`
