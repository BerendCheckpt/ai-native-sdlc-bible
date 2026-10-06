---
name: write-plan
description: Required procedure for committing the approved implementation plan as work/<id>/plan.md after a plan-mode session. Use whenever an approved spec is about to be implemented.
---

# write-plan (Stage 3: Build)

This skill is required. Implementation starts only after the approved plan is committed as `plan.md`. The eventual diff is reviewed against it.

## Procedure

1. Work in plan mode. Read the intent, the spec and `CLAUDE.md` without changing anything.
2. Let the engineer question the plan: breaking changes, risky steps and options left out.
3. Iterate until another engineer could follow the plan.
4. Write `plan.md` with the required headings, and commit it before writing any code.

## Required headings

- `# Plan`
- `## Files to change`
- `## Order of work`
- `## Tests`
- `## Risks`

## Rules

- List every file you expect to touch. If implementation needs a file that isn't listed, update `plan.md` in the same branch and say so in the PR justification.
- New features need new tests (`write-tests` skill). Changes to existing tests need the engineer's approval before they are committed.
