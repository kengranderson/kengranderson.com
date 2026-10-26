# KenGranderson.com — Agent Instructions

> **Author:** Claude Code for Ken Granderson  
> **Owner:** Ken Granderson  
> **Last Updated:** 2026-10-26  
> **Status:** Active

This repository is Ken Granderson's personal website, a living record of his work, philosophy, and story. It follows the BlackFacts AI-Assisted Development Framework in [blackfacts/tools](https://github.com/blackfacts/tools) (`framework/`). Read the rules there; this file records only what is specific to this site.

## Read first

1. `.blackfacts/CURRENT.md`: current state and the exact next action.
2. `.blackfacts/project.yml`: components, commands, approved exceptions.
3. [docs/publishing-workflow.md](docs/publishing-workflow.md): how a change gets from a request to the live site.
4. [content/README.md](content/README.md): the content model and how to add a record.
5. Shared rules, by their canonical location in blackfacts/tools: `framework/agent-contract.md`, `framework/precedence.md`, `framework/risk-and-approval.md`, `docs/file-headers.md`, `docs/ai-development-handoff-protocol.md`.
6. `git status` before editing.

## Repository map

| Path | What it is |
|---|---|
| `README.md` | Also Ken's GitHub profile README (the repo name matches the account). Keep it working as both. |
| `KenGranderson/` | The website as served: `index.html`, `highlights.json` (the timeline), css, js, lib, images, media. |
| `content/` | JSON source records (work, philosophy, events) and their schemas. |
| `tools/site/` | Validate, build, preview server, and tests (Node 22, one dependency: ajv). |
| `tools/deploy/` | SSH/rsync publish script, deploy key setup, and the one-command workstation setup (copies of blackfacts/tools `devops/static-site-publish`; update them from there). |
| `.github/workflows/site.yml` | CI: validate and build on every PR and push to master; gated publish from master. Until installed, it is parked at `tools/ci/site.yml` (see `tools/ci/README.md`). |
| `docs/` | Audit, workflow, decisions, and `docs/handoffs/` for tool-to-tool handoffs. |

## Everyday commands

```bash
npm ci                   # once
npm run check            # tests + validate + build into dist/
npm run build:preview    # build including drafts into dist-preview/ (never published)
npm run serve:preview    # http://localhost:8080/
```

## Rules for this site

- Content changes go through a pull request into `master`. Merging to `master` is what publishes, once publishing is switched on.
- Never set a record to `"status": "published"` or add an `approval` block yourself. Only Ken approves publication, and the approval block records who and when.
- Do not invent biographical facts, dates, roles, or historical comparisons. Record what a source says, cite it in `sources`, and leave unknowns out or in `editorNotes`.
- Do not change or delete historical material (`KenGranderson/highlights.json`, images, media, documents) without Ken's explicit approval. The validator reports known historical issues as warnings; leave them unless asked.
- Use existing approved brand assets only. Do not create substitute logos.
- Ask Ken before: activating or changing publishing, DNS or hosting changes, paid services, access permissions, final editorial wording about his beliefs, and major design changes.
- Never commit secrets. Deployment credentials live only in GitHub Actions secrets.
- Leave `kengranderson-archived` (a separate private repository) alone.
- Record decisions in `docs/decisions.md` and keep `.blackfacts/CURRENT.md` current at the end of a work unit.
