---
name: create-issue
description: Required procedure for creating GitHub issues in this repository, including the rules for critical issues. Use whenever Claude is about to run gh issue create or finds a problem worth tracking.
---

# create-issue

This skill is required. Claude may create issues, and always tags the engineer on critical issues. `.claude/hooks/guard-gh.js` blocks critical issues that don't assign or mention the engineer.

## What is critical

An issue is **critical** when it is about:

1. **a new feature**,
2. **code or changes that may diverge from the chosen frameworks**: Node.js, HTML/CSS/JavaScript with W3.CSS and W3.JS, and SQLite,
3. **new node modules** compared with the `main` branch.

## Procedure

1. Search first to avoid duplicates: `gh issue list --search "<keywords>"`.
2. Pick the template that fits: feature, critical or bug (`.github/ISSUE_TEMPLATE/`).
3. For critical issues, add `--label critical --assignee BerendCheckpt` and mention `@BerendCheckpt` in the body. A new feature also gets `--label feature --label needs-approval`.
4. Write the body with these headings:
   - `## Summary`
   - `## Why it matters`
   - `## Proposed next step`
5. Create it: `gh issue create --title "<title>" --body-file <file> [--label ...] [--assignee ...]`.

## Rules

- Never add the `approved` or `deps-approved` labels. Only a human engineer sets them.
- A feature branch can only be created after a human adds `approved` to the issue.
