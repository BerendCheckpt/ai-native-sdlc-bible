### Give Claude a feedback loop so it can verify its own work

Sessions check their own work first by running the tests and the build and taking a screenshot of the result, and Claude iterates until all checks pass. The engineer's job is to set up these feedback loops.

1. Create tests that exit with a non-zero code on failure.
2. Put the commands, and what a passing result looks like, in `CLAUDE.md`.
3. Make the target explicit.
4. For bug fixes, write the failing test first.
5. For UI work, provide visual tools.
6. Make verification part of the definition of done in `CLAUDE.md`.
7. Prevent the loop from breaking protected parts of the codebase.

### Continuous evals in CI

A live suite evaluates tasks regardless of which model or prompt is used.

1. Collect 20–50 real, recent tasks with their positive outcomes.
2. Write each task as an eval by describing the acceptable conditions.
3. Run the suite on a schedule or whenever `CLAUDE.md` changes.
4. Use the results to gate changes.
5. When a production incident happens, the responsible team writes an eval for it, and the eval becomes a regression test in the live suite.

### Who does what

| Role | Responsibility |
| --- | --- |
| Claude | Writes tests for new features, runs them, and iterates until they pass |
| Engineer (human) | Builds the feedback loops, approves changes to existing tests, and owns the eval suite |
| Responsible team (human) | Writes a regression eval for every production incident |
