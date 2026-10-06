# One-time setup

Do these steps once, as a human engineer with admin rights on the repository.

## 1. Install the tools

- **Node.js 24 LTS or newer.** It ships `node:sqlite` and `--env-file-if-exists`.
- **GitHub CLI** (`gh`).
- Then run `npm install`. This creates `package-lock.json`, which you commit, so CI can use `npm ci`.
- Run `npx playwright install chromium` for the browser tests.

The Claude Code hooks run on Node. Without Node the hooks fail open (a failing hook command doesn't block the action), so install Node before working with Claude in this repository.

## 2. Give Claude its own GitHub identity

GitHub never lets the author of a pull request approve it. To make "a human engineer approves every merge" enforceable, Claude must push and open PRs under its own account:

1. Create a machine user, for example `jean-claude-van-damme-bot`, or a GitHub App.
2. Give it **write** access to the repository, not admin.
3. On the machine where Claude Code runs, sign in to `gh` as the bot: `gh auth login`.
4. Put the bot's noreply address in `GIT_AUTHOR_EMAIL` in `.claude/settings.json` (format: `<id>+<login>@users.noreply.github.com`). Do this through a governance PR.

Commits made by Claude show **Jean Claude van Damme** as the author. This is set in `.claude/settings.json`.

## 3. Initialize the wiki

Enable the wiki under *Settings → General → Features*, and create one placeholder page. GitHub only creates `<repo>.wiki.git` after the first page exists. From then on, the `wiki-sync` workflow overwrites the wiki from `content/` after every merge to `main`.

## 4. Protect main

After `main` exists on GitHub, sign in to `gh` as yourself (an admin) and run:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/setup-branch-protection.ps1
```

The script creates the labels (`critical`, `feature`, `needs-approval`, `approved`, `deps-approved`, `governance`, `bug`) and sets these branch protection rules:

- every change goes through a pull request, with 1 approving review from a code owner (`.github/CODEOWNERS`),
- approvals are dismissed when new commits are pushed, and the last push must be approved by someone else,
- the CI checks `unit`, `e2e`, `frameworks`, `deps` and `pr-policy` must pass,
- linear history, no force pushes, no deletions, and conversations resolved,
- the rules also apply to admins (`-EnforceAdmins $false` turns that off. Your own PRs then still need a second engineer to approve them, because you can't approve your own PR.)
