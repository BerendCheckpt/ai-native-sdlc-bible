'use strict';

// PreToolUse(Bash): enforces the GitHub CLI rules for Claude.
// - never merge or approve pull requests (humans approve every merge to main)
// - every PR Claude opens contains a non-empty "## Justification" section
// - critical issues always tag the engineer; new features are always critical
// - never set labels that record a human decision (approved, deps-approved)
// - never change branch protection or delete the repository

const fs = require('node:fs');
const path = require('node:path');
const lib = require('./lib');
const policy = require(path.join(__dirname, '..', '..', 'scripts', 'lib', 'policy.js'));
const { checkPrBody } = require(path.join(__dirname, '..', '..', 'scripts', 'check-pr.js'));

function labelsFrom(args, names) {
  return lib.flagValues(args, names).flatMap((v) => v.split(',')).map((s) => s.trim().toLowerCase()).filter(Boolean);
}

function bodyFrom(args, rawCommand, readFile) {
  const files = lib.flagValues(args, ['-F', '--body-file']);
  if (files.length) {
    if (files[0] === '-') return rawCommand;
    try {
      return readFile(files[0]);
    } catch {
      return '';
    }
  }
  const bodies = lib.flagValues(args, ['-b', '--body']);
  return bodies.length ? bodies.join('\n') : '';
}

function evaluateSegment(words, rawCommand, ctx) {
  if (lib.programName(words[0]) !== 'gh') return null;
  const [group, action, ...args] = words.slice(1);

  if (group === 'pr' && action === 'merge') {
    return lib.deny('Claude never merges pull requests. A human engineer must review, approve and merge every change to main.');
  }
  if (group === 'pr' && action === 'review' && args.some((a) => a === '--approve' || a === '-a')) {
    return lib.deny('Claude never approves pull requests. Approval is reserved for human engineers.');
  }
  if (group === 'pr' && action === 'create') {
    if (args.includes('--fill') || args.includes('-f') || args.includes('--fill-first') || args.includes('--fill-verbose')) {
      return lib.deny('Do not use --fill. Write the PR description with the write-pr skill, including a "## Justification" section.');
    }
    const body = bodyFrom(args, rawCommand, ctx.readFile);
    // Heredoc bodies with nested quotes can confuse the tokenizer, so the raw
    // command is accepted as a fallback source for the section.
    const problems = checkPrBody(body).length && checkPrBody(rawCommand).length ? checkPrBody(body) : [];
    if (problems.length) {
      return lib.deny(`${problems.join(' ')} Claude must justify every pull request it creates (write-pr skill).`);
    }
    return null;
  }
  if ((group === 'pr' || group === 'issue') && action === 'edit') {
    const added = labelsFrom(args, ['--add-label']);
    const forbidden = added.filter((label) => policy.HUMAN_ONLY_LABELS.includes(label));
    if (forbidden.length) {
      return lib.deny(`Only a human engineer may set the label(s) ${forbidden.join(', ')}. These labels record a human approval.`);
    }
    return null;
  }
  if (group === 'issue' && action === 'create') {
    const labels = labelsFrom(args, ['-l', '--label']);
    const forbidden = labels.filter((label) => policy.HUMAN_ONLY_LABELS.includes(label));
    if (forbidden.length) return lib.deny(`Only a human engineer may set the label(s) ${forbidden.join(', ')}.`);
    if (labels.includes(policy.FEATURE_LABEL) && !labels.includes(policy.CRITICAL_LABEL)) {
      return lib.deny(`New features are critical issues in this repository. Add --label ${policy.CRITICAL_LABEL} and --assignee ${policy.ENGINEER} (create-issue skill).`);
    }
    if (labels.includes(policy.CRITICAL_LABEL)) {
      const assignees = labelsFrom(args, ['-a', '--assignee']);
      const body = bodyFrom(args, rawCommand, ctx.readFile);
      const tagged = assignees.includes(policy.ENGINEER.toLowerCase()) || body.toLowerCase().includes(`@${policy.ENGINEER.toLowerCase()}`);
      if (!tagged) {
        return lib.deny(`Critical issues must tag the engineer: add --assignee ${policy.ENGINEER} or mention @${policy.ENGINEER} in the body (create-issue skill).`);
      }
    }
    return null;
  }
  if (group === 'label') {
    return lib.ask('Changing repository labels affects the approval workflow. Approve only if the human engineer requested this.');
  }
  if (group === 'repo' && (action === 'delete' || action === 'archive' || action === 'rename')) {
    return lib.deny(`"gh repo ${action}" is not allowed for Claude.`);
  }
  if (group === 'repo' && action === 'edit') {
    return lib.ask('Changing repository settings needs the human engineer\'s approval.');
  }
  if (group === 'api') {
    const raw = words.join(' ');
    if (/\/branches\/[^\s/]+\/protection|\/rulesets\b|\/collaborators\b/.test(raw)) {
      return lib.deny('Claude never changes branch protection, rulesets or collaborators. The human engineer manages these (scripts/setup-branch-protection.ps1).');
    }
    if (/\/labels\b/.test(raw) && policy.HUMAN_ONLY_LABELS.some((label) => raw.toLowerCase().includes(label))) {
      return lib.deny(`Only a human engineer may set the labels ${policy.HUMAN_ONLY_LABELS.join(', ')}.`);
    }
    const method = lib.flagValues(words, ['-X', '--method'])[0];
    if (method && method.toUpperCase() !== 'GET') {
      return lib.ask(`"gh api" with ${method.toUpperCase()} changes data on GitHub. Approve only if this is intended.`);
    }
  }
  return null;
}

function evaluate(command, ctx) {
  return lib.strongest(lib.segments(command).map((words) => evaluateSegment(words, command, ctx)));
}

function defaultContext(cwd) {
  return { readFile: (file) => fs.readFileSync(path.resolve(cwd, file), 'utf8') };
}

if (require.main === module) {
  lib.run((input) => {
    if (input.tool_name !== 'Bash') return null;
    const command = (input.tool_input && input.tool_input.command) || '';
    return evaluate(command, defaultContext((input && input.cwd) || lib.projectDirFor(input)));
  });
}

module.exports = { evaluate };
