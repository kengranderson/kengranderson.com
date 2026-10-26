# Publishing Workflow

> **Author:** Claude Code for Ken Granderson  
> **Owner:** Ken Granderson  
> **Last Updated:** 2026-10-26  
> **Status:** Active (publishing not yet switched on)

The goal: Ken describes a change to a desktop AI agent, previews it locally, says "publish", and kengranderson.com updates.

```text
Ken's request -> agent edits a branch -> local preview -> pull request (CI validates and builds)
             -> Ken says publish -> merge to master -> GitHub Actions builds and rsyncs to the server
             -> deploy confirms the live site serves the new commit
```

## 1. Make and preview a change (agent)

```bash
git switch -c content/<short-name>      # one branch per request
# edit content/... or KenGranderson/...
npm run check                           # tests + validate + build; must end with 0 errors
npm run build:preview                   # include drafts, into dist-preview/
npm run serve:preview                   # open http://localhost:8080/ and show Ken
```

`npm run serve` serves the production build (`dist/`, published records only); `serve:preview` serves the preview build. Stop the server with Ctrl+C.

What fails the build: malformed JSON, schema errors, broken record links, missing media files (case-sensitive), a published record without approval. Warnings (pre-existing timeline issues) do not fail it; `node tools/site/validate.mjs --strict` makes them fail.

## 2. Propose it (agent)

Commit with a message that says what changed, push the branch, and open a pull request into `master`. The **Site** workflow runs on the pull request: tests, validation, build, and a summary of the build manifest. The PR is the review record.

## 3. Publish it (Ken, or an agent on Ken's word)

Merge the pull request. The push to `master` runs the workflow again and, once publishing is switched on, the **Publish to server** job builds the same commit and rsyncs `dist/` to the server. Only changed files are sent.

It then fetches `SITE_URL/build-manifest.json` and fails unless the live site reports the merged commit. That is the confirmation of what was published; the job summary shows the files transferred.

To confirm later from anywhere: open `https://kengranderson.com/build-manifest.json` and compare `source.commit` with the latest commit on `master`.

Manual runs: Actions > Site > Run workflow, on `master`. "Dry run" is ticked by default.

## 4. Record it (agent)

Update `.blackfacts/CURRENT.md` if the state of the project changed, and note any decision in `docs/decisions.md`.

---

## One-time server setup (Bluehost)

Bluehost's menus change; these are the standard cPanel steps. If a menu name differs, the Bluehost help search for "SSH access" finds the current one.

1. **Turn on SSH** for the hosting account (Bluehost: Websites or Advanced > SSH Access; some accounts need it enabled by support). Note the **SSH username** (the cPanel username), the **server IP or hostname**, and the **port** (normally 22).
2. **Find the site folder.** The primary domain is served from `public_html` in the account's home. Log in once with your password (`ssh <user>@<host>`), run `pwd` to see the real home path (Bluehost uses paths like `/home1/<user>`), and use the full path, for example `/home1/<user>/public_html`. For an addon domain, cPanel > Domains shows its document root.
3. **Create the deploy key and read the server's host key.** On your workstation, one command:

   ```powershell
   & C:\Users\ken\source\repos\kengranderson\tools\deploy\Initialize-DeployAccess.ps1 -DeployHost <ip-or-host> -DeployUser <cpanel-user> -DeployPath <full-folder-path>
   ```

   It creates `~/.ssh/kengranderson_deploy` (a key used only by GitHub Actions), saves the server's host key next to it, and prints the public key.
4. **Authorize the key**: cPanel > Security > SSH Access > Manage SSH Keys > Import Key, paste the public key, then **Authorize** it. If import rejects the ed25519 key, tell your agent; the script can be switched to RSA.
5. **Test and store the settings**, again one command (needs the GitHub CLI, `gh auth login` once):

   ```powershell
   & C:\Users\ken\source\repos\kengranderson\tools\deploy\Initialize-DeployAccess.ps1 -DeployHost <ip-or-host> -DeployUser <cpanel-user> -DeployPath <full-folder-path> -TestConnection -SetGitHub
   ```

   It confirms the login, that rsync exists, and that the folder exists, then stores the secrets and variables below. Without `-SetGitHub` it prints them so you can add them by hand under GitHub > the repo > Settings > Secrets and variables > Actions.

| Kind | Name | Value |
|---|---|---|
| Secret | `DEPLOY_SSH_KEY` | The private key file `~/.ssh/kengranderson_deploy` (never the `.pub`) |
| Secret | `DEPLOY_KNOWN_HOSTS` | The file `~/.ssh/kengranderson_deploy.known_hosts` |
| Variable | `DEPLOY_HOST` | Server IP or hostname |
| Variable | `DEPLOY_PORT` | `22` unless Bluehost says otherwise |
| Variable | `DEPLOY_USER` | cPanel username |
| Variable | `DEPLOY_PATH` | Full folder path, e.g. `/home1/<user>/public_html` |
| Variable | `SITE_URL` | `https://kengranderson.com` (or a test URL before DNS moves) |

Nothing in the repository ever holds these values.

## Switching publishing on (needs Ken's approval)

Each step is a repository variable (Settings > Secrets and variables > Actions > Variables):

1. `DEPLOY_ENABLED` = `true`: merges to `master` now run the deploy job as a **dry run**. The log lists what would be uploaded; nothing on the server changes.
2. `DEPLOY_DRY_RUN` = `false`: merges to `master` now **publish**.
3. Optional, later: `DEPLOY_DELETE` = `true` removes server files that are no longer in the build (server-managed files such as `.well-known/` and `.htaccess` are protected). Leave it off until the first live publish has been checked, because the target folder may hold files that are not in this repository.

To stop publishing at any time, set `DEPLOY_ENABLED` to `false` or delete it.

Optional extra gate: Settings > Environments > `production` > Required reviewers = Ken. Every publish then waits for a click in GitHub.

Until DNS for kengranderson.com points at Bluehost, a live publish only updates the Bluehost folder; the public site does not change. Set `SITE_URL` to a URL that reaches that folder (Bluehost offers a temporary URL) so the post-publish check works, then change it to `https://kengranderson.com` at cutover.

## What runs where

| Piece | File |
|---|---|
| Workflow | `.github/workflows/site.yml` |
| Validate | `tools/site/validate.mjs` |
| Build | `tools/site/build.mjs` (output `dist/`, plus `dist/data/content.json` and `dist/build-manifest.json`) |
| Preview server | `tools/site/serve.mjs` |
| Publish | `tools/deploy/rsync-deploy.sh` (dry run unless `DEPLOY_DRY_RUN=false`; refuses preview builds) |
| Key setup | `tools/deploy/Initialize-DeployAccess.ps1` |

The build is deterministic: the same commit always produces byte-identical output and the same manifest.

## Not copied to the server

`App_Data/`, `sass/`, `KenGranderson.sln`, `README.txt`, `Web.config` files, `compilerconfig.json*`, `libman.json`, `packages.config`, `desktop.ini`, `Thumbs.db`, and `*.psp` files. The list is `SITE_EXCLUDES` in `tools/site/lib/config.mjs`.
