'use strict';

// Compares the node modules in package.json with the base branch (main).
// New or changed modules are a critical issue: the check fails until a human
// engineer adds the "deps-approved" label (CI passes DEPS_APPROVED=true).
//
// Usage: node scripts/check-deps.js [--report <file>]
// Env:   BASE_REF (default origin/main), DEPS_APPROVED=true

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { ENGINEER } = require('./lib/policy');

const ROOT = path.join(__dirname, '..');
const DEP_FIELDS = ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies'];

function collectDeps(pkg) {
  const deps = {};
  for (const field of DEP_FIELDS) {
    for (const [name, version] of Object.entries((pkg && pkg[field]) || {})) deps[name] = { version, field };
  }
  return deps;
}

function diffDeps(basePkg, headPkg) {
  const base = collectDeps(basePkg);
  const head = collectDeps(headPkg);
  const added = [];
  const changed = [];
  for (const name of Object.keys(head).sort()) {
    if (!base[name]) added.push({ name, ...head[name] });
    else if (base[name].version !== head[name].version || base[name].field !== head[name].field) {
      changed.push({ name, from: base[name].version, to: head[name].version, field: head[name].field });
    }
  }
  const removed = Object.keys(base).filter((name) => !head[name]).sort();
  return { added, changed, removed };
}

function formatReport(diff, baseRef) {
  const lines = [
    `## Critical: node modules differ from \`${baseRef}\``,
    '',
    `@${ENGINEER} this change adds or changes node modules. Per repository policy this is a critical issue and needs your explicit approval (add the \`deps-approved\` label to the PR).`,
    '',
  ];
  if (diff.added.length) {
    lines.push('| Added | Version | Field |', '| --- | --- | --- |');
    for (const d of diff.added) lines.push(`| \`${d.name}\` | ${d.version} | ${d.field} |`);
    lines.push('');
  }
  if (diff.changed.length) {
    lines.push('| Changed | From | To | Field |', '| --- | --- | --- | --- |');
    for (const d of diff.changed) lines.push(`| \`${d.name}\` | ${d.from} | ${d.to} | ${d.field} |`);
    lines.push('');
  }
  if (diff.removed.length) lines.push(`Removed: ${diff.removed.map((n) => `\`${n}\``).join(', ')}`, '');
  return lines.join('\n');
}

function git(args) {
  return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
}

function main() {
  const baseRef = process.env.BASE_REF || 'origin/main';
  const reportIndex = process.argv.indexOf('--report');
  const reportFile = reportIndex > -1 ? process.argv[reportIndex + 1] : null;
  try {
    git(['rev-parse', '--verify', '--quiet', `${baseRef}^{commit}`]);
  } catch {
    console.log(`Dependency check skipped: base ref "${baseRef}" not found.`);
    return 0;
  }
  let basePkg = {};
  try {
    basePkg = JSON.parse(git(['show', `${baseRef}:package.json`]));
  } catch {
    basePkg = {};
  }
  const headPkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  const diff = diffDeps(basePkg, headPkg);
  if (!diff.added.length && !diff.changed.length) {
    console.log(`Dependency check passed: no new or changed node modules compared with ${baseRef}.`);
    return 0;
  }
  const report = formatReport(diff, baseRef);
  if (reportFile) fs.writeFileSync(reportFile, report, 'utf8');
  console.error(report);
  if (process.env.DEPS_APPROVED === 'true') {
    console.log('A human engineer approved these node modules (deps-approved).');
    return 0;
  }
  return 1;
}

if (require.main === module) process.exitCode = main();

module.exports = { diffDeps, formatReport, collectDeps };
