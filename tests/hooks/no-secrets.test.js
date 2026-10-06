'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { evaluate, scanDiff } = require('../../.claude/hooks/no-secrets');
const { fakeContext } = require('./helpers');

// Fixtures are assembled at runtime so this file never contains a real-looking secret.
const fakeGithubToken = ['gh', 'p_', 'A'.repeat(36)].join('');
const fakePrivateKey = ['-----BEGIN ', 'PRIVATE KEY-----'].join('');
const fakePassword = ['pass', 'word = "', 'hunter2hunter2', '"'].join('');

function diffAdding(file, line) {
  return `diff --git a/${file} b/${file}\n--- a/${file}\n+++ b/${file}\n@@ -0,0 +1,2 @@\n+const ok = 1;\n+${line}\n`;
}

test('finds credentials in added lines with file and line number', () => {
  assert.deepEqual(scanDiff(diffAdding('src/a.js', `const t = '${fakeGithubToken}';`)), [{ file: 'src/a.js', line: 2, name: 'GitHub token' }]);
  assert.equal(scanDiff(diffAdding('k.txt', fakePrivateKey))[0].name, 'private key');
  assert.equal(scanDiff(diffAdding('c.js', fakePassword))[0].name, 'hard-coded credential');
});

test('ignores removed lines and ordinary code', () => {
  assert.deepEqual(scanDiff(`+++ b/a.js\n@@ -1 +1 @@\n-${fakePassword}\n+const port = process.env.PORT;\n`), []);
});

test('denies commits with credentials or sensitive files', () => {
  const withToken = fakeContext({ diff: diffAdding('src/a.js', fakeGithubToken) });
  assert.equal(evaluate('git commit -m x', withToken).decision, 'deny');
  assert.equal(evaluate('git commit -m x', fakeContext({ staged: ['.env'] })).decision, 'deny');
});

test('ignores non-commit commands and clean commits', () => {
  assert.equal(evaluate('git status', fakeContext({ diff: diffAdding('a', fakeGithubToken) })), null);
  assert.equal(evaluate('git commit -m x', fakeContext({ staged: ['src/a.js'], diff: diffAdding('src/a.js', 'const a = 1;') })), null);
});
