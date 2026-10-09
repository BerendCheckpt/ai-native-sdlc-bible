# Governance: rules and how they are enforced

Every rule has a deterministic control where possible. Claude Code hooks only bind Claude sessions, so branch protection, CODEOWNERS and CI are the backstop for everyone. All rules are defined once in `scripts/lib/policy.js`.

| Rule | Hook (Claude) | GitHub / CI |
| --- | --- | --- |
| Claude may commit and pull | allowed in `.claude/settings.json` | |
| Merges to `main` need a human review and approval | `guard-git.js` denies push, merge and commit on `main`. `guard-gh.js` denies `gh pr merge` and `gh pr review --approve` | Branch protection with code-owner review (`@BerendCheckpt`) and required checks |
| Claude writes tests for new features | `write-tests` skill, `test-writer` subagent | `unit` and `e2e` checks |
| Ask before committing test changes | `guard-git.js` returns **ask** for every commit that touches `tests/` | Review checklist in `REVIEW.md` |
| Branches only for approved features | `guard-git.js` requires `feature/<issue>-<slug>` and the `approved` label on that issue | |
| Claude may create issues; critical ones tag the engineer | `guard-gh.js` denies critical issues without `--assignee BerendCheckpt` or an `@BerendCheckpt` mention, and denies features without the `critical` label | Issue forms auto-assign and label critical issues |
| Justification in Claude's PRs | `guard-gh.js` denies `gh pr create` without a non-empty `## Justification` | `pr-policy` check |
| Author "Jean Claude van Damme" | `GIT_AUTHOR_NAME` in `.claude/settings.json`, and `guard-git.js` denies `--author` | |
| Claude maintains documentation | `docs-maintainer` subagent, definition of done in `CLAUDE.md` | |
| Governance files go through a reviewed PR | `protect-paths.js` returns **ask** on every edit to `CLAUDE.md`, `REVIEW.md`, `.claude/**` and `.github/**` | CODEOWNERS, plus a `governance` label set by `pr-policy` |
| Best practices are maintained by humans | `protect-paths.js` denies edits to `content/**` | CODEOWNERS on `content/` |
| Sensitive information stays out of git | `protect-paths.js` and permission rules deny access to `.env`, keys and databases. `no-secrets.js` scans the staged diff on commit | `.gitignore` |
| Skills are required | `require-skill.js` denies `work/*/{intent,spec,plan}.md` that miss the headings their skill declares | `check-artifacts.js` in the `unit` check |
| Only humans set approval labels | `guard-gh.js` denies adding `approved` or `deps-approved` | |

## Critical issues

| Trigger | Detection | Action |
| --- | --- | --- |
| New feature | `feature.yml` issue form, `create-issue` skill, `guard-gh.js` | Labelled `critical`, assigned to @BerendCheckpt |
| Divergence from the chosen frameworks | `scripts/check-frameworks.js` (`frameworks` check), `framework-auditor` subagent | CI opens a critical issue tagging @BerendCheckpt |
| New node modules compared with `main` | `scripts/check-deps.js` (`deps` check), `guard-git.js` asks on `npm install <pkg>` | CI opens a critical issue, comments on the PR, and fails until a human adds `deps-approved` |

## Approval model

This repository has **one engineer**, @BerendCheckpt, who is also the only approver.

- Claude's PRs are opened from the bot account, and @BerendCheckpt approves them as the code owner.
- GitHub never lets a PR author approve their own PR. PRs opened from @BerendCheckpt's own account are merged with the admin bypass, which is why "applies to admins" (`enforce_admins`) is off.
- "Approval of the most recent push" is off, because it needs a second person.
- Claude never changes branch protection. The `guard-gh.js` hook blocks it.

## Known limitations

- GitHub can't restrict which users may set a label. The `approved` and `deps-approved` labels are protected from Claude by a hook, not from other people with write access.
- Hooks fail open when Node is not installed.
- W3.CSS and W3.JS load from the w3schools CDN without subresource integrity. See the research question on vendoring.
