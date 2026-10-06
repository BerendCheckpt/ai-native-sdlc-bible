# AI-Native SDLC Bible

A website and wiki about the AI-native software development lifecycle. It covers the six stages, the responsibilities of agents and human engineers, security considerations, deterministic and cost-efficient use of agents, and research suggestions.

Agents do the work, humans steer. This repository practices what it describes: Claude works through required skills, hooks enforce the rules, and a human engineer approves every merge to `main`.

## Quick start

```bash
npm install
npm run seed
npm start
```

Then open http://127.0.0.1:3000. Node.js 24 or newer is required.

| Command | What it does |
| --- | --- |
| `npm run seed` | Rebuilds `data/bible.db` from `content/` |
| `npm start` | Serves the site on port 3000 (override with `.env`) |
| `npm test` | Unit, hook and script tests (`node:test`) |
| `npm run test:e2e` | Browser tests (Playwright, desktop and 375px) |
| `npm run check` | Framework, artifact and dependency policy checks |
| `npm run wiki` | Generates the wiki pages in `build/wiki/` |

## Where things live

- `content/`: the best practices, maintained by human engineers. The same Markdown feeds the website and the GitHub wiki.
- `src/`: server, rendering and SQLite access (Node built-ins only).
- `public/`: CSS and JS on top of W3.CSS and W3.JS.
- `.claude/`: settings, hooks, required skills and subagents for Claude Code.
- `work/`: one folder per change, holding its `intent.md`, `spec.md` and `plan.md`.
- `docs/`: developer documentation, maintained by Claude.

See [docs/setup.md](docs/setup.md) for the one-time repository setup, [docs/governance.md](docs/governance.md) for the rules and how they are enforced, and [docs/contributing.md](docs/contributing.md) for editing content.
