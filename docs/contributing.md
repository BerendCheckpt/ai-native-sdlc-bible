# Contributing content

Best practices are maintained by human engineers in `content/`. The same Markdown feeds the website and the GitHub wiki, so edit it in one place only: here, through a pull request. Edits made directly in the wiki are overwritten.

## Layout

| File | Shown as |
| --- | --- |
| `content/home/intro.md` | Home page, below the visualization. Wiki: `Home` |
| `content/home/dynamics.md` | The human ↔ Claude loop. Keep the format `1. **Human** — Title: detail`, with an even number of steps |
| `content/stages/<slug>/stage.md` | Front-matter only: `position`, `title`, `artifact`, `summary` |
| `content/stages/<slug>/details.md` | Stage page, Details panel |
| `content/stages/<slug>/recommendations.md` | Stage page, Recommendations panel |
| `content/stages/<slug>/research.md` | Stage page, Future research questions panel |
| `content/pages/<slug>.md` | Topic page at `/<slug>`. Front-matter: `title`, `nav` (menu label), `order` |

## Markdown

Supported: headings (use `###` inside stage sections, because the panel already has a heading), paragraphs, bullet and numbered lists (nested with 3 spaces), tables, fenced code, `**bold**`, `*italic*`, `` `code` `` and links. Link to other pages with site paths such as `/stages/plan` or `/security`. The wiki build rewrites them to wiki page names.

## Preview

```bash
npm run seed
npm start
```

Run `npm run wiki` to see the generated wiki pages in `build/wiki/`. `npm test` fails when a stage misses a section or the loop format is broken.

## Asking Claude for help

Claude can't edit `content/` (a hook blocks it). Ask Claude for a draft instead. It writes the draft to `work/<issue>-<slug>/drafts/` (the `new-content-section` skill), and you copy it into place.
