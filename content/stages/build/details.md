### Plan mode as the default starting point

Work starts with a generated plan. In plan mode, Claude reads the codebase without changing anything. The engineer lets Claude Code interview them about the approved spec, corrects the plan before any coding, and commits the approved plan as `plan.md`. The prerequisites are the intent or spec artifact and `CLAUDE.md`.

1. Start a plan-mode session.
2. Give Claude the intent and spec, and ask for an implementation plan that names the files to change, the order of work, and the tests that prove it works.
3. Question the plan: look for breaking changes, risky steps, and options Claude left out.
4. Iterate until another engineer could follow the plan.
5. Commit the approved plan. It joins the audit trail, and the eventual diff is checked against it later.
6. Let Claude implement.
7. Consider a hook that keeps the implementation in sync with the plan.

### Auto mode

The engineer iterates on and approves the plan, and Claude applies the changes immediately. This becomes viable once the setup has matured: a tuned `CLAUDE.md`, skills, hooks that reduce risk, and a good test suite.

### Legacy systems

Decide which system is the source of truth. One option is to treat the markdown files as working copies. Otherwise Claude enforces a markdown-first approach. Record the lineage to make the transition easier.

### CLAUDE.md

This file gives Claude the context a new engineer would need: architecture, conventions, commands, known mistakes and descriptions.

1. Run `/init`.
2. Revise the file until it would be enough for a new employee.
3. Check it into the repo root so the whole team shares it.
4. Follow a working rule: if a mistake happens twice, add a correction to the file.
5. Keep it under a page.

### Skills: institutional knowledge as a required procedure

Skills are how an organization makes its institutional knowledge operational. A skill is not advice: when a skill exists for a task, Claude must use it. Each skill needs a policy with an owner and a source of truth.

1. Pick a piece of knowledge that is applied inconsistently.
2. Write a `SKILL.md`. The frontmatter is the trigger and the body is the executor. Declare the required output structure in the body, so it can be checked.
3. Commit it to `.claude/skills/<name>/`.
4. Test whether it triggers across different relevant tasks.
5. Update the skill when the policy changes.
6. Make sure everyone picks up the newest version.

### Hooks: the deterministic layer behind skills

A skill defines the procedure Claude must follow. A hook is the deterministic layer that verifies the procedure was followed and blocks the action when it wasn't. Build-phase hooks can block edits to protected files, run formatters and linters, keep credentials out of the diff, and check that an artifact has the structure its skill requires. Hooks run on every matching action, so they must be small, concrete and specific. Hooks that ask for approval belong with the gates in Stage 5.

### Parallel sessions and subagents

A parallel session is another full Claude Code instance working on a separate task in its own git worktree, and the sessions know nothing about each other. A subagent is a scoped helper inside one session, with its own context, tool limits and single job. With this setup, recurring jobs become subagents, and the engineer becomes an orchestrator who builds monitoring loops.

1. Split tasks where the plan shows the work is independent. Tasks that share a single file are joined into one session.
2. Give each parallel session its own worktree.
3. Keep to the practical ceiling of what one engineer can actually oversee.
4. Turn repeated jobs into markdown files under `.claude/agents/`.
