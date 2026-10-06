### Best practices

- Let Claude generate tests for every new feature, but require a human to approve every commit that changes existing tests. Otherwise a failing check can be "fixed" by weakening the test.
- Write the failing test first for every bug fix, so the fix is proven.
- Keep test commands and the expected output in `CLAUDE.md`, so every session verifies the same way.
- For UI work, run browser tests at both desktop and phone widths, and check for horizontal scrolling.

### Security

The feedback loop must not be able to break protected parts of the codebase. Protect test fixtures, governance files and secrets with hooks, not with instructions.

### Deterministic first

- Run cheap deterministic checks first: format, lint, unit tests and policy scripts. Start model-based evals only when those pass.
- Keep tests deterministic: no retries to hide flakiness, no network calls in unit tests, and fixed seeds and clocks.
- Rerun the eval suite only when its inputs change, such as `CLAUDE.md`, the skills or the model version, instead of on every commit.

### Example from this repository

This site uses Node's built-in `node:test` runner for unit tests of the server, the database, the Markdown renderer, the hooks and the policy scripts. It uses Playwright for browser tests of the W3.CSS interface. Both exit non-zero on failure.
