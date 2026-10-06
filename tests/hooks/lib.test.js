'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const lib = require('../../.claude/hooks/lib');

test('tokenizes quotes and operators', () => {
  assert.deepEqual(lib.segments(`git commit -m "a && b" && git push origin 'feature/1-x'`), [
    ['git', 'commit', '-m', 'a && b'],
    ['git', 'push', 'origin', 'feature/1-x'],
  ]);
});

test('strips leading environment assignments', () => {
  assert.deepEqual(lib.segments('FOO=1 BAR=2 git status'), [['git', 'status']]);
});

test('splits on pipes, semicolons and newlines', () => {
  assert.equal(lib.segments('a | b; c\nd || e & f').length, 6);
});

test('reads flag values in both forms', () => {
  assert.deepEqual(lib.flagValues(['-l', 'a,b', '--label=c'], ['-l', '--label']), ['a,b', 'c']);
});

test('picks the strictest decision', () => {
  assert.equal(lib.strongest([null, lib.ask('a'), lib.deny('d')]).decision, 'deny');
  assert.equal(lib.strongest([null]), null);
});

test('resolves paths relative to the project and rejects outside paths', () => {
  const root = require('node:path').resolve('project-root');
  assert.equal(lib.relativeToProject(require('node:path').join(root, 'content', 'a.md'), root), 'content/a.md');
  assert.equal(lib.relativeToProject(require('node:path').resolve('elsewhere', 'x.md'), root), null);
});
