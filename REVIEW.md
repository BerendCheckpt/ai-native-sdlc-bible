# REVIEW.md: pull request review policy

Every pull request gets the same review passes, with findings ranked by severity. Deterministic checks run first in CI. Reviewers, human or AI, focus on what the checks cannot see.

## Gates (all required before merge)

1. **CI is green:** the `unit`, `e2e`, `frameworks`, `deps` and `pr-policy` checks.
2. **Human approval:** @BerendCheckpt (code owner) approves. An approval goes stale when new commits are pushed.
3. **Critical issues acknowledged:** new features, framework divergence and new node modules each have a linked critical issue. New node modules carry the `deps-approved` label, which only a human may set.

## Severity

| Severity | Meaning | Examples |
| --- | --- | --- |
| Blocker | Must be fixed before merge | Security issue, data loss, governance bypass, broken page, unapproved dependency or framework |
| Major | Should be fixed before merge | Missing tests for new behaviour, a weakened test, an unclear justification, an accessibility regression |
| Minor | Can be fixed later with an issue | Naming, small duplication, wording in docs |

## Review checklist

- **Justification:** does it explain why, the alternatives and the remaining risks? Does it link the `work/<id>/` intent, spec and plan?
- **Plan fidelity:** does the diff match `plan.md`? Are deviations explained?
- **Stack:** Node built-ins only, W3.CSS and W3.JS, `node:sqlite`, no inline scripts or styles.
- **Security:** no secrets, all output HTML-escaped, static file paths confined to `public/`, CSP intact.
- **Tests:** new behaviour is covered. Changes to existing tests were approved by the engineer, and no assertion was weakened.
- **Content ownership:** `content/` changed only by humans.
- **Governance changes** (`CLAUDE.md`, `REVIEW.md`, `.claude/`, `.github/`, `scripts/lib/policy.js`): in their own PR, with the reason for each rule change.
- **Docs:** `docs/` reflects the change.

## Feedback loop

Comment with `@claude` to give the agent feedback in the PR. When the same finding appears twice, add a correction to `CLAUDE.md` in a governance PR. When it keeps appearing, turn it into a hook or a CI check.
