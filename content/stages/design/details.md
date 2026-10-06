Claude produces a requirements-and-design spec from `intent.md`. The organization's skills for brand, security, compliance and UX constrain the spec, and Claude flags areas of concern. The product owner reviews the spec, and engineers then plan against it.

### Steps

1. **Open a session** with the skills and `intent.md`.
2. **Point Claude to the intent** and its constraints, and ask it to flag concerns using the required `write-spec` skill. Accepting the intent is a merge, and the spec is committed as a PR.
3. **Review the spec** against the original idea.
4. **Resolve the flagged concerns.** The product owner and the policy owner do this together.
5. **Commit the spec and the intent.**
6. **Approve the spec.** Humans approve it, and planning starts.

### Who does what

| Role | Responsibility |
| --- | --- |
| Claude | Drafts `spec.md` within the policy skills and flags concerns |
| Product owner (human) | Reviews the spec against the idea and signs it off |
| Policy owner (human) | Resolves the concerns flagged on brand, security, compliance or UX |
| Engineers (human) | Plan against the approved spec |

### What it triggers

An approved `spec.md` starts plan mode in Stage 3.
