'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { parseDynamics, renderSvg, wrap } = require('../../src/dynamics');
const { loadContent } = require('../../src/content');

const SAMPLE = `## Loop

1. **Human** — Sets intent: Describes the \`problem\`.
2. **Claude** — Drafts: Writes the artifact.

## Humans steer

- Steer.

## Agents do the work

- Work.`;

test('parses steps, actors and the two lists', () => {
  const parsed = parseDynamics(SAMPLE);
  assert.deepEqual(parsed.steps, [
    { actor: 'Human', title: 'Sets intent', detail: 'Describes the problem.' },
    { actor: 'Claude', title: 'Drafts', detail: 'Writes the artifact.' },
  ]);
  assert.equal(parsed.humans, '- Steer.');
  assert.equal(parsed.agents, '- Work.');
});

test('rejects malformed steps and odd step counts', () => {
  assert.throws(() => parseDynamics('## Loop\n\n1. Human sets intent'), /must look like/);
  assert.throws(() => parseDynamics('## Loop\n\n1. **Human** — A: b'), /even number/);
  assert.throws(() => parseDynamics('## Other\n'), /missing "## Loop"/);
});

test('the real loop alternates between human and Claude as in the playbook', () => {
  const { steps } = parseDynamics(loadContent().dynamics.body);
  assert.deepEqual(steps.map((s) => s.actor), ['Human', 'Claude', 'Human', 'Claude', 'Claude', 'Human']);
});

for (const layout of ['wide', 'tall']) {
  test(`renders a ${layout} SVG with one focusable node and one arrow per step`, () => {
    const { steps } = parseDynamics(loadContent().dynamics.body);
    const svg = renderSvg(steps, layout);
    assert.match(svg, new RegExp(`^<svg class="dynamics dynamics-${layout}"`));
    assert.equal((svg.match(/class="dyn-node dyn-human"/g) || []).length, 3);
    assert.equal((svg.match(/class="dyn-node dyn-agent"/g) || []).length, 3);
    assert.equal((svg.match(/class="dyn-arrow"/g) || []).length, 6);
    assert.equal((svg.match(/tabindex="0"/g) || []).length, 6);
    assert.equal(svg, renderSvg(steps, layout), 'rendering must be deterministic');
  });
}

test('escapes text placed in the SVG', () => {
  const svg = renderSvg([{ actor: 'Human', title: '<b>', detail: '"x"' }, { actor: 'Claude', title: 'y', detail: 'z' }], 'wide');
  assert.doesNotMatch(svg, /<b>/);
  assert.match(svg, /&lt;b&gt;/);
});

test('wraps titles by words', () => {
  assert.deepEqual(wrap('Executes within hooks and verifies', 20), ['Executes within', 'hooks and verifies']);
});
