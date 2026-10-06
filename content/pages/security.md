---
title: Security and governance
nav: Security
order: 2
---
# Security and governance

Because the model is non-deterministic, its risks must be actively reduced. The controls that matter most are deterministic: hooks, permission settings, branch protection and CI checks. Required skills define how work must be done, and hooks verify that it was.

## Security considerations

| Area | Security consideration |
| --- | --- |
| Deterministic guardrails | Hooks block edits to protected files and keep credentials out of the diff. The feedback loop must not be able to break protected parts of the codebase. Non-negotiable hooks live in managed settings, so individual users can't override them |
| Permissions | Permission settings are version-controlled in the repo, and each environment has its own permission tier. Autonomy is tiered per environment: start with read-only steps, and add write steps only behind existing gates |
| Isolation | In pipelines, Claude runs in an isolated sandbox: either non-interactively on a CI runner, or through the Agent SDK in a sandboxed container. Parallel sessions each work in their own worktree |
| Release protection | Branch protection is in place, and a production deploy hook blocks release until approval. Humans review regulated and critical code |
| Tool access | Deployment tooling is exposed to the agent through MCP. Open question: should this be managed MCP with permissions or gateways? |
| Autonomous operation | In Stage 6, Claude acts only through gated routes. At 2σ it diagnoses read-only, and at 3σ it can only open a PR through the review gate or trigger a pre-approved runbook. Rollback must be rehearsed and executable as a single command |
| Secrets | Sensitive files such as `.env`, keys and local databases are listed in `.gitignore`, the agent is denied read access to them, and a hook scans every staged diff for credentials |
| Identity | The agent works under its own account, so branch protection can tell the author and the approver apart |
| Non-determinism | Moving patterns into a deterministic layer reduces the safety risks of a non-deterministic model |

## Governance per stage

| Stage / step | Governance consideration |
| --- | --- |
| Plan | The committed `intent.md` is evidence in the git history. The product owner's decision to move an intent into design is recorded as the merge or review |
| Design | Policy is applied while the spec is written, and skills act as constraints. Everything is logged in version control. The product owner signs off, and flagged concerns go to the policy owner(s) |
| Build (plan mode) | Plan mode enforces that design review happens before coding, so Claude can't start coding before approval. Plans and their revisions are logged as commits |
| Build (`CLAUDE.md`) | Changes to the file are logged and audited, and team discussions feed into it |
| Build (skills) | Skills are required and reduce mistakes. Skill invocations can be logged, and hooks verify that the skill's output complies |
| Build (parallel sessions) | More sessions means more output, so the controls must come from configuration in the repo, namely hooks and permission settings |
| Deploy (PR review) | The agent writes code and a human approves it. The review policy in `REVIEW.md` applies to all PRs. Findings, fixes, ratings and approvals are logged in the PR, which makes the PR the audit record |
| Deploy (approval gates) | Hooks act as approval gates, and the gate condition is always enforced. Decisions are logged with a timestamp, and you have to decide explicitly what counts as approval |
| Maintain | Tier boundaries are enforced from version-controlled config. Invocations, findings and triage decisions are logged with timestamps |

## Critical issues

Some changes always need the engineer's attention. In this repository, the following are raised as critical issues and the engineer is tagged:

- a new feature,
- code or changes that diverge from the chosen frameworks (Node.js, HTML, CSS and JavaScript with W3.CSS and W3.JS, and SQLite),
- new node modules compared with the main branch.
