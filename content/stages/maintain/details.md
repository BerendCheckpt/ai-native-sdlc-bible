Claude runs autonomously and headless. Based on the output of each stage, the system decides whether Claude continues on its own or escalates to a human. Triggers invoke Claude directly, Claude diagnoses and acts only through gated routes, it writes its findings into `intent.md`, and people review the work.

### Prerequisites

- `intent.md`, which gives the loop a structured output to restart from.
- Claude already involved in PR reviews, hooks as the action boundary, and a rollback path in CI/CD.
- A detection script that can query a metrics source.
- Read access to the repository for the agent.
- The ability to run Claude non-interactively in CI, or through the Agent SDK with webhooks.

### Steps

1. **Pick a metric** with a stable rolling baseline, such as the CI test failure rate or the post-deploy 5xx rate.
2. **Write a detection script**, for example based on the mean and standard deviation. It is version-controlled and unit-tested. It is deterministic, so no model is involved.
3. **Define response tiers** in `bands.md`:
   - At 1σ, the anomaly is logged.
   - At 2σ, Claude is invoked read-only to diagnose.
   - At 3σ, Claude opens a PR through the review gate or triggers a pre-approved runbook.
4. **Use any trigger layer you like.** Claude runs stateless, either non-interactively on a CI runner or through the Agent SDK in a sandboxed container.
5. **Write the diagnosis into `intent.md`.** The agent covers the anomalies and their evidence, a proposed outcome, the affected systems, and open questions. The finding then goes through the pipeline.
6. **Triage.** The service owner or on-call engineer triages the queue and routes product-facing findings to the product owner, who decides to fix now, schedule or dismiss. Dismissals are used to tune the bands and reduce noise.
7. **Close the loop.** When a fix ships, also create a matching eval.

For Claude on call, create Claude hooks for ticket systems and channels.
