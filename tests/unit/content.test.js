'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { parseFrontMatter, loadContent, splitSections, SECTION_KINDS } = require('../../src/content');

test('parses front-matter and body', () => {
  const { data, body } = parseFrontMatter('---\ntitle: Plan\nsummary: "a: b"\n---\nBody\n');
  assert.deepEqual(data, { title: 'Plan', summary: 'a: b' });
  assert.equal(body, 'Body\n');
});

test('returns the whole text when there is no front-matter', () => {
  assert.deepEqual(parseFrontMatter('Just text'), { data: {}, body: 'Just text' });
});

test('handles Windows line endings', () => {
  const { data, body } = parseFrontMatter('---\r\ntitle: X\r\n---\r\nBody');
  assert.equal(data.title, 'X');
  assert.equal(body, 'Body');
});

test('the real content has six stages in loop order, each with three sections', () => {
  const content = loadContent();
  assert.deepEqual(content.stages.map((s) => s.slug), ['plan', 'design', 'build', 'test', 'deploy', 'maintain']);
  for (const stage of content.stages) {
    for (const kind of SECTION_KINDS) {
      assert.ok(stage.sections[kind].body.trim().length > 0, `${stage.slug}/${kind}.md is empty`);
    }
    assert.ok(stage.artifact && stage.summary, `${stage.slug} lacks artifact or summary`);
  }
});

test('the real content has the intro, the loop and the topic pages', () => {
  const content = loadContent();
  assert.match(content.intro.body, /## The core idea/);
  assert.match(content.dynamics.body, /## Loop/);
  assert.deepEqual(content.pages.map((p) => p.slug), ['roles', 'security', 'efficiency', 'structure']);
});

test('content treats skills as required, not advisory', () => {
  const content = loadContent();
  const all = [content.intro.body, ...content.stages.flatMap((s) => SECTION_KINDS.map((k) => s.sections[k].body)), ...content.pages.map((p) => p.body)].join('\n');
  assert.doesNotMatch(all, /skill is an advisory control/i);
  assert.doesNotMatch(all, /skills are advisory/i);
});

test('splits a body into its level-2 sections', () => {
  assert.deepEqual(splitSections('## A\none\n\n## B\ntwo'), { A: 'one', B: 'two' });
});
