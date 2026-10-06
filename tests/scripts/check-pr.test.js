'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { checkPrBody, governanceFiles } = require('../../scripts/check-pr');

test('accepts a filled-in justification', () => {
  assert.deepEqual(checkPrBody('## Summary\nx\n\n## Justification\nBecause users need it.\n\n## Tests\ny'), []);
});

test('rejects a missing or empty justification', () => {
  assert.equal(checkPrBody('## Summary\nx').length, 1);
  assert.equal(checkPrBody('## Justification\n\n## Tests\ny').length, 1);
});

test('the untouched PR template does not pass', () => {
  const template = fs.readFileSync(path.join(__dirname, '..', '..', '.github', 'pull_request_template.md'), 'utf8');
  assert.equal(checkPrBody(template).length, 1, 'HTML comments alone must not count as a justification');
});

test('detects governance files', () => {
  assert.deepEqual(governanceFiles(['src/a.js', 'CLAUDE.md', '.claude/skills/x/SKILL.md', '.github/workflows/ci.yml', 'docs/a.md']),
    ['CLAUDE.md', '.claude/skills/x/SKILL.md', '.github/workflows/ci.yml']);
});
