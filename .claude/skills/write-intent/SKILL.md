---
name: write-intent
description: Required procedure for turning a new idea, problem or Stage 6 finding into work/<id>/intent.md. Use whenever someone describes a problem, proposes a feature or asks to capture an idea.
---

# write-intent (Stage 1: Plan)

This skill is required. Every new idea becomes an `intent.md` through this procedure. `.claude/hooks/require-skill.js` and `scripts/check-artifacts.js` reject an intent that misses a required heading.

## Procedure

1. Ask analyst-style questions until the idea is concrete: what can't be done today, who is affected, what "better" means, what is out of scope, and how success is measured. Ask one question at a time, and stop when every heading below can be filled.
2. Pick the folder `work/<issue-number>-<slug>/`. If no issue exists yet, create one first with the `create-issue` skill. A new feature is always a critical issue.
3. Write `intent.md` with exactly the required headings below, in that order.
4. Show the draft to the originator and correct any misunderstandings.
5. Commit the intent on the approved feature branch. The commit records the author and timestamp.

## Required headings

- `# Intent`
- `## Problem`
- `## Who is affected`
- `## What better means`
- `## Out of scope`
- `## Success criteria`
- `## Open questions`

## Rules

- Write for both humans and machines: short sentences, one fact per bullet.
- Don't propose a solution here. Solutions belong in `spec.md`.
- If the intent comes from a Stage 6 diagnosis, add the anomaly evidence under `## Problem`.
