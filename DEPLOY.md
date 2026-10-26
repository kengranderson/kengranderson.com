# Deploying KenGranderson.com

**Last updated:** 2026-10-26
**Author:** Claude Code for Ken Granderson

Every push to `master` that touches the site publishes it to Bluehost shared hosting through GitHub Actions. To update the website, change files under `KenGranderson/` (or ask Claude/ChatGPT to), commit, and push or merge. Nothing else.

```text
push to master → Actions: scripts/build-site.sh builds _site and checks it
              → blackfacts/tools shared-hosting deploy: rsync over SSH into the Bluehost folder
              → checks <site URL>/wakanda-deploy.json shows the new commit
```

- Workflow: [.github/workflows/deploy.yml](.github/workflows/deploy.yml)
- The deploy action is a copy kept in [.wakanda/shared-hosting-deploy](.wakanda/shared-hosting-deploy) (a repo under a personal GitHub account cannot use an action from the private blackfacts/tools repo). Refresh it with `scripts/sync-deploy-action.sh <path to blackfacts/tools clone>`.
- Shared tool and full docs: [blackfacts/tools devops/shared-hosting-deploy](https://github.com/blackfacts/tools/tree/main/devops/shared-hosting-deploy)
- What is live: open `<site URL>/wakanda-deploy.json` (commit, time, run link)

## What gets published

`scripts/build-site.sh` copies the same set as `build.cmd`: `capri-service-manual css fonts images js lib media share photos kendudeism` plus `favicon.ico highlights.json index.html`. Add a folder to both lists to publish it. IIS `web.config` files are dropped; the `.htaccess` next to each one does the same job on Apache (folder listings for `images`, `media`, `photos`).

The build fails on invalid `highlights.json` or a page `index.html` links to that does not exist. Missing highlight images only warn (three today: `images/highlights/ica.png`, `images/highlights/bfo1.jpg`, `images/civicchat-demo.jpg`).

## One-time setup (Ken, on Musa)

0. The workflow is in place (`.github/workflows/deploy.yml`, moved 2026-10-26 with Ken's git login).
1. In PowerShell, from your blackfacts/tools clone, `devops\shared-hosting-deploy`:
   ```powershell
   .\Setup-DeployKey.ps1 -SshAlias <your bluehost alias> -DiscoverOnly
   ```
   Read off the folder the temporary domain serves.
2. Then (after `gh auth login` once):
   ```powershell
   .\Setup-DeployKey.ps1 -SshAlias <alias> -Repo kengranderson/kengranderson -RemotePath <folder> -Url <temporary URL>
   ```
   This makes a deploy key only for this site, authorizes it on Bluehost, and creates the GitHub environment `bluehost-preview` with the secrets and settings.
3. GitHub → Actions → **Deploy to Bluehost** → Run workflow. *Dry run* is ticked: read the summary. Then run it again unticked, with *adopt* ticked if the summary says the folder already holds files (it backs them up on the server and keeps them).

## Not part of this

Pointing `kengranderson.com` itself at Bluehost (DNS, Bluehost domain settings, HTTPS) is a later step that replaces the live site, so it waits for Ken's go-ahead: see [CUSTOM-DOMAIN.md](https://github.com/blackfacts/tools/blob/main/devops/shared-hosting-deploy/CUSTOM-DOMAIN.md).
