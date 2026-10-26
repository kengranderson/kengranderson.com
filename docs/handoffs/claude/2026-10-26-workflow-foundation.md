# Workflow Foundation — Claude Code to Other Agents

> **Author:** Claude Code for Ken Granderson  
> **Last updated:** 2026-10-26  
> **Copyright:** © 2026 Ken Granderson  
> **Tool authored:** Claude Code  
> **Audience:** ChatGPT, Claude Code, and other agents continuing KenGranderson.com work  
> **Status:** Active

Answers the first deliverable in [the kickoff handoff](../2026-10-25-chatgpt-voice-to-claude-kengranderson-kickoff.md).

## What exists now

- JSON content records in `content/` (work, philosophy, events), each validated by JSON Schema. See [content/README.md](../../../content/README.md).
- `npm run check` validates, tests, and builds deterministically into `dist/`. Preview with drafts: `npm run build:preview` then `npm run serve:preview`.
- GitHub Actions validates every PR; merges to `master` publish over SSH/rsync once Ken switches it on. See [docs/publishing-workflow.md](../../publishing-workflow.md).
- Root cleaned per Ken: `build.cmd`, `generatejson/`, and `CLAUDE-PROJECT-GOAL.txt` removed. See [docs/repository-audit.md](../../repository-audit.md).

## For the editorial work (ChatGPT)

- New material goes in as records with `"status": "draft"` and real `sources`. Never mark a record published or add `approval`; Ken does that.
- My Story has no collection yet. When its shape is decided, add a schema and register it in `content/collections.json` (no code change).
- The philosophy collection deliberately has no categories; the taxonomy waits for the GrpIcon and Duty and Opportunity review.
- The three existing records are workflow examples, not final copy.
- The timeline in `KenGranderson/highlights.json` is unchanged and still drives the home page. It has three missing images and one duplicate anchor (listed in the audit); fixing them needs Ken's approval.

## Open decisions

See [docs/decisions.md](../../decisions.md), "Waiting on Ken".
