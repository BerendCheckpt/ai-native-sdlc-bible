'use strict';

// Loads the human-maintained Markdown in content/. This module is the single
// reader of content/ for both the website (scripts/seed.js) and the GitHub
// wiki (scripts/build-wiki.js), so the two can never drift apart.

const fs = require('node:fs');
const path = require('node:path');

const CONTENT_DIR = path.join(__dirname, '..', 'content');
const SECTION_KINDS = ['details', 'recommendations', 'research'];
const SECTION_TITLES = {
  details: 'Details',
  recommendations: 'Recommendations',
  research: 'Future research questions',
};

function parseFrontMatter(text) {
  const source = String(text).replace(/^﻿/, '').replace(/\r\n?/g, '\n');
  const match = source.match(/^---\n([\s\S]*?)\n---[ \t]*(?:\n|$)/);
  if (!match) return { data: {}, body: source };
  const data = {};
  for (const line of match[1].split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const colon = line.indexOf(':');
    if (colon === -1) throw new Error(`Invalid front-matter line: "${line}"`);
    const key = line.slice(0, colon).trim();
    let value = line.slice(colon + 1).trim();
    if (/^(['"]).*\1$/.test(value)) value = value.slice(1, -1);
    data[key] = value;
  }
  return { data, body: source.slice(match[0].length) };
}

function readDoc(file, contentDir) {
  const { data, body } = parseFrontMatter(fs.readFileSync(file, 'utf8'));
  const sourcePath = path.relative(path.dirname(contentDir), file).split(path.sep).join('/');
  return { data, body, sourcePath };
}

function requireField(doc, key) {
  const value = doc.data[key];
  if (value === undefined || value === '') throw new Error(`${doc.sourcePath}: missing front-matter field "${key}"`);
  return value;
}

function loadStages(contentDir) {
  const stagesDir = path.join(contentDir, 'stages');
  const stages = fs.readdirSync(stagesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const dir = path.join(stagesDir, entry.name);
      const meta = readDoc(path.join(dir, 'stage.md'), contentDir);
      const sections = {};
      for (const kind of SECTION_KINDS) sections[kind] = readDoc(path.join(dir, `${kind}.md`), contentDir);
      return {
        slug: entry.name,
        position: Number(requireField(meta, 'position')),
        title: requireField(meta, 'title'),
        artifact: requireField(meta, 'artifact'),
        summary: requireField(meta, 'summary'),
        sourcePath: meta.sourcePath,
        sections,
      };
    })
    .sort((a, b) => a.position - b.position);

  stages.forEach((stage, index) => {
    if (stage.position !== index + 1) {
      throw new Error(`Stage positions must be 1..${stages.length} without gaps; "${stage.slug}" has position ${stage.position}`);
    }
  });
  return stages;
}

function loadPages(contentDir) {
  const pagesDir = path.join(contentDir, 'pages');
  return fs.readdirSync(pagesDir)
    .filter((name) => name.endsWith('.md'))
    .map((name) => {
      const doc = readDoc(path.join(pagesDir, name), contentDir);
      return {
        slug: name.slice(0, -3),
        title: requireField(doc, 'title'),
        nav: doc.data.nav || requireField(doc, 'title'),
        order: Number(doc.data.order || 999),
        body: doc.body,
        sourcePath: doc.sourcePath,
      };
    })
    .sort((a, b) => a.order - b.order || a.slug.localeCompare(b.slug));
}

function loadContent(contentDir = CONTENT_DIR) {
  const intro = readDoc(path.join(contentDir, 'home', 'intro.md'), contentDir);
  const dynamics = readDoc(path.join(contentDir, 'home', 'dynamics.md'), contentDir);
  return { intro, dynamics, stages: loadStages(contentDir), pages: loadPages(contentDir) };
}

// Splits a Markdown body into its "## " sections: { 'Loop': '...', ... }.
function splitSections(body) {
  const sections = {};
  let current = null;
  for (const line of String(body).split('\n')) {
    const heading = line.match(/^##\s+(.+?)\s*$/);
    if (heading) {
      current = heading[1];
      sections[current] = '';
    } else if (current) {
      sections[current] += `${line}\n`;
    }
  }
  for (const key of Object.keys(sections)) sections[key] = sections[key].trim();
  return sections;
}

module.exports = { CONTENT_DIR, SECTION_KINDS, SECTION_TITLES, parseFrontMatter, loadContent, splitSections };
