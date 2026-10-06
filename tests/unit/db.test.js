'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadContent } = require('../../src/content');
const db = require('../../src/db');

function seeded() {
  const database = db.openDb(':memory:');
  db.seedDatabase(database, loadContent());
  return database;
}

test('seeds six stages in order', () => {
  const stages = db.getStages(seeded());
  assert.deepEqual(stages.map((s) => s.position), [1, 2, 3, 4, 5, 6]);
  assert.equal(stages[0].artifactHtml, 'intent.md');
  assert.match(stages[0].summaryHtml, /<code>intent.md<\/code>/);
});

test('stage pages have three sections and loop around at both ends', () => {
  const database = seeded();
  const plan = db.getStagePage(database, 'plan');
  assert.deepEqual(Object.keys(plan.sections).sort(), ['details', 'recommendations', 'research']);
  assert.equal(plan.prev.slug, 'maintain');
  assert.equal(plan.next.slug, 'design');
  assert.equal(db.getStagePage(database, 'maintain').next.slug, 'plan');
  assert.equal(db.getStagePage(database, 'nope'), null);
});

test('stores the home intro outside the navigation', () => {
  const database = seeded();
  assert.match(db.getPage(database, 'home').body_html, /The core idea/);
  assert.deepEqual(db.getNavPages(database).map((p) => p.slug), ['roles', 'security', 'efficiency', 'structure']);
});

test('stores the rendered dynamics blocks', () => {
  const database = seeded();
  assert.match(db.getBlock(database, 'dynamics-wide'), /dynamics-wide/);
  assert.match(db.getBlock(database, 'dynamics-tall'), /dynamics-tall/);
  assert.match(db.getBlock(database, 'humans-list'), /<ul>/);
  assert.equal(db.getBlock(database, 'missing'), '');
});

test('search finds stages and pages, case-insensitively', () => {
  const database = seeded();
  const results = db.search(database, 'BANDS.MD');
  assert.ok(results.some((r) => r.url === '/stages/maintain#details'));
  assert.ok(results.every((r) => r.snippet.length > 0));
});

test('search treats SQL wildcards literally and ignores empty queries', () => {
  const database = seeded();
  assert.deepEqual(db.search(database, '%'), []);
  assert.deepEqual(db.search(database, '   '), []);
});

test('seeding twice gives the same result', () => {
  const database = seeded();
  db.seedDatabase(database, loadContent());
  assert.equal(db.getStages(database).length, 6);
});
