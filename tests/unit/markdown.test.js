'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { render, renderInline, escapeHtml, slugify, safeUrl, toPlainText } = require('../../src/markdown');

test('escapes HTML in text', () => {
  assert.equal(render('<script>alert(1)</script>'), '<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>');
  assert.equal(escapeHtml(`"'&`), '&quot;&#39;&amp;');
});

test('renders headings with ids', () => {
  assert.equal(render('## Plan mode as the default'), '<h2 id="plan-mode-as-the-default">Plan mode as the default</h2>');
  assert.equal(slugify('Build (`CLAUDE.md`)'), 'build-claude-md');
});

test('renders inline code, bold, italics and links', () => {
  assert.equal(renderInline('**Agents** use `intent.md`'), '<strong>Agents</strong> use <code>intent.md</code>');
  assert.equal(renderInline('an *important* note'), 'an <em>important</em> note');
  assert.equal(renderInline('[Plan](/stages/plan)'), '<a href="/stages/plan">Plan</a>');
});

test('keeps Markdown syntax inside inline code literal', () => {
  assert.equal(renderInline('`**not bold**`'), '<code>**not bold**</code>');
});

test('neutralises unsafe link schemes', () => {
  assert.equal(safeUrl('javascript:alert(1)'), '#');
  assert.equal(renderInline('[x](javascript:alert(1))').includes('javascript:'), false);
  assert.equal(safeUrl('https://example.com'), 'https://example.com');
});

test('renders nested lists', () => {
  const html = render('1. First\n2. Second\n   - nested a\n   - nested b\n3. Third');
  assert.equal(html, '<ol>\n<li>First</li>\n<li>Second<ul>\n<li>nested a</li>\n<li>nested b</li>\n</ul></li>\n<li>Third</li>\n</ol>');
});

test('renders tables inside a responsive W3.CSS wrapper', () => {
  const html = render('| Stage | Artifact |\n| --- | --- |\n| Plan | `intent.md` |');
  assert.match(html, /<div class="w3-responsive"><table class="w3-table-all">/);
  assert.match(html, /<th>Stage<\/th><th>Artifact<\/th>/);
  assert.match(html, /<td>Plan<\/td><td><code>intent.md<\/code><\/td>/);
});

test('renders fenced code without interpreting it', () => {
  const html = render('```\nHuman → <Agent>\n**x**\n```');
  assert.equal(html, '<pre class="w3-code"><code>Human → &lt;Agent&gt;\n**x**</code></pre>');
});

test('joins paragraph lines and separates blocks', () => {
  assert.equal(render('one\ntwo\n\nthree'), '<p>one two</p>\n<p>three</p>');
});

test('is deterministic', () => {
  const source = '# A\n\n- b\n- c\n\n| x | y |\n| --- | --- |\n| 1 | 2 |';
  assert.equal(render(source), render(source));
});

test('produces plain text for search', () => {
  assert.equal(toPlainText('## Title\n\n- **bold** and `code`\n- [link](/x)'), 'Title bold and code link');
});
