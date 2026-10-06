'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadContent } = require('../../src/content');
const db = require('../../src/db');
const { createServer } = require('../../src/server');

let server;
let base;

test.before(async () => {
  const database = db.openDb(':memory:');
  db.seedDatabase(database, loadContent());
  server = createServer({ database });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

test.after(() => new Promise((resolve) => server.close(resolve)));

test('home page shows the stage cards, the loop and the intro in that order', async () => {
  const res = await fetch(`${base}/`);
  assert.equal(res.status, 200);
  const html = await res.text();
  assert.equal((html.match(/class="stage-card"/g) || []).length, 6);
  const stages = html.indexOf('id="stages"');
  const dynamics = html.indexOf('id="dynamics"');
  const intro = html.indexOf('id="intro"');
  assert.ok(stages > 0 && stages < dynamics && dynamics < intro, 'sections are out of order');
  assert.match(html, /href="\/stages\/plan"/);
  assert.match(html, /The core idea/);
});

test('pages load W3.CSS and W3.JS and send security headers', async () => {
  const res = await fetch(`${base}/`);
  const html = await res.text();
  assert.match(html, /https:\/\/www\.w3schools\.com\/w3css\/5\/w3\.css/);
  assert.match(html, /https:\/\/www\.w3schools\.com\/lib\/w3\.js/);
  assert.match(res.headers.get('content-security-policy'), /script-src 'self' https:\/\/www\.w3schools\.com/);
  assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
});

test('stage page has details, recommendations and research panels', async () => {
  const res = await fetch(`${base}/stages/deploy`);
  assert.equal(res.status, 200);
  const html = await res.text();
  for (const id of ['details', 'recommendations', 'research']) assert.match(html, new RegExp(`id="${id}"`));
  assert.match(html, /Stage 5 of 6/);
  assert.match(html, /href="\/stages\/test" rel="prev"/);
  assert.match(html, /href="\/stages\/maintain" rel="next"/);
});

test('topic pages and search work', async () => {
  assert.equal((await fetch(`${base}/security`)).status, 200);
  const html = await (await fetch(`${base}/search?q=intent`)).text();
  assert.match(html, /class="search-result"/);
});

test('search output is escaped', async () => {
  const html = await (await fetch(`${base}/search?q=${encodeURIComponent('<script>x</script>')}`)).text();
  assert.doesNotMatch(html, /<script>x<\/script>/);
});

test('serves static files and blocks path traversal', async () => {
  const css = await fetch(`${base}/css/site.css`);
  assert.equal(css.status, 200);
  assert.match(css.headers.get('content-type'), /text\/css/);
  assert.equal((await fetch(`${base}/..%2fpackage.json`)).status, 404);
  assert.equal((await fetch(`${base}/%2e%2e/package.json`)).status, 404);
});

test('unknown pages return 404 and other methods 405', async () => {
  assert.equal((await fetch(`${base}/stages/nope`)).status, 404);
  assert.equal((await fetch(`${base}/nope`)).status, 404);
  assert.equal((await fetch(`${base}/`, { method: 'POST' })).status, 405);
});
