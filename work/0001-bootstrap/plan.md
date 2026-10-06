# Plan

## Files to change

- Content: `content/home/{intro,dynamics}.md`, `content/stages/<slug>/{stage,details,recommendations,research}.md` for the six stages, and `content/pages/{roles,security,efficiency,structure}.md`.
- Source: `src/{content,markdown,dynamics,db,router,views,server}.js`, `src/views/*.html`, `db/schema.sql`, `public/{css/site.css,js/site.js,favicon.svg}`.
- Scripts: `scripts/{seed,build-wiki,check-frameworks,check-deps,check-artifacts,check-pr}.js`, `scripts/lib/policy.js`, `scripts/setup-branch-protection.ps1`.
- Governance: `CLAUDE.md`, `REVIEW.md`, `.claude/settings.json`, `.claude/hooks/*.js`, `.claude/skills/*/SKILL.md`, `.claude/agents/*.md`, `.github/**`.
- Tests: `tests/unit/*`, `tests/hooks/*`, `tests/scripts/*`, `tests/e2e/site.spec.js`, `playwright.config.js`.
- Docs: `README.md`, `docs/*.md`. Config: `package.json`, `.gitignore`, `.env.example`.

## Order of work

1. Content from the course notes, with skills described as required.
2. The rendering pipeline: Markdown → SQLite → server and templates → CSS and JS.
3. The wiki build.
4. The policy module, the hooks, the CI checks and the workflows.
5. Skills, subagents, `CLAUDE.md` and `REVIEW.md`.
6. Tests, then the docs.

## Tests

- `npm test` covers the units, the hooks and the scripts.
- `npm run test:e2e` covers the browser at desktop and 375px widths.
- `npm run check` covers frameworks, artifacts and dependencies.

## Risks

- Node and gh were not installed on the machine that authored the bootstrap, so the first test run happens after installation. Failures are fixed on the same branch.
- Hooks fail open when Node is missing (a non-zero hook exit is non-blocking). Branch protection and CI remain the backstop.
- The `deps` check fails on this PR by design until `deps-approved` is set.
