---
name: new-content-section
description: Required procedure when someone wants to add or change best-practice content (stages, recommendations, research questions or topic pages) of the AI-native SDLC bible. Use whenever content/ would change.
---

# new-content-section

This skill is required. Best practices are maintained by human engineers, so Claude never edits `content/` directly. `.claude/hooks/protect-paths.js` blocks it. Claude prepares a draft that a human moves into place.

## How content/ maps to the site and the wiki

| File | Website | Wiki |
| --- | --- | --- |
| `content/home/intro.md` | Home page, below the visualization | `Home` |
| `content/home/dynamics.md` | The human ↔ Claude loop on the home page | `Home` |
| `content/stages/<slug>/stage.md` | Stage card plus the stage header (front-matter: `position`, `title`, `artifact`, `summary`) | `Stage-<n>-<Title>` |
| `content/stages/<slug>/details.md` | Stage page, Details panel | `## Details` |
| `content/stages/<slug>/recommendations.md` | Stage page, Recommendations panel | `## Recommendations` |
| `content/stages/<slug>/research.md` | Stage page, Future research questions panel | `## Future research questions` |
| `content/pages/<slug>.md` | `/<slug>` in the top navigation (front-matter: `title`, `nav`, `order`) | `<Title>` |

## Procedure

1. Write the draft under `work/<issue>-<slug>/drafts/`, mirroring the target path, for example `drafts/content/stages/test/research.md`.
2. Use only the supported Markdown: headings (`###` inside stage sections), paragraphs, lists, tables, fenced code, bold, inline code and links. Link between pages with site paths such as `/stages/plan`. The wiki build rewrites them.
3. In `dynamics.md`, keep the loop format exactly: `1. **Human** — Title: detail`, with an even number of steps.
4. Ask the human engineer to copy the draft into `content/` and run `npm run seed && npm run wiki` to preview it.
