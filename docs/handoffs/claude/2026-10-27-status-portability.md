# KenGranderson.com: status record and workstation portability (Claude Code, 2026-10-27)

> **Author:** Claude Code for Ken Granderson
> **Owner:** Ken Granderson
> **Tool authored:** Claude Code (cloud session), project "KenGranderson.com", thread "Implement status and workstation portability protocol"
> **Model:** Claude Opus family (exact identifier reported in the session)
> **Timestamp:** 2026-10-27T15:20:00Z
> **Repository / branch:** `kengranderson/kengranderson` `claude/project-thread-bhs65u` (from `master` `6850417` + `docs/redesign-handoff` `4c6268c`); shared tooling in `blackfacts/tools` on the branch of the same name
> **Status:** Ready for review

## Purpose

Apply Ken's Status, Continuity and Workstation Portability Protocol (2026-10-27) to this repository: a canonical status file, a workstation guide, a machine-readable environment manifest checked by shared Wakanda Tools, and an honest readiness verdict for the Dell.

## Work performed

- Inspected `master`, all remote branches, PRs (none open), deploy runs 6–11 and the latest run's log, the redesign handoff, the build.
- Built the site from a clean checkout and ran the fit check and smoke tests (Linux).
- Found: (1) the 11 project records were never committed (`.gitignore` `[Ww]ork/`); (2) `docs/redesign-handoff` had no PR; (3) legacy `generatejson/` reads a SQL Server database and would overwrite `highlights.json`.
- Added `docs/status.md`, `docs/workstation-setup.md`, `docs/dev-environment.json`, `docs/project-overview.md`, `scripts/Test-Workstation.ps1`; a short developer section at the end of the profile `README.md`; rows in `docs/README.md`; a pointer and correction in `.blackfacts/CURRENT.md`; `!KenGranderson/content/work/` in `.gitignore`. Included `docs/redesign-handoff` (fast-forward, unchanged).

## Key decisions

- The root README stays Ken's GitHub profile README (kickoff); standard README sections went to `docs/project-overview.md`.
- `docs/status.md` is canonical; `.blackfacts/CURRENT.md` points to it.
- `databases: []`: no database is needed to develop; the legacy one is documented as not used.
- The missing records are reported, not invented: recreating Ken's project descriptions needs his input.

## Modified files

`.gitignore`, `README.md`, `.blackfacts/CURRENT.md`, `docs/README.md`; new: `docs/status.md`, `docs/workstation-setup.md`, `docs/dev-environment.json`, `docs/project-overview.md`, `docs/handoffs/claude/2026-10-27-status-portability.md`, `scripts/Test-Workstation.ps1`. From `docs/redesign-handoff`: `.blackfacts/CURRENT.md`, `docs/README.md`, the kickoff and redesign handoffs.

## Verification

- Linux, Node 22.22.0, Python 3.13, PowerShell 7.4.6: `scripts/build-site.sh` OK (894 files, 0 warnings), `npm run check:fit` OK (7 pages), smoke OK, manifest valid, `scripts/Test-Workstation.ps1` 0 FAIL (WARN: project records missing).
- `.gitignore` fix checked with `git check-ignore` (a file in `KenGranderson/content/work/` is no longer ignored).
- Not verified: Windows build; the live site in a browser.

## Remaining tasks

1. Ken: do the project records exist anywhere? If not, recreate them as `review` drafts from the redesign handoff §5 and `highlights.json`.
2. Run `scripts/Test-Workstation.ps1` on the Dell; record the result in `docs/status.md`.
3. Redesign handoff §6, §7 and §10 items.

## Risks and blockers

- Project records may be unrecoverable.
- Windows build untested (Git Bash, `python3`).
- Domain cutover changes the live site: Ken's approval only.
