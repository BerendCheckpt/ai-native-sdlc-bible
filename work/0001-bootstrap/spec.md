# Spec

## Requirements

1. The home page shows, from top to bottom: six clickable stage cards in loop order, a visualization of the human ↔ Claude loop, and the course-notes introduction (everything before Stage 1).
2. Each stage page (`/stages/<slug>`) shows Details, Recommendations and Future research questions, with prev/next links that loop.
3. Topic pages cover roles, security and governance, efficiency, and the directory structure. Search covers all content.
4. `content/` is the single source for the website and the GitHub wiki, and is maintained by humans.
5. Version-control rules: Claude commits and pulls but never merges to main. A human approves every merge. Tests are generated for features, and test commits need approval. Branches only for approved features. Critical issues tag the engineer. PRs carry a justification. The author is "Jean Claude van Damme". Governance files change via a reviewed PR. Secrets are gitignored.
6. Skills are required procedures, and hooks and CI verify their output.

## Design

- **Server:** `node:http` with server-side templates (`src/views/`). Data comes from SQLite through `node:sqlite` (`src/db.js`).
- **Content pipeline:** `src/content.js` reads `content/` → `src/markdown.js` renders a deterministic Markdown subset → `scripts/seed.js` writes `data/bible.db`.
- **Visualization:** `src/dynamics.js` turns `content/home/dynamics.md` into two inline SVG layouts (wide and tall) at seed time.
- **Wiki:** `scripts/build-wiki.js` generates flat wiki pages. The `wiki-sync` workflow pushes them after a merge to main.
- **Policy:** `scripts/lib/policy.js`, shared by the hooks in `.claude/hooks/` and the CI scripts in `scripts/check-*.js`.

## Constraints

- Node.js 24+, built-ins only at runtime. HTML/CSS/JavaScript with W3.CSS and W3.JS. SQLite.
- A strict CSP, so there are no inline scripts or styles.
- Layout works at 375px width without horizontal scrolling, and in light and dark mode.

## Flagged concerns

- **Critical (new node module):** `@playwright/test` is added as a dev dependency for browser tests. It needs the `deps-approved` label.
- **Critical (new feature):** this whole bootstrap is a new feature and needs the `approved` label on its issue.
- W3.CSS and W3.JS come from the w3schools CDN without subresource integrity. Vendoring them is listed as a research question.
- GitHub cannot restrict who sets labels. The `approved` label is protected only by a Claude hook, so a non-Claude actor with write access could set it.

## Test approach

- **node:test:** the Markdown renderer, content loading, the SQLite layer, the router, the HTTP server (including security headers and path traversal), the dynamics SVG, every hook and every policy script.
- **Playwright:** stage cards and navigation, the loop visualization and the toggle, the intro order, topic pages, search, and horizontal overflow at desktop and 375px widths.
