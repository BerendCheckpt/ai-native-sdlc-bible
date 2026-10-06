### Best practices

- Use the `write-intent` skill for every new idea. Skills are required procedures, not suggestions, so every intent has the same structure and can be compared.
- Keep an intent short and concrete: the problem, who is affected, what "better" means, what is out of scope, and the success criteria.
- Give each change its own `work/<ticket-id>-<slug>/` folder, so the git history of one folder tells the whole story from intent to merge.
- Let the originator correct the draft before it is committed. A misunderstanding is cheapest to fix here.

### Governance

The committed `intent.md` is evidence in the git history. The product owner's decision to move an intent into design is recorded as the merge or review.

### Deterministic first

- Let a hook or CI check verify that `intent.md` contains every heading the `write-intent` skill requires. A missing heading is a cheap, deterministic failure instead of an expensive review comment.
- Create the folder and the empty template with a script, not with a model. Spend model tokens on the questions, not on boilerplate.

### Measuring this stage

| Leading indicator | Lagging indicator |
| --- | --- |
| Time from capture to commit, based on timestamps | Share of intents that get accepted, and the number of changes after the first `spec.md` commit |
