---
title: Roles and responsibilities
nav: Roles
order: 1
---
# Roles and responsibilities

In the AI-native SDLC, agents do the work and humans steer. The engineer's role shifts from writing code to orchestrating agents: running parallel sessions, delegating recurring jobs to subagents, and building the feedback and monitoring loops that keep agents on track.

## Agents and humans per stage

| Stage | Agent (Claude) | Human engineer |
| --- | --- | --- |
| [Plan](/stages/plan) | Asks analyst-style questions and drafts `intent.md` with the required skill | Describes the problem, corrects the draft, commits the intent |
| [Design](/stages/design) | Drafts `spec.md` within the policy skills and flags concerns | Product and policy owners resolve concerns and sign off the spec |
| [Build](/stages/build) | Proposes `plan.md` in plan mode, then implements it and writes the tests | Questions and approves the plan, maintains `CLAUDE.md`, skills and hooks |
| [Test](/stages/test) | Runs the tests and the build and iterates until every check passes | Builds the feedback loops, approves changes to existing tests, owns the evals |
| [Deploy](/stages/deploy) | Opens the PR with a justification and runs review passes | Reviews and approves every merge to main, decides on protection rules |
| [Maintain](/stages/maintain) | Diagnoses anomalies from 2σ and writes the finding into `intent.md` | Triages the queue: fix now, schedule or dismiss |

## Kinds of agents

| Kind | What it is | Typical use |
| --- | --- | --- |
| Session | A full Claude Code instance working with an engineer | Planning and implementing one change |
| Parallel session | Another full instance in its own git worktree, unaware of the others | Independent tasks from the same plan |
| Subagent | A scoped helper inside one session, with its own context, tool limits and single job | Recurring jobs such as writing tests or keeping documentation up to date |
| Headless agent | Claude running non-interactively in CI or through the Agent SDK | PR review, diagnosis at 2σ, opening a PR at 3σ |

## What stays human

- Defining the intent and deciding what is out of scope.
- Encoding standards in `CLAUDE.md`, required skills and hooks, and approving every change to them.
- Approving at the gates that matter, including every merge to the main branch.
- Reviewing regulated and critical code.
- Triaging what agents escalate, and maintaining the best practices in this bible.

## Example: rules for the agent in this repository

| Rule | How it is enforced |
| --- | --- |
| Claude may commit and pull, but never merges to main | Branch protection, CODEOWNERS and a hook that blocks pushes and merges to main |
| A human engineer reviews and approves every merge to main | Branch protection with a required code-owner review |
| Claude writes tests for new features, and asks before committing test changes | A hook pauses every commit that touches `tests/` until the human approves |
| Claude creates a feature branch only after a human approved the feature | A hook checks the `approved` label on the feature's issue |
| Claude may create issues, and tags the engineer on critical ones | A hook blocks critical issues without the engineer assigned |
| Claude justifies every pull request it opens | A hook and a CI check require a non-empty `## Justification` section |
| Claude commits as "Jean Claude van Damme" | The git author is set in `.claude/settings.json` |
| Changes to `CLAUDE.md`, skills, subagents and hooks go through a reviewed PR | A hook asks for approval on every edit, and CODEOWNERS requires the engineer's review |
