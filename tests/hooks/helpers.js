'use strict';

// Fake git/gh context for hook tests: no real repository or network needed.
function fakeContext({ branch = 'feature/12-site', staged = [], labels = { 12: ['approved'] }, diff = '', ignored = [], tests = { ok: true, output: '' } } = {}) {
  return {
    currentBranch: () => branch,
    stagedFiles: () => staged,
    stagedDiff: () => diff,
    ignoredSourceFiles: () => ignored,
    runTests: () => tests,
    issueLabels: (n) => (labels === null ? null : labels[n] || []),
    readFile: () => { throw new Error('no file'); },
  };
}

module.exports = { fakeContext };
