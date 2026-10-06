# Testing

Two test layers, both deterministic and both exiting non-zero on failure.

| Layer | Tool | Location | Command |
| --- | --- | --- | --- |
| Unit, hooks and scripts | `node:test` + `node:assert/strict` (built in, no dependencies) | `tests/unit/`, `tests/hooks/`, `tests/scripts/` | `npm test` |
| Browser | Playwright (`@playwright/test`, the only dev dependency) | `tests/e2e/` | `npm run test:e2e` |

## Why this combination

- `node:test` needs no npm module, which fits the rule that new node modules are a critical issue, and it runs fast and cheaply in CI.
- Playwright covers what unit tests can't: the W3.CSS layout at 375px, the W3.JS interactions and the visualization. It starts its own server on port 3100 with a separate `data/e2e.db`.

## Conventions

- Use an in-memory database (`openDb(':memory:')`) and seed it from the real `content/`, so content errors fail the tests.
- Hooks export a pure `evaluate()` function that is tested with a fake git/gh context (`tests/hooks/helpers.js`). One test runs a hook as a real process to check its JSON output.
- No retries (`retries: 0`), no sleeps, and no network calls in unit tests.
- Fake secrets in tests are assembled at runtime, so the secret scanner never flags the test files.

## Policy

Claude writes tests for every new feature (the `write-tests` skill). Every commit that changes `tests/` is paused by a hook until the human engineer approves it.
