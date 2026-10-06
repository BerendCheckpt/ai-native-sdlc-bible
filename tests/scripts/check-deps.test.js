'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { diffDeps, formatReport } = require('../../scripts/check-deps');

test('reports added, changed and removed modules', () => {
  const base = { devDependencies: { '@playwright/test': '^1.55.0' }, dependencies: { old: '1.0.0' } };
  const head = { devDependencies: { '@playwright/test': '^1.56.0' }, dependencies: { express: '^5.0.0' } };
  const diff = diffDeps(base, head);
  assert.deepEqual(diff.added, [{ name: 'express', version: '^5.0.0', field: 'dependencies' }]);
  assert.deepEqual(diff.changed, [{ name: '@playwright/test', from: '^1.55.0', to: '^1.56.0', field: 'devDependencies' }]);
  assert.deepEqual(diff.removed, ['old']);
});

test('treats a missing base package.json as having no modules', () => {
  assert.equal(diffDeps({}, { devDependencies: { a: '1' } }).added.length, 1);
});

test('reports nothing when the modules are identical', () => {
  const pkg = { devDependencies: { a: '1' } };
  assert.deepEqual(diffDeps(pkg, pkg), { added: [], changed: [], removed: [] });
});

test('the report tags the engineer and asks for the deps-approved label', () => {
  const report = formatReport(diffDeps({}, { dependencies: { express: '5' } }), 'origin/main');
  assert.match(report, /@BerendCheckpt/);
  assert.match(report, /deps-approved/);
  assert.match(report, /`express`/);
});
