'use strict';

// Converts content/ into GitHub wiki pages (build/wiki/). The wiki is a
// generated mirror: content/ stays the single source of truth, and the
// wiki-sync workflow publishes the output after every merge to main.
// The output is byte-stable for the same input, so it can be snapshot-tested.

const fs = require('node:fs');
const path = require('node:path');
const { loadContent, SECTION_KINDS, SECTION_TITLES } = require('../src/content');

const OUT_DIR = path.join(__dirname, '..', 'build', 'wiki');
const FOOTER = 'Generated from `content/` in the repository. Edit the Markdown there through a pull request; edits made directly in the wiki are overwritten.';

function wikiName(title) {
  return title.replace(/[^A-Za-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function stageName(stage) {
  return `Stage-${stage.position}-${wikiName(stage.title)}`;
}

function buildLinkMap(content) {
  const map = new Map([['/', 'Home']]);
  for (const stage of content.stages) map.set(`/stages/${stage.slug}`, stageName(stage));
  for (const page of content.pages) map.set(`/${page.slug}`, wikiName(page.title));
  return map;
}

// Rewrites site-internal links such as (/stages/plan#details) to wiki pages.
function rewriteLinks(markdown, linkMap) {
  return markdown.replace(/\]\((\/[^)\s#]*)(#[^)\s]*)?\)/g, (match, target, hash = '') => {
    const name = linkMap.get(target.replace(/\/$/, '') || '/');
    return name ? `](${name}${hash})` : match;
  });
}

function buildWiki(content) {
  const linkMap = buildLinkMap(content);
  const files = {};
  const fix = (markdown) => rewriteLinks(markdown.trim(), linkMap);

  const stageList = content.stages
    .map((stage) => `${stage.position}. [${stage.title}](${stageName(stage)}): ${stage.summary} Commits ${stage.artifact.includes('.md') ? `\`${stage.artifact}\`` : stage.artifact}.`)
    .join('\n');
  files['Home.md'] = [
    '# The AI-Native SDLC Bible',
    '',
    'Agents do the work, humans steer. Six stages, each ending in a committed artifact that triggers the next.',
    '',
    '## The six stages',
    '',
    stageList,
    '',
    `## ${content.dynamics.data.title || 'How Claude and the human engineer work together'}`,
    '',
    fix(content.dynamics.body).replace(/^## /gm, '### '),
    '',
    fix(content.intro.body),
    '',
  ].join('\n');

  content.stages.forEach((stage, i) => {
    const prev = content.stages[(i - 1 + content.stages.length) % content.stages.length];
    const next = content.stages[(i + 1) % content.stages.length];
    const parts = [`# Stage ${stage.position}: ${stage.title}`, '', stage.summary, '', `**Commits:** ${stage.artifact}`, ''];
    for (const kind of SECTION_KINDS) {
      parts.push(`## ${SECTION_TITLES[kind]}`, '', fix(stage.sections[kind].body), '');
    }
    parts.push('---', '', `← [Stage ${prev.position}: ${prev.title}](${stageName(prev)}) · [Stage ${next.position}: ${next.title}](${stageName(next)}) →`, '');
    files[`${stageName(stage)}.md`] = parts.join('\n');
  });

  for (const page of content.pages) {
    files[`${wikiName(page.title)}.md`] = `${fix(page.body)}\n`;
  }

  files['_Sidebar.md'] = [
    '**[Home](Home)**',
    '',
    '**Stages**',
    '',
    ...content.stages.map((stage) => `${stage.position}. [${stage.title}](${stageName(stage)})`),
    '',
    '**Topics**',
    '',
    ...content.pages.map((page) => `- [${page.nav}](${wikiName(page.title)})`),
    '',
  ].join('\n');
  files['_Footer.md'] = `${FOOTER}\n`;

  return Object.fromEntries(Object.keys(files).sort().map((name) => [name, files[name]]));
}

function writeWiki(files, outDir = OUT_DIR) {
  fs.mkdirSync(outDir, { recursive: true });
  for (const name of fs.readdirSync(outDir)) {
    if (name.endsWith('.md')) fs.unlinkSync(path.join(outDir, name));
  }
  for (const [name, text] of Object.entries(files)) fs.writeFileSync(path.join(outDir, name), text, 'utf8');
}

if (require.main === module) {
  const outDir = path.resolve(process.argv[2] || OUT_DIR);
  const files = buildWiki(loadContent());
  writeWiki(files, outDir);
  console.log(`Wrote ${Object.keys(files).length} wiki pages to ${path.relative(process.cwd(), outDir) || '.'}`);
}

module.exports = { buildWiki, writeWiki, rewriteLinks, wikiName, stageName };
