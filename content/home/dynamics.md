---
title: How Claude and the human engineer work together
---
## Loop

1. **Human** — Sets intent: Describes the problem, who is affected, what "better" means and what is out of scope, captured in `intent.md`.
2. **Claude** — Drafts the artifact: Turns the intent into a spec, a plan or a change, following the required skills and the context in `CLAUDE.md`.
3. **Human** — Approves at the gate: Reviews the artifact at the gates that matter: spec sign-off, plan approval and PR review before anything merges to main.
4. **Claude** — Executes and verifies: Implements within the hooks and permission settings, runs the tests and the build, and iterates until every check passes.
5. **Claude** — Escalates: Stops and hands over when a hook blocks, a check keeps failing, a critical issue appears or a production control is breached.
6. **Human** — Triages: Decides to fix now, schedule or dismiss, and feeds the decision back into a new intent, `CLAUDE.md`, a skill or a hook.

## Humans steer

- Define the intent.
- Encode standards in `CLAUDE.md`, required skills and hooks.
- Approve at the gates that matter.
- Review regulated and critical code.
- Triage what agents escalate.

## Agents do the work

- Turn ideas into intents and specs.
- Plan and implement changes.
- Write and run tests.
- Review PRs.
- Monitor production and diagnose anomalies.
