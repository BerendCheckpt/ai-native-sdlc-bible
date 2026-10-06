### Best practices

- Start with a single metric that has a stable baseline. Add more only after the bands have been tuned.
- Keep the response tiers in a version-controlled `bands.md`, so every escalation can be traced back to a rule.
- Use dismissals as data: every dismissed finding is a signal to tune the bands and reduce noise.
- Create an eval for every fix that ships from this stage, so the incident can't silently come back.

### Governance

Tier boundaries are enforced from version-controlled config. Invocations, findings and triage decisions are logged with timestamps.

### Security

In this stage Claude acts only through gated routes. At 2σ it diagnoses read-only, and at 3σ it can only open a PR through the review gate or trigger a pre-approved runbook. Rollback must be rehearsed and executable as a single command.

### Deterministic first

- Detection is a script, not a model. Mean and standard deviation over a rolling window costs almost nothing to compute and gives the same answer every time.
- Invoke the model only from 2σ upwards. At 1σ, logging is enough, so most anomalies never cost a token.
- Let the model write a structured `intent.md` with fixed headings, so the next stage can parse the result without another model call.
