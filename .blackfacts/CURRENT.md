# Current Project State

> **Project-owned file.** Keep this concise and operational. Replace stale details rather than appending a session log.
> **Canonical status is [docs/status.md](../docs/status.md)** (Wakanda Status and Portability Protocol, 2026-10-27). This file is the one-screen pointer.

**Last Updated:** 2026-10-27  
**Status:** Redesign live on Bluehost preview hosting (preview mode); kengranderson.com not yet cut over

## Current Objective

Fill in Ken's open content items and publish approved records, then switch to production mode and cut kengranderson.com over.

## Current State

- `master` builds a Vite + React site pre-rendered to static HTML (`web/`) over the legacy files (`scripts/build-site.sh`); merges deploy automatically to Bluehost preview via `.github/workflows/deploy.yml`.
- Pages: Home, My Story, My Work, Timeline (87 entries), My Philosophy (1 essay), Connect. Events not built.
- **2026-10-27: the 11 project records (`KenGranderson/content/work/*.json`) were never committed** (`.gitignore` ignored `work/`; fixed). Built from Git, My Work has no projects. See docs/status.md.
- Content: `KenGranderson/highlights.json` and `KenGranderson/content/`. All records are `draft` or `review`; none `published`.
- Deploy runs with `SITE_MODE: preview` (drafts and VERIFY flags visible, `noindex`).

## Verification

- **Verified (2026-10-26):** full build and link check pass; `npm run check:fit` passed on 18 pages (in the redesign session's working copy, which held the uncommitted project records; a clean checkout gives 7, 2026-10-27) at 360/390/768/1024/1440px; no console or hydration errors; legacy `/#hash` links forward to the timeline; deploy runs succeeded for PRs #3, #5, #6 and the manual run for #4.
- **Not verified by an agent:** the preview site in a browser (blocked from the cloud container; Ken checked it visually).

## Blockers / Open Questions

Waiting on Ken: see section 6 of the current handoff (MIT/DJ chapter, My Bed-Stuy details, signage file, project statuses, VERIFY sources, LinkedIn URL, philosophy sources, publish approvals, DNS cutover).

## Exact Next Action

Ken says whether the project records exist anywhere; otherwise an agent recreates them from the redesign handoff §5. Then Ken supplies the My Story and My Bed-Stuy items; an agent then builds the Events page and ports JSON Schema validation (handoff section 10).

## Read First Next Session

- `docs/status.md`
- `docs/handoffs/claude/2026-10-26-redesign-vite-react-site.md`
- `web/README.md`
- `docs/handoffs/2026-10-25-chatgpt-voice-to-claude-kengranderson-kickoff.md`
