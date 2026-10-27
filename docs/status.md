# Project Status — KenGranderson.com (`kengranderson/kengranderson`)

> Canonical living status for this repository, per the Wakanda Tools [Status, Continuity and Workstation Portability Protocol](https://github.com/blackfacts/tools/blob/main/docs/status-and-portability-protocol.md) v1.0. Newest log entry first. Detailed handoffs: [handoffs/](handoffs/). Cross-repository overview (coordinating repository `blackfacts/tools`, private): `docs/projects/kengranderson-com.md` there.

## Current Snapshot

- **Project:** KenGranderson.com, Ken Granderson's personal website and living record of his work, philosophy and story, maintained by AI agents through GitHub.
- **Repository:** `kengranderson/kengranderson` (public; the root README is also Ken's GitHub profile README)
- **Primary remote:** `origin` https://github.com/kengranderson/kengranderson.git. The site originated in a TFS repository `KenGranderson` (kickoff handoff); whether a TFS remote is still in use on Ken's machines is unknown.
- **Current branch:** `claude/project-thread-bhs65u` (this session's documentation branch; pull request to `master`)
- **Latest local commit:** see the Agent Activity Log; base `4c6268c` (`docs/redesign-handoff`, itself on top of `master` `6850417`)
- **Remote-tracking commit:** `origin/master` `6850417` "Merge pull request #6 from kengranderson/redesign/my-story"
- **Working tree:** Clean after this session's commits
- **Agent:** Claude Code (cloud session, project "KenGranderson.com", thread "Implement status and workstation portability protocol")
- **Model:** Claude Opus family (exact identifier reported in the session)
- **Timestamp:** 2026-10-27T15:15:00Z
- **Overall status:** Active

## Executive Summary

**What and why.** Ken wants KenGranderson.com to be a living record of his work and to demonstrate his AI-first approach: his instructions go to an AI agent, the agent changes GitHub, GitHub Actions validates, builds and deploys. The publishing pipeline was the first objective; content and redesign follow.

**Where it stands.** The pipeline works: every merge to `master` builds the site and deploys it to Bluehost shared hosting on a temporary domain, verified over HTTP (six successful runs on 2026-10-26). The redesign (Vite + React pre-rendered to static HTML, content in JSON, legacy pages kept) is on `master` in **preview mode** (drafts and VERIFY flags visible, `noindex`).

**Usable today.** Home, My Story, Timeline (87 entries), My Philosophy (one essay), Connect, and the old site at `classic.html`.

**Not working or unfinished.**
- **The My Work project records are not in Git** (see In Progress). The site built from Git has 7 pages and no project pages, not the 18 the redesign handoff describes.
- `kengranderson.com` has not been confirmed as pointed at the new hosting; the deploy target on 2026-10-26 was still the temporary domain.
- Ken's content items (redesign handoff §6), the Events page, JSON Schema validation, production mode.

## Recently Completed Work

### Verified (by the agent writing the entry)

- **Automated publishing** (PR #2, `0f542bd`): `.github/workflows/deploy.yml`, `scripts/build-site.sh`, vendored `.wakanda/shared-hosting-deploy`. Deploy runs 6–11 on `master` all succeeded; latest [run 40358737989](https://github.com/kengranderson/kengranderson/actions/runs/40358737989) deployed `6850417` (894 files) and the workflow verified the stamp, home page, `highlights.json` and `css/style.css` over HTTP.
- **Redesign** (PRs #3–#6, `8daeea1`, `28d3963`, `56ff335`, `6850417`; Ken's workflow fix `f62ed43`): builds from a clean checkout. 2026-10-27, Linux, Node 22.22.0, Python 3.13: `scripts/build-site.sh` OK, 894 files, 0 warnings; `npm run check:fit` OK on **7** pages.
- **Vendored deploy action matches Wakanda Tools:** `action.yml`, `deploy-static.sh`, `verify-site.sh` are byte-identical to `blackfacts/tools` `main` (checked 2026-10-27).
- **This session:** status and workstation documents, manifest, `scripts/Test-Workstation.ps1`, `.gitignore` fix (Activity Log).

### Reported, not verified here

- Redesign handoff ([handoffs/claude/2026-10-26-redesign-vite-react-site.md](handoffs/claude/2026-10-26-redesign-vite-react-site.md)): 11 work records, 18 pages, `check:fit` on 18 pages, Ken checked the preview visually. The 11 records and 18 pages are **contradicted by Git** (below); the rest is plausible but was not re-checked.

## Work Currently In Progress

| Item | State | Risk |
|---|---|---|
| **11 project records `KenGranderson/content/work/*.json`** | **Never committed.** `.gitignore` (Visual Studio template) ignores every folder named `work/`, so `git add` skipped them. No branch or commit on GitHub has them. Deploy logs show 894 files, the same count as a clean local build without them. | **Lost unless a copy exists** outside Git (the redesign session's container is gone). Recreate from the redesign handoff §5 table, `highlights.json` and the design canvas. This session added `!KenGranderson/content/work/` to `.gitignore` so recreated records will be committed. |
| Documentation from the redesign session (`docs/redesign-handoff`, `4c6268c`) | Was pushed with no PR; included in this session's branch | Reaches `master` when this PR merges |
| Ken's content items | Redesign handoff §6 | Nothing blocks the build |
| Events page, JSON Schema validation, timeline type filters | Not started | |
| Custom domain cutover | Tool exists (`blackfacts/tools` `devops/shared-hosting-deploy/Connect-CustomDomain.ps1`); not run as far as the repository shows | Needs Ken's approval (changes the live site) |
| Superseded branch `claude/project-thread-rhxstz` (PR #1, closed) | Ideas only (JSON Schemas, decision log, audit) | None; keep for reference |

## Git Status and Commit References

| Branch | Head | On remote? | PR | Purpose |
|---|---|---|---|---|
| `master` | `6850417` | yes | — | Deployed site |
| `docs/redesign-handoff` | `4c6268c` | yes | none | Redesign handoff, kickoff, `.blackfacts/CURRENT.md`; included in this session's branch |
| `claude/project-thread-rhxstz` | `1f2f46e` | yes | #1 closed | Superseded foundation |
| `claude/project-thread-bhs65u` | this session | yes (pushed) | open | Status, workstation setup, manifest |

No other open pull requests (checked 2026-10-27). Everything except the missing records is available from any workstation.

## Next Steps

1. **Recover or recreate the project records.** Why: My Work is empty in the built site. Files: `KenGranderson/content/work/<slug>.json` (format in `web/README.md`), slugs and states in the redesign handoff §5. Dependency: Ken says whether any copy exists. Verify: `scripts/build-site.sh` reports 18 pages in preview; `npm run check:fit` covers them; the "project records present" smoke test passes in `scripts/Test-Workstation.ps1`.
2. **Run `scripts/Test-Workstation.ps1` on the Dell.** Why: the build has never run on Windows (Git Bash + `python3`). Verify: 0 FAIL; record the result here.
3. **Ken's content items** (redesign handoff §6), then publish approved records.
4. **Events page; port JSON Schema validation** (redesign handoff §7, §10).
5. **Production mode and domain cutover**, only with Ken's approval.

**Recommended Next Action:** Ken: say whether the 11 project records exist anywhere (a local folder, the design canvas, another session). If not, an agent recreates them from the redesign handoff §5 and `highlights.json` as `review` drafts in one PR.

## Decisions and Open Questions

| Decision | Status | Who, when |
|---|---|---|
| Vite + React pre-rendered to static HTML; content in JSON; preview vs. production modes | Confirmed | Ken, 2026-10-26 (redesign handoff R-01–R-10) |
| Deploy on every merge to `master` via vendored shared-hosting action | Confirmed, running | Ken, 2026-10-26 |
| Root `README.md` stays Ken's GitHub profile README; developer detail lives in [docs/project-overview.md](project-overview.md) | Confirmed by kickoff; layout proposed by this session | Ken (kickoff); Claude Code, 2026-10-27 |
| `docs/status.md` canonical, `.blackfacts/CURRENT.md` a short pointer | Proposed | Claude Code, 2026-10-27 |
| No database for development; legacy SQL Server `KenGranderson` (host INKOSI) used only by `generatejson/` | Verified from code; database's current existence unknown | Claude Code, 2026-10-27 |
| Do the records exist anywhere? Is the TFS `KenGranderson` repository still used? Remove `generatejson/`, `build.cmd`? | Open | Ken |

## Verification and Testing

- **Passed (2026-10-27, Linux cloud container):** `scripts/build-site.sh` (894 files, 0 warnings); `npm run check:fit` (7 pages); smoke test; manifest valid; `scripts/Test-Workstation.ps1`: 0 FAIL, 1 NOT VERIFIED (GitHub write access is a person's check), WARN for the missing project records.
- **Failed:** "project records present" smoke test (expected until the records are recreated).
- **Not run:** any Windows run; browser check of the deployed site (the cloud container cannot reach Bluehost; deploy state read from Actions logs).
- **Commands:** `scripts/build-site.sh _site`; `cd web && npm run check:fit`; `python3 -m http.server 8080 --directory _site`; `pwsh -File scripts/Test-Workstation.ps1`.

## Workstation Readiness

**PARTIALLY READY.** Source, dependencies (Node 22, npm lockfile, Git Bash, `python3`), build and test commands are documented ([workstation-setup.md](workstation-setup.md), [dev-environment.json](dev-environment.json)) and verified on Linux; no database or secrets are needed to develop. Gaps: never built on Windows; the project records are missing from Git; deploy settings live only in the GitHub environment `bluehost-preview` (by design).

## Agent Activity Log

### 2026-10-27T15:15:00Z — Claude Code (cloud session)

- **Branch:** `claude/project-thread-bhs65u` = `master` `6850417` + `docs/redesign-handoff` `4c6268c` (fast-forward) + this session's commits (see the pull request).
- **Activity:** Inspected both repositories, the Actions runs and logs; found the uncommitted project records and the unmerged docs branch; added this file, [workstation-setup.md](workstation-setup.md), [dev-environment.json](dev-environment.json), [project-overview.md](project-overview.md), `scripts/Test-Workstation.ps1`, a developer section in `README.md`, index entries in [README.md](README.md), a pointer in `.blackfacts/CURRENT.md`, the `.gitignore` fix, and [handoffs/claude/2026-10-27-status-portability.md](handoffs/claude/2026-10-27-status-portability.md). Shared tooling went to `blackfacts/tools` (`local-dev/workstation-readiness`).
- **Verification:** build, fit check, smoke test and readiness check run on Linux (above). Windows not run.
- **Status:** Ready for review.
- **Next:** Ken answers whether the project records exist; then recreate them.

### 2026-10-26 — Claude Code (redesign thread), recorded from [its handoff](handoffs/claude/2026-10-26-redesign-vite-react-site.md)

- **Commits:** PRs #3–#6 (`8daeea1` … `6850417`), docs branch `4c6268c`.
- **Activity:** Redesigned site, content JSON, fit check, My Story.
- **Status:** Merged and deployed; project records were not committed (found 2026-10-27).
