### AI in the PR review loop

Every PR gets the same set of review passes, with findings ranked by severity. The engineer validates the changes and weighs the risks.

1. Run Claude Code Review.
2. Put `REVIEW.md` in the repo root, with the policy derived from your QA requirements.
3. The tech lead decides on protection rules and the necessary human involvement.
4. Use `@claude` tags in review comments to give feedback to the AI.
5. Feed review findings back into `CLAUDE.md`.

### Hooks and approval gates

Hooks used as guardrails can pass or block actions, or pause them until further approval.

1. List the approval gates that must be kept.
2. Turn each gate into a hook plus a script.
3. Put the hooks in `.claude/settings.json`. Non-negotiable hooks go in managed settings.
4. Make every block explain itself.

### CI/CD integration and deployment

In a pipeline, Claude runs in an isolated sandbox. Deployment tooling is exposed to the agent through MCP, so the workflow behind a change can ship or roll back within the gates of each environment. The prerequisite is that `claude-code-action` is installed.

1. Start with read-only judgement steps using `claude -p`.
2. Add write steps only behind existing gates.
3. Tier autonomy per environment.
4. Rehearse rollback often, and keep it to a single, simple command.

### Who does what

| Role | Responsibility |
| --- | --- |
| Claude | Opens the PR with a justification, runs review passes and ranks findings by severity |
| Engineer (human) | Validates the changes, weighs the risks and approves the merge |
| Tech lead (human) | Decides the protection rules and where humans must be involved |
