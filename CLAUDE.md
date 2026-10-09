# CLAUDE.md

A website that publishes the AI-native SDLC bible. It runs on Node.js (built-ins only), HTML/CSS/JavaScript with **W3.CSS and W3.JS**, and **SQLite via `node:sqlite`**. Node 24+ is required. There are no runtime npm dependencies. The only dev dependency is `@playwright/test`.

## Repo context
- **One engineer:** @BerendCheckpt is the only human engineer, code owner and approver. Never set up anything that assumes a team (extra reviewers, "last push approved by someone else").
- Claude's PRs must come from the bot account, because GitHub never lets a PR author approve their own PR.
- **Claude never changes branch protection** and never runs `scripts/setup-branch-protection.ps1`. If protection looks wrong, explain it and give the engineer the command.

## Terminology
- **"Wiki"** always means this repository's **GitHub Wiki** (the Wiki tab). Its pages are generated from `content/` and pushed by the `wiki-sync` workflow to `ai-native-sdlc-bible.wiki.git`, where GitHub stores the Wiki tab. It never means the website, `docs/` or any other repository. If a request about the wiki is unclear, ask before building.

## Architecture
- `content/` holds the Markdown that is the **single source** for the website and the GitHub wiki. It is maintained by humans, and **Claude never edits it**.
- `src/content.js` loads it. `npm run seed` renders it (`src/markdown.js`, `src/dynamics.js`) into `data/bible.db`, which is gitignored.
- `src/server.js` (plain `node:http`) renders `src/views/*.html` from SQLite. `public/` holds the CSS and JS.
- `scripts/build-wiki.js` writes `build/wiki/`, which the `wiki-sync` workflow publishes after each merge.
- Policy lives in `scripts/lib/policy.js`, which the hooks in `.claude/hooks/` and the CI checks share.

## Commands (each must exit 0)
`npm run seed` · `npm start` (http://127.0.0.1:3000) · `npm test` (node:test) · `npm run test:e2e` (Playwright) · `npm run check` (frameworks, artifacts, dependencies) · `npm run wiki`

## Required skills (not optional)
| Trigger | Skill | Output |
|---|---|---|
| New idea or problem | `write-intent` | `work/<issue>-<slug>/intent.md` |
| Accepted intent | `write-spec` | `spec.md` |
| Approved spec, before coding | `write-plan` | `plan.md` |
| New feature or bug fix | `write-tests` | `tests/**` |
| Opening a PR | `write-pr` | PR with `## Justification` |
| Creating an issue | `create-issue` | Issue (critical rules) |
| Content change requested | `new-content-section` | Draft in `work/<id>/drafts/` |

## Git rules (enforced by hooks, branch protection and CI)
- Commit and pull freely, but **never commit on, push to or merge into `main`**. Every merge to main needs a human engineer's review and approval.
- Commits are authored as **Jean Claude van Damme** (set in `.claude/settings.json`). Never pass `--author`.
- Create a branch only as `feature/<issue>-<slug>`, and only after a human has labelled the issue `approved`.
- **Ask the human engineer before committing any change under `tests/`.**
- `CLAUDE.md`, `REVIEW.md`, skills, subagents, hooks and `.github/` change only in their own PR, reviewed by @BerendCheckpt.
- Secrets never enter git. Use `.env`, which is gitignored. Copy `.env.example`.

## Critical issues (create-issue skill: `--label critical --assignee BerendCheckpt`)
1. A new feature. 2. A divergence from the chosen frameworks. 3. New node modules compared with `main`.

## Conventions
- CommonJS, `'use strict'`, and the `node:` prefix for every built-in. Use W3.CSS classes before writing custom CSS. No inline scripts or styles (the CSP blocks them).

## Definition of done
`npm run check`, `npm test` and `npm run test:e2e` pass. New behaviour has tests. `docs/` is updated (docs-maintainer subagent). The PR has been opened with the `write-pr` skill.

## Known mistakes
- "Wiki" was read as something other than the GitHub Wiki more than once. See **Terminology**.
- Branch protection was configured for a team and blocked every merge. See **Repo context**.
- A `.gitignore` pattern without a leading `/` (`build/`) ignored `content/stages/build/`. Anchor patterns for root folders (`/build/`). `tests/unit/content-tracked.test.js` guards this.
- (Add a correction here when a mistake happens twice; promote it to a hook if it keeps happening.)
