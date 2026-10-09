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

- every change goes through a pull request, with 1 approving review from the code owner, @BerendCheckpt (`.github/CODEOWNERS`),
- approvals are dismissed when new commits are pushed,
- the CI checks `unit`, `e2e`, `frameworks`, `deps` and `pr-policy` must pass,
- linear history, no force pushes, no deletions, and conversations resolved.

These rules are sized for **a single engineer**, who is also the only approver:

- "Require approval of the most recent push" is **off**. It needs a second person to approve your own pushes.
- "Do not allow bypassing the above settings" (`enforce_admins`) is **off**. GitHub never lets a PR author approve their own PR, so as the admin you merge your own PRs with the bypass checkbox. Claude's PRs come from the bot account, so you approve those normally.

Run the script only once. Claude never runs it and never changes branch protection. Change the settings yourself under *Settings → Branches*.
