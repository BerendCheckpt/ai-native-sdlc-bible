---
title: Introduction
---
## The core idea

In the traditional SDLC, humans can become the bottleneck: agents write code fast, but human gates, reviews and handoffs slow everything down.

In the AI-native SDLC, the process becomes a loop with AI built into it.

**Agents do the work.** They:

- turn ideas into intents and specs,
- plan and implement changes,
- write and run tests,
- review PRs,
- monitor production and diagnose anomalies.

**Humans steer.** They:

- define the intent,
- encode standards in `CLAUDE.md`, required skills and hooks,
- approve at the gates that matter,
- review regulated and critical code,
- triage what agents escalate.

Every stage ends in a committed artifact, so the git history serves as both the record of the work and the trigger for the next stage.

The relationship between human and agents follows the same pattern at every stage:

```
Human sets intent → Agent drafts artifact → Human approves at gate
       ↑                                              ↓
Human triages ← Agent escalates ← Agent executes within hooks & verifies its own work
```

The engineer's role shifts from writing code to orchestrating agents. They run parallel sessions, delegate recurring jobs to subagents, and build the feedback and monitoring loops that keep agents on track.

## Overview of Claude files

Each stage commits one artifact, and a set of supporting files feeds it. `CLAUDE.md` provides context to every session, and hooks enforce rules at every stage. Skills are required procedures: when a skill exists for a task, Claude must use it, and hooks verify that its output complies. The incident record from the last stage loops back into a new `intent.md`.

| Stage | Committed artifact | Supporting files |
| --- | --- | --- |
| 1. Plan | `intent.md` | `write-intent` skill |
| 2. Design | `spec.md` | `write-spec` skill and policy skills (brand, security, compliance, UX) |
| 3. Build | `plan.md` | `CLAUDE.md`, `write-plan` skill, subagents in `.claude/agents/` |
| 4. Test | the diff and its tests | `evals/` suite, test commands in `CLAUDE.md` |
| 5. Deploy | the PR with its review findings | `REVIEW.md`, hooks in `.claude/settings.json` |
| 6. Maintain | the incident record | `ops/bands.md`, detection scripts, runbooks |

## The stages

| Stage | AI-native SDLC |
| --- | --- |
| Plan | Pain points are synthesized straight from the source and captured in `intent.md`, which humans can read and machines can execute |
| Design | Requirements and design happen in one agent session, guided by standards encoded in required skills and versioned in git |
| Build | AI writes the tests and code. Institutional knowledge is kept as versioned, machine-readable `CLAUDE.md` files and skills |
| Test | Evaluation runs continuously throughout implementation |
| Deploy | Several layers of agentic review run on every PR. Humans review regulated and critical code. Governance comes from required skills plus hooks at every gate |
| Maintain | Agents monitor live deployments. A breached control is diagnosed and written back into the loop as `intent.md` |

After each stage, an artifact is committed to version control: `intent.md`, `spec.md`, `plan.md`, the diff and tests, the PR with its review findings, and the incident record. These artifacts trigger each other:

- `intent.md` starts the requirements and design pass.
- An approved `spec.md` starts plan mode.
- A merged PR starts the pipeline.
- A breached control writes the next `intent.md`, and the loop continues.
