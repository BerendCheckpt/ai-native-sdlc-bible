'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');
const { render, renderInline, toPlainText } = require('./markdown');
const { SECTION_KINDS, SECTION_TITLES } = require('./content');
const { parseDynamics, renderSvg } = require('./dynamics');

const SCHEMA_PATH = path.join(__dirname, '..', 'db', 'schema.sql');
const DEFAULT_DB_PATH = path.join(__dirname, '..', 'data', 'bible.db');

function openDb(file = DEFAULT_DB_PATH, { readOnly = false } = {}) {
  const db = new DatabaseSync(file, { readOnly });
  db.exec('PRAGMA foreign_keys = ON;');
  return db;
}

// Rebuilds every table from the loaded content in a single transaction.
function seedDatabase(db, content) {
  db.exec(fs.readFileSync(SCHEMA_PATH, 'utf8'));
  const insertStage = db.prepare('INSERT INTO stages (slug, position, title, artifact, summary, source_path) VALUES (?, ?, ?, ?, ?, ?)');
  const insertSection = db.prepare('INSERT INTO stage_sections (stage_slug, kind, body_html, source_path) VALUES (?, ?, ?, ?)');
  const insertPage = db.prepare('INSERT INTO pages (slug, title, nav_label, nav_order, in_nav, body_html, source_path) VALUES (?, ?, ?, ?, ?, ?, ?)');
  const insertBlock = db.prepare('INSERT INTO blocks (key, html) VALUES (?, ?)');
  const insertSearch = db.prepare('INSERT INTO search_index (url, title, text, position) VALUES (?, ?, ?, ?)');

  let position = 0;
  db.exec('BEGIN');
  try {
    const intro = content.intro;
    insertPage.run('home', intro.data.title || 'Introduction', 'Home', 0, 0, render(intro.body), intro.sourcePath);
    insertSearch.run('/#intro', 'Introduction', toPlainText(intro.body), position++);

    const dynamics = parseDynamics(content.dynamics.body);
    insertBlock.run('dynamics-wide', renderSvg(dynamics.steps, 'wide'));
    insertBlock.run('dynamics-tall', renderSvg(dynamics.steps, 'tall'));
    insertBlock.run('humans-list', render(dynamics.humans));
    insertBlock.run('agents-list', render(dynamics.agents));

    for (const stage of content.stages) {
      insertStage.run(stage.slug, stage.position, stage.title, stage.artifact, stage.summary, stage.sourcePath);
      insertSearch.run(`/stages/${stage.slug}`, `Stage ${stage.position}: ${stage.title}`, toPlainText(stage.summary), position++);
      for (const kind of SECTION_KINDS) {
        const section = stage.sections[kind];
        insertSection.run(stage.slug, kind, render(section.body), section.sourcePath);
        insertSearch.run(`/stages/${stage.slug}#${kind}`, `${stage.title} — ${SECTION_TITLES[kind]}`, toPlainText(section.body), position++);
      }
    }

    for (const page of content.pages) {
      insertPage.run(page.slug, page.title, page.nav, page.order, 1, render(page.body), page.sourcePath);
      insertSearch.run(`/${page.slug}`, page.title, toPlainText(page.body), position++);
    }
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

function getStages(db) {
  return db.prepare('SELECT slug, position, title, artifact, summary FROM stages ORDER BY position').all()
    .map((row) => ({ ...row, summaryHtml: renderInline(row.summary), artifactHtml: renderInline(row.artifact) }));
}

// Returns the stage with its sections and its neighbours. The stages form a
// loop, so the stage after the last one is the first one again.
function getStagePage(db, slug) {
  const stages = getStages(db);
  const index = stages.findIndex((stage) => stage.slug === slug);
  if (index === -1) return null;
  const sections = {};
  for (const row of db.prepare('SELECT kind, body_html FROM stage_sections WHERE stage_slug = ?').all(slug)) {
    sections[row.kind] = row.body_html;
  }
  return {
    stage: stages[index],
    sections,
    total: stages.length,
    prev: stages[(index - 1 + stages.length) % stages.length],
    next: stages[(index + 1) % stages.length],
  };
}

function getPage(db, slug) {
  return db.prepare('SELECT slug, title, body_html FROM pages WHERE slug = ?').get(slug) || null;
}

function getNavPages(db) {
  return db.prepare('SELECT slug, nav_label FROM pages WHERE in_nav = 1 ORDER BY nav_order, slug').all();
}

function getBlock(db, key) {
  const row = db.prepare('SELECT html FROM blocks WHERE key = ?').get(key);
  return row ? row.html : '';
}

function snippet(text, term, radius = 90) {
  const at = text.toLowerCase().indexOf(term);
  if (at === -1) return text.slice(0, radius * 2) + (text.length > radius * 2 ? '…' : '');
  const start = Math.max(0, at - radius);
  const end = Math.min(text.length, at + term.length + radius);
  return (start > 0 ? '…' : '') + text.slice(start, end) + (end < text.length ? '…' : '');
}

function search(db, query) {
  const term = String(query || '').trim().toLowerCase().slice(0, 100);
  if (!term) return [];
  const like = `%${term.replace(/[\\%_]/g, (ch) => `\\${ch}`)}%`;
  return db.prepare(
    "SELECT url, title, text FROM search_index WHERE lower(title) LIKE ? ESCAPE '\\' OR lower(text) LIKE ? ESCAPE '\\' ORDER BY position",
  ).all(like, like).map((row) => ({ url: row.url, title: row.title, snippet: snippet(row.text, term) }));
}

module.exports = { DEFAULT_DB_PATH, openDb, seedDatabase, getStages, getStagePage, getPage, getNavPages, getBlock, search };
