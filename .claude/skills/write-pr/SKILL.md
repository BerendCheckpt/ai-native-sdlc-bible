---
name: write-pr
description: Required procedure for opening a pull request in this repository, including the justification section. Use whenever Claude is about to run gh pr create.
---

# write-pr (Stage 5: Deploy)

This skill is required. Claude justifies every pull request it opens. `.claude/hooks/guard-gh.js` blocks `gh pr create` without a non-empty `## Justification` section, and the `pr-policy` CI job checks it again.

## Procedure

1. Make sure `npm run check`, `npm test` and `npm run test:e2e` pass on the branch.
2. Push the feature branch: `git push -u origin feature/<issue>-<slug>`. Never push to `main`.
3. Write the description with the headings from `.github/pull_request_template.md`:
   - `## Summary`: what changes, in two or three sentences.
   - `## Justification`: why the change is needed, the alternatives you considered and why you rejected them, and the risks that remain. Link the intent, spec and plan in `work/<id>/`.
   - `## Critical issues`: new features, framework divergence or new node modules, each with its issue link. Write "None" if there are none.
   - `## Tests`: what was added or changed. Changes to existing tests were approved by the engineer.
   - `## Checklist`.
4. Create the PR with `gh pr create --base main --title "<title>" --body-file <file>`.
5. Governance files (`CLAUDE.md`, `REVIEW.md`, `.claude/skills/`, `.claude/agents/`, `.claude/hooks/`, `.claude/settings.json`, `.github/`) go in their own PR. Say so in the summary.

## Rules

- Never merge or approve a PR. A human engineer reviews and approves every merge to `main`.
- Don't use `--fill`.
- Answer review comments in the PR thread, and feed recurring findings back into `CLAUDE.md` through a governance PR.
