---
title: Efficient and deterministic use of agents
nav: Efficiency
order: 3
---
# Efficient and deterministic use of agents

The aim is to automate as deterministically as possible. A deterministic step is reproducible, cheap to run and easy to audit. A model call is powerful, but it costs compute, varies between runs and needs verification. Use the model where judgement is needed, and nowhere else.

## Important considerations

- Because the model is non-deterministic, its risks must be actively reduced to guarantee quality and safety.
- Results must not only meet the requirements. They must also be reproducible, and mistakes must not be repeated.
- That is why design patterns and techniques should be fixed in a deterministic layer, such as hooks.
- This prevents inefficient use of resources and reduces risks for safety and technical debt.
- It also lets the team examine where natural language processing (NLP) is really needed, and where current NLP integrations can be replaced by a deterministic flow or algorithm.
- Heuristics can also be translated into how we as humans would reason.

## The control ladder

Choose the lowest rung that solves the problem.

| Rung | Control | Cost per run | Use when |
| --- | --- | --- | --- |
| 1 | Script, linter or CI check | Close to zero | The rule can be stated precisely |
| 2 | Hook | Close to zero | The rule must hold for every agent action |
| 3 | Required skill | Tokens to load the procedure | The task needs a fixed procedure plus judgement |
| 4 | Subagent | A separate, smaller context | A recurring job that needs judgement |
| 5 | Full agent session | The most tokens | New, open-ended work |

## Recommendations

- **Script the boilerplate.** Folder structures, templates and file names come from scripts, not from a model.
- **Check structure deterministically.** Every artifact a skill produces has required headings, and a hook or CI check verifies them.
- **Gate the model behind cheap checks.** Run tests, linters and policy scripts first, and start AI review only on changes that pass.
- **Invoke the model by threshold.** In Stage 6, a 1σ anomaly is only logged, so most anomalies never cost a token.
- **Narrow the context.** Give subagents a single job and a short tool list. Less context means lower cost and more predictable output.
- **Promote repeated mistakes.** A mistake made twice becomes a correction in `CLAUDE.md`. A correction that keeps being needed becomes a hook.
- **Avoid unnecessary dependencies.** Every new module is code nobody here wrote, which is why new node modules are raised as critical issues.

## Research suggestions

- Measure the token cost per stage, and find the stages where a deterministic replacement would save the most.
- Inventory current NLP integrations and classify each as *needs a model*, *partly deterministic* or *fully deterministic*.
- Compare the defect rates of rules enforced by hooks with the same rules written only in `CLAUDE.md`.
- Investigate how human heuristics, such as how an experienced reviewer triages a PR, can be written down as deterministic rules.
