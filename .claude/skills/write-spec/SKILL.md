---
name: write-spec
description: Required procedure for writing work/<id>/spec.md from an accepted intent.md. Use whenever an intent has been accepted and requirements or a design are needed.
---

# write-spec (Stage 2: Design)

This skill is required. Every accepted intent gets its spec through this procedure. The required headings are checked by `.claude/hooks/require-skill.js` and in CI.

## Procedure

1. Read `work/<id>/intent.md`, `CLAUDE.md` and the stack constraints: Node.js, HTML/CSS/JavaScript with W3.CSS and W3.JS, and SQLite through `node:sqlite`.
2. Write the requirements as testable statements. Each requirement points back to a line in the intent.
3. Describe the design in terms of the existing modules (`src/`, `scripts/`, `content/`). Name the files that change.
4. Flag every concern explicitly under `## Flagged concerns`, especially:
   - anything that would diverge from the chosen frameworks (critical issue),
   - any new node module (critical issue),
   - security, privacy or accessibility risks.
5. Commit the spec on the feature branch and open a PR with the `write-pr` skill. Merging the PR is the acceptance.

## Required headings

- `# Spec`
- `## Requirements`
- `## Design`
- `## Constraints`
- `## Flagged concerns`
- `## Test approach`

## Rules

- Never resolve a flagged concern yourself. The product owner and the policy owner resolve them.
- Keep the spec in sync with the intent. If the scope changes, update the intent in the same PR.
