# Workstation Setup — KenGranderson.com

> **Author:** Claude Code for Ken Granderson
> **Owner:** Ken Granderson
> **Last Updated:** 2026-10-27
> Primary target: Dell Windows development workstation, PowerShell. Machine-readable version: [dev-environment.json](dev-environment.json). Current state: [status.md](status.md).

**Check a computer at any time:**

```powershell
.\scripts\Test-Workstation.ps1
```

It runs the shared Wakanda Tools validator and answers "can someone continue this project here right now?" with PASS / FAIL / NOT VERIFIED and a fix for each problem. It needs a `blackfacts/tools` clone next to this repository (section 2).

## 1. Minimum vs. full environment

| Environment | You can | Needs |
|---|---|---|
| **Minimum** | Edit content JSON or code, build the whole site, preview it locally, open pull requests | Git (with Git Bash), Node.js 22+, a `python3` command, write access to this repository |
| **Full** | Also run the readiness check, refresh the vendored deploy action, recreate the deploy key, cut over the domain | Access to private `blackfacts/tools`; GitHub CLI; SSH access to the Bluehost account; Ken's approval for anything that changes the live site |

Publishing needs nothing on the workstation: merging to `master` deploys through GitHub Actions ([DEPLOY.md](../DEPLOY.md)).

## 2. Repositories and clone locations

```powershell
cd $env:USERPROFILE\source\repos
git clone https://github.com/kengranderson/kengranderson.git kengranderson
git clone https://github.com/blackfacts/tools.git Wakanda.Tools     # optional; private
```

| Repository | Required | Branch | Folder |
|---|---|---|---|
| `kengranderson/kengranderson` | yes | `master` (work on a branch, merge by PR) | `kengranderson` |
| `blackfacts/tools` | no | `main` | `Wakanda.Tools` (Ken's existing name) |

Or let the shared tool do it without touching anything that exists: `..\Wakanda.Tools\local-dev\workstation-readiness\Initialize-ProjectRepositories.ps1 -Manifest .\docs\dev-environment.json -IncludeOptional -InstallPackages`.

## 3–4. Runtimes and tools

| Tool | Version | Why | Windows install |
|---|---|---|---|
| Git for Windows (includes Git Bash) | any recent | source control; `scripts/build-site.sh` runs in Git Bash | `winget install --id Git.Git -e` |
| Node.js + npm | 22 or later (GitHub Actions uses 22) | builds `web/` | `winget install --id OpenJS.NodeJS.LTS -e` |
| Python 3 as **`python3`** | any 3.x (3.13 verified on Linux) | the build validates `highlights.json` with `python3` | Microsoft Store Python (provides `python3.exe`). The python.org installer provides only `python`/`py`; the build then fails until a `python3` exists |
| GitHub CLI | optional | sign-in, pull requests, deploy-key setup | `winget install --id GitHub.cli -e` |
| PowerShell 7 | optional | recommended for Wakanda Tools scripts | `winget install --id Microsoft.PowerShell -e` |
| Playwright + Chromium | optional | `npm run check:fit` | `cd web; npm i --no-save playwright; npx playwright install chromium` |

`blackfacts/tools` `launcher\Install-WakandaTools.cmd` installs Git, Node.js LTS, Python 3.12 and the GitHub CLI in one go.

## 5. Application configuration

None. Content is JSON in the repository ([web/README.md](../web/README.md)). No `.env` or settings file is needed to develop.

## 6. Environment variables

| Name | Where | Purpose |
|---|---|---|
| `SITE_MODE` | workstation, optional | `preview` (default) or `production` |
| `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_PATH`, `DEPLOY_URL`, `DEPLOY_PORT`, `DEPLOY_VERIFY_INSECURE` | GitHub environment `bluehost-preview` variables | deploy target |
| `DEPLOY_SSH_KEY`, `DEPLOY_KNOWN_HOSTS` | GitHub environment secrets | deploy identity; created by `Setup-DeployKey.ps1` |

Never put deploy values in the repository.

## 7–8. Databases

**None.** The site is static. The legacy `generatejson/` console app once generated `KenGranderson/highlights.json` from a SQL Server database `KenGranderson` on the machine INKOSI; the JSON is now edited directly, and running `generatejson` would overwrite those edits. Do not run it.

## 9. Local services

None. Building needs the npm registry; publishing needs GitHub.

## 10. Build and test

From Git Bash in the repository root (or `bash scripts/build-site.sh _site` from PowerShell):

```bash
scripts/build-site.sh _site                      # npm ci in web/, build, copy legacy files, link check
SITE_MODE=production scripts/build-site.sh _site  # what production would publish
cd web && npm run check:fit                      # heading fit at 360–1440px (needs Playwright)
```

## 11. Start (preview locally)

```bash
python3 -m http.server 8080 --directory _site     # then open http://localhost:8080
```

No live reload: rebuild and refresh.

## 12. Health checks

- `.\scripts\Test-Workstation.ps1` (0 FAIL is the goal).
- After a merge: GitHub → Actions → **Deploy to Bluehost** is green; `<DEPLOY_URL>/wakanda-deploy.json` shows the merged commit.

## 13. Known limitations and platform differences

- Verified on Linux only (GitHub Actions and a cloud session, 2026-10-27). The Windows build depends on Git Bash and `python3` and has not yet been run.
- `npm run check:fit` builds paths from `import.meta.url`, which may not resolve on Windows; run it on Linux/macOS or in a cloud session until checked.
- The project records under `KenGranderson/content/work/` are missing from Git ([status.md](status.md)).
- Cloud agents cannot push `.github/workflows/*`; Ken edits the workflow.

## 14. Troubleshooting

| Symptom | Fix |
|---|---|
| `python3: command not found` in the build | Install Microsoft Store Python, or create `python3` (e.g. a copy of `python.exe` named `python3.exe` in a folder on `PATH`) |
| `bash` opens WSL or fails | Run the build from Git Bash; the readiness tools find Git Bash automatically |
| `npm ci` fails | Use Node 22+; delete `web/node_modules` and rerun; never edit `package-lock.json` by hand |
| Build fails "links to missing" | A page links to a file not in `_site`; add the file or fix the link |
| Deploy run fails at "Check deploy settings" | The `bluehost-preview` environment lost a variable or secret; see [DEPLOY.md](../DEPLOY.md) |
