# Intent

## Problem

The team's knowledge about the AI-native SDLC lives in course notes. It isn't published anywhere engineers can browse, link to or keep up to date. There is also no repository setup yet that enforces how agents and human engineers work together.

## Who is affected

- Engineers who orchestrate Claude and need one reference for the stages, roles, security and efficient use of agents.
- Tech leads and product owners who approve at the gates.
- The human engineers who maintain the best practices.

## What better means

- A website with a clear overview of the six stages and the dynamics between Claude and the human engineer, plus one page per stage with details, recommendations and future research questions.
- The same Markdown also serves as the repository wiki, so knowledge is never maintained twice.
- Version-control rules are enforced deterministically wherever possible, through hooks, branch protection and CI, instead of relying on instructions alone.

## Out of scope

- Editing content through the website (content is Markdown, edited via pull requests).
- Authentication, user accounts and hosting or deployment infrastructure.
- Stage 6 automation (detection scripts and bands) for the site itself.

## Success criteria

- The home page shows the six stage cards, the human ↔ Claude loop and the introduction from the course notes, in that order. Each card opens its stage page.
- Every merge to main requires a human approval and green CI.
- `npm test`, `npm run test:e2e` and `npm run check` pass.

## Open questions

- Should W3.CSS and W3.JS be vendored instead of loaded from the CDN, for reproducibility and subresource integrity?
- Which hosting target will serve the site?
