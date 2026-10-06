'use strict';

// Regression test: a broad .gitignore pattern (`build/`) once ignored
// content/stages/build/, so CI checked out only five stages.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ROOT = path.join(__dirname, '..', '..');

function listFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? listFiles(full) : [path.relative(ROOT, full).split(path.sep).join('/')];
  });
}

function ignoredPaths(paths) {
  try {
    // --no-index tests the ignore rules even for files that are already tracked.
    const out = execFileSync('git', ['check-ignore', '--no-index', '--stdin'], { cwd: ROOT, input: paths.join('\n'), encoding: 'utf8' });
    return out.split('\n').map((s) => s.trim()).filter(Boolean);
  } catch (err) {
    if (err.status === 1) return []; // exit code 1: none of the paths are ignored
    throw err;
  }
}

test('no file in content/, src/ or db/ is excluded by .gitignore', () => {
  const files = ['content', 'src', 'db'].flatMap((dir) => listFiles(path.join(ROOT, dir)));
  assert.deepEqual(ignoredPaths(files), []);
});
