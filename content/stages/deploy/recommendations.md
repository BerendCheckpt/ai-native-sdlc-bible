### Best practices

- Require a human review and approval for every merge to the main branch. The agent writes the code and the human approves it.
- Ask the agent to put a justification in every PR it opens: why the change is needed, what alternatives were considered, and which risks remain.
- Treat changes to `CLAUDE.md`, skills, subagents and hooks as governance changes: they get their own PR and a code-owner review.
- Make every hook block explain itself, so the agent can correct course without a human.

### Governance

| Step | Governance consideration |
| --- | --- |
| PR review | The agent writes code and a human approves it. The review policy in `REVIEW.md` applies to all PRs. Findings, fixes, ratings and approvals are logged in the PR, which makes the PR the audit record |
| Approval gates | Hooks act as approval gates, and the gate condition is always enforced. Decisions are logged with a timestamp, and you have to decide explicitly what counts as approval |

### Security

| Area | Security consideration |
| --- | --- |
| Permissions | Permission settings are version-controlled in the repo, and each environment has its own permission tier. Start with read-only steps, and add write steps only behind existing gates |
| Release protection | Branch protection is in place, and a production deploy hook blocks release until approval. Humans review regulated and critical code |
| Tool access | Deployment tooling is exposed to the agent through MCP. Whether this should be managed MCP with permissions or gateways is still an open question |

### Deterministic first

- Run the deterministic gates first: tests, framework and dependency checks, and secret scanning. Run the AI review only on PRs that pass them.
- Put review rules that can be checked mechanically, such as a required justification section or forbidden dependencies, in a CI script instead of in `REVIEW.md`.
- Give a separate bot account to the agent, so that branch protection can tell the author and the approver apart.
