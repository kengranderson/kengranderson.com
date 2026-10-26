# Pending GitHub Actions workflow

`site.yml` belongs at `.github/workflows/site.yml`. The cloud agent that wrote it could not push files under `.github/workflows/` (its GitHub token lacks the `workflow` permission), so it is parked here.

The one-command setup in `docs/publishing-workflow.md` ("Fastest path") installs it for you. To do it by hand, from a checkout with your own GitHub credentials:

```bash
git mv tools/ci/site.yml .github/workflows/site.yml && git rm tools/ci/README.md && git commit -m "Install Site workflow" && git push
```

Once installed it validates and builds; publishing stays off until `DEPLOY_ENABLED` is set (see `docs/publishing-workflow.md`).
