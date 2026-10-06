---
name: write-tests
description: Required procedure for writing tests for a new feature or a bug fix in this repository (node:test unit tests and Playwright browser tests). Use whenever a feature is implemented or a bug is fixed.
---

# write-tests (Stage 4: Test)

This skill is required. Every new feature ships with tests, and every bug fix starts with a failing test.

## Procedure

1. **Unit tests** go in `tests/unit/`, `tests/hooks/` or `tests/scripts/` as `*.test.js`, using `node:test` and `node:assert/strict`. No other test libraries.
2. **Browser tests** go in `tests/e2e/*.spec.js`, using `@playwright/test`. They run at desktop width and at 375px phone width.
3. For a bug fix, write the failing test first, run it, and show that it fails before you fix the code.
4. Keep tests deterministic: no retries, no network calls in unit tests, no sleeps. Use in-memory SQLite (`:memory:`) and fake contexts for hooks.
5. Run `npm test` and `npm run test:e2e`. Both must exit 0.

## Committing tests

- New test files for a new feature may be written freely.
- **Before committing any change under `tests/`, ask the human engineer for approval.** `.claude/hooks/guard-git.js` pauses every such commit. Explain what changed in the tests and why, especially when an existing assertion was changed or removed.
- Never weaken an assertion to make a failing check pass. Fix the code or escalate.
