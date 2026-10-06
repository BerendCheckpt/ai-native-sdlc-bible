# Architecture

```
content/*.md ──► src/content.js ──┬─► scripts/seed.js ──► data/bible.db ──► src/server.js ──► browser
 (humans edit)                    │      (src/markdown.js, src/dynamics.js)     (src/views/*.html, public/)
                                  └─► scripts/build-wiki.js ──► build/wiki/ ──► GitHub wiki (wiki-sync workflow)
```

## Modules

| Module | Responsibility |
| --- | --- |
| `src/content.js` | Reads `content/`, parses front-matter, validates the stage positions. The only reader of `content/` |
| `src/markdown.js` | Deterministic Markdown subset to HTML, escaped, with safe link schemes and W3.CSS classes on tables and code |
| `src/dynamics.js` | Parses `content/home/dynamics.md` and generates the wide and tall SVG of the human ↔ Claude loop |
| `src/db.js` | `node:sqlite` access: rebuilds the database in one transaction, plus the queries for pages, stages and search |
| `src/router.js` | Pure pathname → route mapping |
| `src/views.js` | `{{escaped}}` / `{{{raw}}}` template filling |
| `src/server.js` | `node:http` server: routes, static files (confined to `public/`), CSP and security headers |

## Routes

| Route | Page |
| --- | --- |
| `/` | Stage cards (loop), human ↔ Claude visualization, introduction |
| `/stages/<slug>` | Stage page: Details, Recommendations, Future research questions, prev/next in a loop |
| `/roles`, `/security`, `/efficiency`, `/structure` | Topic pages from `content/pages/` |
| `/search?q=` | Plain-text search over all content, filterable with W3.JS |

## Database

`db/schema.sql` drops and recreates the tables `stages`, `stage_sections`, `pages`, `blocks` and `search_index` on every seed. The database is a build artifact and is never edited by hand. Search uses `LIKE` over the `search_index` table. The content set is small, and this behaves the same on every SQLite build.

## Frontend

- Every page uses W3.CSS (`w3-bar`, `w3-card`, `w3-panel`, `w3-table-all`, `w3-hide-small` and so on) and W3.JS (`w3.show`, `w3.hide`, `w3.filterHTML`).
- `public/js/site.js` is progressive enhancement: every page works without it.
- `public/css/site.css` holds the colour tokens, with dark mode via `prefers-color-scheme`.
- The CSP allows scripts and styles only from `'self'` and `https://www.w3schools.com`, so there are no inline scripts or `style` attributes.
