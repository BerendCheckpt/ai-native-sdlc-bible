'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { evaluate } = require('../../.claude/hooks/require-skill');

// The real repository root, so the real SKILL.md files define the headings.
const root = path.join(__dirname, '..', '..');
const target = path.join(root, 'work', '42-example', 'intent.md');

const COMPLETE_INTENT = [
  '# Intent', '## Problem', 'x', '## Who is affected', 'x', '## What better means', 'x',
  '## Out of scope', 'x', '## Success criteria', 'x', '## Open questions', 'x',
].join('\n');

test('denies an intent that misses required headings and names the skill', () => {
  const result = evaluate({ tool_name: 'Write', tool_input: { file_path: target, content: '# Intent\n## Problem\nx' } }, root);
  assert.equal(result.decision, 'deny');
  assert.match(result.reason, /write-intent/);
  assert.match(result.reason, /## Success criteria/);
});

test('allows an intent with every required heading', () => {
  assert.equal(evaluate({ tool_name: 'Write', tool_input: { file_path: target, content: COMPLETE_INTENT } }, root), null);
});

test('checks the result of an Edit, not just the new text', () => {
  const readFile = () => COMPLETE_INTENT;
  const removing = { tool_name: 'Edit', tool_input: { file_path: target, old_string: '## Open questions', new_string: '## Questions' } };
  assert.equal(evaluate(removing, root, readFile).decision, 'deny');
  const harmless = { tool_name: 'Edit', tool_input: { file_path: target, old_string: '## Problem\nx', new_string: '## Problem\nBetter text' } };
  assert.equal(evaluate(harmless, root, readFile), null);
});

test('ignores files that are not skill artifacts', () => {
  assert.equal(evaluate({ tool_name: 'Write', tool_input: { file_path: path.join(root, 'work', '42-example', 'notes.md'), content: '' } }, root), null);
  assert.equal(evaluate({ tool_name: 'Write', tool_input: { file_path: path.join(root, 'src', 'x.js'), content: '' } }, root), null);
});
