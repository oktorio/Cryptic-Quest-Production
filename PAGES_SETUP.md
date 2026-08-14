# GitHub Pages one-time setup

The repository contains a ready-to-use GitHub Pages workflow, but GitHub Pages itself must first be enabled in the repository settings.

## One-time setup

1. Open **Settings → Pages** in this repository.
2. Under **Build and deployment**, choose **GitHub Actions** as the source.
3. Open **Settings → Secrets and variables → Actions → Variables**.
4. Create a repository variable:
   - Name: `ENABLE_PAGES_DEPLOY`
   - Value: `true`
5. Open **Actions → Deploy Cryptic Quest to GitHub Pages** and run the workflow, or push a new commit to `main`.

The workflow is intentionally gated by `ENABLE_PAGES_DEPLOY` so repositories that have not completed the one-time Pages setup do not accumulate failed deployment runs.

The normal quality-check workflow runs independently of Pages deployment.
