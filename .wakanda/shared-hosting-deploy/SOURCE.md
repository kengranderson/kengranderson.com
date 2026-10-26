# Vendored copy

This folder is a copy of `devops/shared-hosting-deploy` from the private repository
`blackfacts/tools` (files: `action.yml`, `deploy-static.sh`, `verify-site.sh`).
It is here because a repository under a personal GitHub account cannot use an action
from a private organization repository.

- Source commit: 282af1f988b14da9f005a62e0f868993d0ea5d7f
- Documentation: `devops/shared-hosting-deploy/README.md` in blackfacts/tools
- Do not edit these files here. Change them in blackfacts/tools, then run
  `scripts/sync-deploy-action.sh <path to a blackfacts/tools clone>` and commit the result.
- If this repository moves into the blackfacts organization, delete this folder and use
  `blackfacts/tools/devops/shared-hosting-deploy@<commit>` in the workflow instead.
