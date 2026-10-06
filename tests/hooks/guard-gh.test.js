'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { evaluate } = require('../../.claude/hooks/guard-gh');
const { fakeContext } = require('./helpers');

const decision = (command, ctx = fakeContext()) => (evaluate(command, ctx) || { decision: 'none' }).decision;

test('denies merging and approving pull requests', () => {
  assert.equal(decision('gh pr merge 3 --squash'), 'deny');
  assert.equal(decision('gh pr review 3 --approve'), 'deny');
  assert.equal(decision('gh pr review 3 --comment -b "looks good"'), 'none');
});

test('requires a non-empty justification in new pull requests', () => {
  assert.equal(decision('gh pr create --title t --body "## Summary\nx"'), 'deny');
  assert.equal(decision('gh pr create --title t --body "## Justification\n\n## Tests"'), 'deny');
  assert.equal(decision('gh pr create --fill'), 'deny');
  assert.equal(decision('gh pr create --title t --body "## Summary\nx\n## Justification\nNeeded because Y."'), 'none');
});

test('accepts heredoc bodies with nested quotes', () => {
  const command = `gh pr create --title "t" --body "$(cat <<'EOF'
## Summary
Adds the "search" page.

## Justification
Users asked for it; alternatives were rejected because they need new modules.
EOF
)"`;
  assert.equal(decision(command), 'none');
});

test('reads the body from --body-file', () => {
  const ctx = { ...fakeContext(), readFile: () => '## Justification\nBecause.' };
  assert.equal(decision('gh pr create --title t --body-file pr.md', ctx), 'none');
});

test('critical issues must tag the engineer', () => {
  assert.equal(decision('gh issue create --title t --label critical --body "x"'), 'deny');
  assert.equal(decision('gh issue create --title t --label critical --assignee BerendCheckpt --body "x"'), 'none');
  assert.equal(decision('gh issue create --title t -l bug,critical --body "cc @BerendCheckpt"'), 'none');
});

test('new features are always critical', () => {
  assert.equal(decision('gh issue create --title t --label feature --assignee BerendCheckpt --body x'), 'deny');
  assert.equal(decision('gh issue create --title t --label feature --label critical --assignee BerendCheckpt --body x'), 'none');
  assert.equal(decision('gh issue create --title t --label bug --body x'), 'none');
});

test('only humans set approval labels', () => {
  assert.equal(decision('gh issue edit 12 --add-label approved'), 'deny');
  assert.equal(decision('gh pr edit 3 --add-label deps-approved'), 'deny');
  assert.equal(decision('gh issue create --title t --label approved --body x'), 'deny');
  assert.equal(decision('gh issue edit 12 --add-label documentation'), 'none');
});

test('never touches branch protection or deletes the repository', () => {
  assert.equal(decision('gh api -X PUT repos/o/r/branches/main/protection --input p.json'), 'deny');
  assert.equal(decision('gh repo delete o/r --yes'), 'deny');
  assert.equal(decision('gh api repos/o/r/pulls'), 'none');
  assert.equal(decision('gh api -X POST repos/o/r/issues/1/comments -f body=x'), 'ask');
});
