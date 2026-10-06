'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { evaluate } = require('../../.claude/hooks/guard-git');
const { fakeContext } = require('./helpers');

const decision = (command, ctx = fakeContext()) => (evaluate(command, ctx) || { decision: 'none' }).decision;

test('denies every way of pushing to main', () => {
  assert.equal(decision('git push origin main'), 'deny');
  assert.equal(decision('git push origin HEAD:main'), 'deny');
  assert.equal(decision('git push origin feature/12-site:refs/heads/main'), 'deny');
  assert.equal(decision('git push', fakeContext({ branch: 'main' })), 'deny');
  assert.equal(decision('git push --all origin'), 'deny');
});

test('denies force pushes and remote deletions', () => {
  assert.equal(decision('git push --force origin feature/12-site'), 'deny');
  assert.equal(decision('git push -f'), 'deny');
  assert.equal(decision('git push --force-with-lease origin feature/12-site'), 'deny');
  assert.equal(decision('git push origin +feature/12-site'), 'deny');
  assert.equal(decision('git push origin :feature/12-site'), 'deny');
});

test('allows pushing a feature branch', () => {
  assert.equal(decision('git push -u origin feature/12-site'), 'none');
  assert.equal(decision('git push'), 'none');
});

test('denies merging into main and committing on main', () => {
  const onMain = fakeContext({ branch: 'main' });
  assert.equal(decision('git merge feature/12-site', onMain), 'deny');
  assert.equal(decision('git commit -m "x"', onMain), 'deny');
  assert.equal(decision('git merge main'), 'none');
});

test('denies overriding the author and skipping hooks', () => {
  assert.equal(decision('git commit --author="Someone <a@b.c>" -m x'), 'deny');
  assert.equal(decision('git commit --no-verify -m x'), 'deny');
});

test('asks the human before committing test changes', () => {
  const result = evaluate('git commit -m "add tests"', fakeContext({ staged: ['src/db.js', 'tests/unit/db.test.js'] }));
  assert.equal(result.decision, 'ask');
  assert.match(result.reason, /tests\/unit\/db\.test\.js/);
  assert.equal(decision('git commit -m "code"', fakeContext({ staged: ['src/db.js'] })), 'none');
});

test('checks the approved label before creating a feature branch', () => {
  assert.equal(decision('git switch -c feature/12-site'), 'none');
  assert.equal(decision('git checkout -b feature/12-site'), 'none');
  assert.equal(decision('git switch -c feature/99-unapproved'), 'deny');
  assert.equal(decision('git checkout -b my-branch'), 'deny');
  assert.equal(decision('git branch hotfix'), 'deny');
  assert.equal(decision('git worktree add ../wt -b feature/99-x'), 'deny');
});

test('asks when the approval cannot be verified', () => {
  assert.equal(decision('git switch -c feature/12-site', fakeContext({ labels: null })), 'ask');
});

test('does not treat listing or switching as branch creation', () => {
  assert.equal(decision('git branch'), 'none');
  assert.equal(decision('git branch -d old'), 'none');
  assert.equal(decision('git branch --show-current'), 'none');
  assert.equal(decision('git switch feature/12-site'), 'none');
  assert.equal(decision('git checkout -- src/db.js'), 'none');
});

test('asks before adding node modules and blocks other package managers', () => {
  assert.equal(decision('npm install express'), 'ask');
  assert.equal(decision('npm i -D vitest'), 'ask');
  assert.equal(decision('npm install'), 'none');
  assert.equal(decision('npm ci'), 'none');
  assert.equal(decision('npx playwright test'), 'none');
  assert.equal(decision('npx some-tool'), 'ask');
  assert.equal(decision('yarn add react'), 'deny');
});

test('evaluates every command in a chain', () => {
  assert.equal(decision('npm test && git push origin main'), 'deny');
  assert.equal(decision('git -C . push origin main'), 'deny');
});
