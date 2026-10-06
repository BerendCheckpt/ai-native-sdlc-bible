---
title: Recommended directory structure
nav: Structure
order: 4
---
# Recommended directory structure

Several locations are fixed: `CLAUDE.md` and `REVIEW.md` in the repo root, skills in `.claude/skills/<name>/`, subagents in `.claude/agents/`, hooks in `.claude/settings.json`, and non-negotiable hooks in managed settings. The rest of the layout is a suggestion. It keeps the artifacts for each change together, so the git history of one folder tells the whole story from intent to merge.

```
repo-root/
├── CLAUDE.md                     # context: architecture, conventions, commands, mistakes, definition of done (< 1 page)
├── REVIEW.md                     # PR review policy derived from QA requirements
├── .claude/
│   ├── settings.json             # hooks + permission settings (team-shared, version-controlled)
│   ├── hooks/                    # small, specific scripts called by hooks; blocks explain themselves
│   ├── skills/
│   │   ├── write-intent/SKILL.md      # Stage 1: problem → intent.md
│   │   ├── write-spec/SKILL.md        # Stage 2: intent → spec with flagged concerns
│   │   ├── security-policy/SKILL.md   # org standards: brand, security, compliance, UX
│   │   └── <name>/SKILL.md            # frontmatter = trigger, body = required procedure
│   └── agents/
│       ├── test-writer.md        # recurring jobs as subagents
│       └── incident-diagnoser.md # read-only diagnosis at 2σ
├── work/                         # one folder per change = the audit trail
│   └── <ticket-id>-<slug>/
│       ├── intent.md             # Stage 1 (commit = author + timestamp)
│       ├── spec.md               # Stage 2 (merged via PR = acceptance)
│       └── plan.md               # Stage 3 (diff is checked against it)
├── evals/
│   ├── tasks/                    # 20–50 real tasks with acceptable conditions
│   └── regressions/              # one eval per production incident
├── ops/
│   ├── bands.md                  # response tiers: 1σ log, 2σ diagnose, 3σ PR/runbook
│   ├── detection/                # deterministic detection script (no model) + unit tests
│   ├── runbooks/                 # pre-approved runbooks, incl. one-line rollback
│   └── incidents/                # incident records that feed the next intent.md
├── .github/workflows/            # CI, eval runs, sandboxed headless Claude (claude -p)
├── src/
└── tests/
```

Admins deploy managed settings, including the non-negotiable hooks, outside the repo, so they don't appear in this tree. For larger codebases, you can add `CLAUDE.md` files in subdirectories with context specific to that module.
