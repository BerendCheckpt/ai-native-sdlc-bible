'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { requiredHeadings, missingHeadings, skillFor, checkArtifact, checkRepo } = require('../../scripts/check-artifacts');

test('reads required headings from a SKILL.md', () => {
  const skill = '# x\n\n## Required headings\n\n- `# Intent`\n- `## Problem`\n\n## Rules\n- `## Not this`';
  assert.deepEqual(requiredHeadings(skill), ['# Intent', '## Problem']);
});

test('finds missing headings, ignoring case and spacing', () => {
  assert.deepEqual(missingHeadings('# intent\n##   Problem', ['# Intent', '## Problem', '## Scope']), ['## Scope']);
});

test('maps work artifacts to their skills', () => {
  assert.equal(skillFor('work/1-x/intent.md'), 'write-intent');
  assert.equal(skillFor('work/1-x/spec.md'), 'write-spec');
  assert.equal(skillFor('work\\1-x\\plan.md'), 'write-plan');
  assert.equal(skillFor('work/1-x/notes.md'), null);
  assert.equal(skillFor('docs/intent.md'), null);
});

test('every required skill declares its headings', () => {
  for (const artifact of ['intent', 'spec', 'plan']) {
    const problems = checkArtifact(`work/0-probe/${artifact}.md`, '');
    assert.ok(problems.length > 0, `${artifact}.md: the skill declares no required headings`);
    assert.ok(problems.every((p) => p.includes('missing')), problems.join('\n'));
  }
});

test('the artifacts in this repository follow their skills', () => {
  assert.deepEqual(checkRepo(), []);
});
