# KenGranderson.com — Project Overview for Developers and Agents

> **Repository:** `kengranderson/kengranderson`
> **Author:** Claude Code for Ken Granderson
> **Owner:** Ken Granderson
> **Last Updated:** 2026-10-27
> **Status:** Active

The root [README.md](../README.md) is Ken's GitHub profile README, so it stays short. This page holds the standard project README sections ([Wakanda Tools template](https://github.com/blackfacts/tools/blob/main/docs/templates/PROJECT-README.md)).

## Project Overview

Ken Granderson's personal website: a living record of his work, philosophy, story and the events and documents of his life. Audience: anyone looking Ken up, and the AI agents that maintain it. In the BlackFacts / Wakanda ecosystem it is a demonstration of Ken's AI-first delivery process (instructions → agent → GitHub → Actions → website), using Wakanda Tools conventions and the shared deploy action from `blackfacts/tools`.

## Architecture

- **Content:** JSON in the repository. `KenGranderson/highlights.json` (timeline), `KenGranderson/content/` (story, philosophy, site-wide text, work records). Format: [web/README.md](../web/README.md).
- **Site:** `web/` is a Vite 5 + React 18 app, pre-rendered to static HTML at build time (`prerender.mjs`), with a small client bundle for interaction. Fonts self-hosted.
- **Legacy:** `KenGranderson/` also holds the original one-page site (served as `classic.html`), images, media, the Capri service manual, Kendudeism, and old ASP.NET/IIS project files (`KenGranderson.sln`, `Web.config`, unused for publishing).
- **Build:** `scripts/build-site.sh` (bash) assembles `_site/`: legacy folders, React build on top, then fails on invalid JSON or broken local links. `build.cmd` is the older Windows copy step.
- **Deploy:** `.github/workflows/deploy.yml` on push to `master` → build → vendored `.wakanda/shared-hosting-deploy` action (rsync over SSH to Bluehost shared hosting) → HTTP verification of `wakanda-deploy.json`. See [DEPLOY.md](../DEPLOY.md).
- **Languages:** JavaScript (React, Node build), bash, a little Python (validation in the build), PowerShell (workstation check). Legacy C# (`generatejson/`).
- No server-side code, no database, no CMS.

## Repository Inventory

| Repository | Clone URL | Purpose | Required? | Branch | Local folder | Depends on |
|---|---|---|---|---|---|---|
| kengranderson | https://github.com/kengranderson/kengranderson.git | The site | Required | `master` | `kengranderson` | — |
| tools (Wakanda Tools) | https://github.com/blackfacts/tools.git (private) | Deploy action source, deploy setup, domain cutover, readiness tools, standards | Optional | `main` | `Wakanda.Tools` | — |
| kengranderson-archived | private | Older material | Not used; leave alone (Ken) | — | — | — |

The deploy action is a vendored copy, so the site never needs `blackfacts/tools` at build time.

## System Dependencies

Verified on Linux 2026-10-27; Windows not yet verified. Details: [workstation-setup.md](workstation-setup.md).

- Windows 10/11 (target), macOS or Linux
- Git (Git Bash on Windows), Node.js 22+ with npm, Python 3 as `python3`
- Optional: GitHub CLI, PowerShell 7, Playwright + Chromium, OpenSSH client
- Environment variables: `SITE_MODE` (optional). Deploy settings live in the GitHub environment `bluehost-preview`.
- External services: GitHub, npm registry; Bluehost shared hosting (deploy target, reached only by GitHub Actions)
- No VPN, certificates or local credentials needed to develop.

## Database Inventory

**None used.** Legacy only: SQL Server database `KenGranderson` (table `Highlights`) on the machine INKOSI, read by `generatejson/` to produce `highlights.json` before the JSON became the source. Its current existence is unknown; it is not needed, and running `generatejson` would overwrite `highlights.json`.

## Build and Run

```bash
scripts/build-site.sh _site                         # install (npm ci), build, check
cd web && npm run check:fit                         # layout test (needs Playwright)
python3 -m http.server 8080 --directory _site        # preview at http://localhost:8080
pwsh -File scripts/Test-Workstation.ps1             # is this computer ready? (needs blackfacts/tools)
```

## Development Workstation Setup

[workstation-setup.md](workstation-setup.md) and [dev-environment.json](dev-environment.json).

## Current Development Status

[status.md](status.md).

## Agent Handoffs

- [handoffs/](handoffs/): Ken's [kickoff](handoffs/2026-10-25-chatgpt-voice-to-claude-kengranderson-kickoff.md) (requirements and vision), tool-specific handoffs in `handoffs/<agent>/` (for example [claude/](handoffs/claude/)).
- Index: [docs/README.md](README.md).
