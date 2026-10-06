### Best practices

- Start every change in plan mode, and commit the approved `plan.md` before Claude writes code.
- Keep `CLAUDE.md` under a page. Move module-specific context into `CLAUDE.md` files in subdirectories.
- Escalate a repeated mistake one step at a time. The first time, fix it. The second time, add a correction to `CLAUDE.md`. If it keeps happening, turn the correction into a hook.
- Treat skills as required procedures with an owner. Back every skill that produces an artifact with a hook or CI check that verifies its structure.
- Change `CLAUDE.md`, skills, subagents and hooks only through a pull request that a human engineer reviews and approves.

### Governance

| Step | Governance consideration |
| --- | --- |
| Plan mode | Plan mode enforces that design review happens before coding, so Claude can't start coding before approval. Plans and their revisions are logged as commits |
| `CLAUDE.md` | Changes to the file are logged and audited, and team discussions feed into it |
| Skills | Skills are required and reduce mistakes. Skill invocations can be logged, and hooks verify that the skill's output complies |
| Parallel sessions | More sessions means more output, so the controls must come from configuration in the repo, namely hooks and permission settings |

### Security

- **Deterministic guardrails:** hooks block edits to protected files and keep credentials out of the diff.
- **Isolation:** each parallel session works in its own worktree.

### Deterministic first

- Prefer a hook, a linter or a script whenever a rule can be stated precisely. They are free to run, give the same answer every time and never forget.
- Use the model only where judgement is needed: interpreting a spec, choosing a design, or writing code nobody has written before.
- Give recurring jobs to a subagent with a narrow tool list. A smaller context costs fewer tokens and gives more predictable results.

### Measuring this stage

| Step | Leading indicator | Lagging indicator |
| --- | --- | --- |
| Plan mode | Share of changes that merge from the first implementation pass, and time between approval and merged PR | Number of rework cycles, and how often the merged diff matches the committed `plan.md` |
| `CLAUDE.md` | Mistakes that get caught | Caught mistakes that are not repeated |
