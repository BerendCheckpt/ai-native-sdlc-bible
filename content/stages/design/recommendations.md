### Best practices

- Encode brand, security, compliance and UX standards as skills, each with an owner and a source of truth. They are required inputs for every spec.
- Make Claude list its concerns explicitly in a fixed section of the spec, so reviewers never have to dig for them.
- Merge the spec through a PR. The approval is then recorded with a name and a timestamp.

### Governance

Policy is applied while the spec is written, and skills act as constraints. Everything is logged in version control. The product owner signs off, and flagged concerns go to the policy owner or owners.

### Deterministic first

- Check the required spec headings, such as requirements, design, constraints and flagged concerns, with a script in CI.
- Keep policy rules that can be expressed as data, such as approved colours, licence lists or data classifications, in machine-readable files that a script checks. Leave only the judgement calls to the model.

### Measuring this stage

| Leading indicator | Lagging indicator |
| --- | --- |
| Git timestamps of intent and spec compared with the old requirements/design cycle | Number of `spec.md` commits dated after the first plan commit |
