'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { evaluate } = require('../../.claude/hooks/protect-paths');

const root = path.resolve('project-root');
const edit = (...parts) => ({ tool_name: 'Edit', tool_input: { file_path: path.join(root, ...parts) } });
const decision = (input) => (evaluate(input, root) || { decision: 'none' }).decision;

test('denies edits to human-maintained content', () => {
  assert.equal(decision(edit('content', 'stages', 'plan', 'details.md')), 'deny');
});

test('denies edits to secrets but allows the example file', () => {
  assert.equal(decision(edit('.env')), 'deny');
  assert.equal(decision(edit('.env.local')), 'deny');
  assert.equal(decision(edit('certs', 'server.key')), 'deny');
  assert.equal(decision(edit('data', 'bible.db')), 'deny');
  assert.equal(decision(edit('.env.example')), 'none');
});

test('asks before editing governance files', () => {
  assert.equal(decision(edit('CLAUDE.md')), 'ask');
  assert.equal(decision(edit('src', 'CLAUDE.md')), 'ask');
  assert.equal(decision(edit('REVIEW.md')), 'ask');
  assert.equal(decision(edit('.claude', 'skills', 'write-pr', 'SKILL.md')), 'ask');
  assert.equal(decision(edit('.claude', 'agents', 'test-writer.md')), 'ask');
  assert.equal(decision(edit('.claude', 'settings.json')), 'ask');
  assert.equal(decision(edit('.github', 'workflows', 'ci.yml')), 'ask');
});

test('allows ordinary source, docs and work files', () => {
  assert.equal(decision(edit('src', 'server.js')), 'none');
  assert.equal(decision(edit('docs', 'architecture.md')), 'none');
  assert.equal(decision(edit('work', '12-site', 'drafts', 'content', 'pages', 'x.md')), 'none');
  assert.equal(decision({ tool_name: 'Edit', tool_input: { file_path: path.resolve('outside', 'x.md') } }), 'none');
});

test('prints a PreToolUse decision when run as a hook', () => {
  const input = JSON.stringify({ tool_name: 'Write', cwd: root, tool_input: { file_path: path.join(root, 'content', 'x.md'), content: '' } });
  const hook = path.join(__dirname, '..', '..', '.claude', 'hooks', 'protect-paths.js');
  const out = spawnSync(process.execPath, [hook], { input, encoding: 'utf8', env: { ...process.env, CLAUDE_PROJECT_DIR: root } });
  assert.equal(out.status, 0);
  const parsed = JSON.parse(out.stdout);
  assert.equal(parsed.hookSpecificOutput.hookEventName, 'PreToolUse');
  assert.equal(parsed.hookSpecificOutput.permissionDecision, 'deny');
});
