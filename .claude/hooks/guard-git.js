'use strict';

// PreToolUse(Bash): enforces the git and npm rules for Claude.
// - never push or merge to main, never force-push, never commit on main
// - commits keep the configured author ("Jean Claude van Damme")
// - commits that change tests/ need the human engineer's approval
// - feature branches only for approved issues: feature/<issue>-<slug>
// - adding node modules needs approval (it is a critical issue)

const path = require('node:path');
const lib = require('./lib');
const policy = require(path.join(__dirname, '..', '..', 'scripts', 'lib', 'policy.js'));

const MAIN = policy.PROTECTED_BRANCH;
const GIT_GLOBAL_WITH_VALUE = new Set(['-C', '-c', '--git-dir', '--work-tree', '--namespace', '--exec-path']);
const ALLOWED_NPX = new Set(['playwright']);

function parseGit(words) {
  if (lib.programName(words[0]) !== 'git') return null;
  let i = 1;
  while (i < words.length && words[i].startsWith('-')) {
    i += GIT_GLOBAL_WITH_VALUE.has(words[i]) ? 2 : 1;
  }
  return i < words.length ? { sub: words[i], args: words.slice(i + 1) } : null;
}

function positional(args, flagsWithValue = []) {
  const out = [];
  for (let i = 0; i < args.length; i++) {
    if (flagsWithValue.includes(args[i])) i++;
    else if (!args[i].startsWith('-')) out.push(args[i]);
  }
  return out;
}

function checkBranchName(name, ctx) {
  const match = String(name).match(policy.FEATURE_BRANCH_RE);
  if (!match) {
    return lib.deny(`Branch "${name}" does not follow the policy. Claude may only create feature branches named feature/<issue-number>-<slug> for a feature a human engineer approved (label "${policy.APPROVED_LABEL}" on the issue).`);
  }
  const labels = ctx.issueLabels(match[1]);
  if (labels === null) {
    return lib.ask(`Could not verify that issue #${match[1]} is approved (gh unavailable). Human engineer: confirm the feature was approved before this branch is created.`);
  }
  if (!labels.includes(policy.APPROVED_LABEL)) {
    return lib.deny(`Issue #${match[1]} has no "${policy.APPROVED_LABEL}" label. A human engineer must approve the feature before Claude creates its branch. Ask @${policy.ENGINEER} to review the issue.`);
  }
  return null;
}

function newBranchName(sub, args) {
  if (sub === 'checkout') {
    const i = args.findIndex((a) => a === '-b' || a === '-B');
    return i > -1 ? args[i + 1] : null;
  }
  if (sub === 'switch') {
    const i = args.findIndex((a) => a === '-c' || a === '-C' || a === '--create' || a === '--force-create');
    return i > -1 ? args[i + 1] : null;
  }
  if (sub === 'branch') {
    const listing = args.some((a) => /^(-d|-D|--delete|-m|-M|--move|-c|-C|--copy|-l|--list|-a|--all|-r|--remotes|-v|-vv|--verbose|--show-current|--contains|--merged|--no-merged|-u|--set-upstream-to|--unset-upstream|--edit-description)$/.test(a) || a.startsWith('--format') || a.startsWith('--sort'));
    if (listing) return null;
    return positional(args)[0] || null;
  }
  if (sub === 'worktree' && args[0] === 'add') {
    const i = args.findIndex((a) => a === '-b' || a === '-B');
    return i > -1 ? args[i + 1] : null;
  }
  return null;
}

function checkPush(args, ctx) {
  if (args.some((a) => a === '-f' || a === '--force' || a.startsWith('--force-with-lease') || a === '--force-if-includes' || a === '--mirror')) {
    return lib.deny('Force pushes are not allowed. History on shared branches is part of the audit trail.');
  }
  if (args.includes('--all')) return lib.deny('"git push --all" would push main. Push only your feature branch: git push -u origin feature/<issue>-<slug>.');
  const [, ...refspecs] = positional(args, ['-o', '--push-option', '--repo', '--receive-pack', '--exec']);
  const targets = refspecs.length ? refspecs : [ctx.currentBranch()];
  for (const refspec of targets) {
    if (refspec.startsWith('+')) return lib.deny('Force pushes ("+refspec") are not allowed.');
    const parts = refspec.split(':');
    const dst = (parts.length > 1 ? parts[1] : parts[0]).replace(/^refs\/heads\//, '');
    const src = parts[0];
    if (dst === MAIN || (dst === 'HEAD' && ctx.currentBranch() === MAIN) || (parts.length === 1 && src === 'HEAD' && ctx.currentBranch() === MAIN)) {
      return lib.deny(`Claude never pushes to ${MAIN}. Push the feature branch and open a pull request; a human engineer must review and approve every merge to ${MAIN}.`);
    }
    if (parts.length > 1 && src === '') return lib.deny('Deleting remote branches is not allowed for Claude.');
  }
  if (args.includes('--delete') || args.includes('-d')) return lib.deny('Deleting remote branches is not allowed for Claude.');
  return null;
}

function checkCommit(args, ctx) {
  if (ctx.currentBranch() === MAIN) {
    return lib.deny(`Claude never commits on ${MAIN}. Create an approved feature branch (feature/<issue>-<slug>) first.`);
  }
  if (args.some((a) => a === '--author' || a.startsWith('--author='))) {
    return lib.deny(`Do not override the commit author. Claude commits as "${policy.AUTHOR_NAME}" (set in .claude/settings.json).`);
  }
  if (args.some((a) => a === '--no-verify' || a === '-n')) {
    return lib.deny('Skipping git hooks (--no-verify) is not allowed.');
  }
  const all = args.some((a) => a === '--all' || /^-[A-Za-z]*a[A-Za-z]*$/.test(a));
  const files = ctx.stagedFiles({ all });
  const tests = files.filter((file) => policy.classifyPath(file) === 'tests');
  if (tests.length) {
    return lib.ask(`This commit changes test files:\n  ${tests.join('\n  ')}\nRepository policy: Claude may write tests, but the human engineer must approve every commit that changes tests. Approve only if you reviewed these test changes.`);
  }
  return null;
}

function checkNpm(words) {
  const program = lib.programName(words[0]);
  if (['yarn', 'pnpm', 'bun'].includes(program)) {
    return lib.deny(`This repository uses npm only. "${program}" would introduce another toolchain, which diverges from the chosen stack.`);
  }
  if (program === 'npx') {
    const target = positional(words.slice(1))[0];
    if (target && !ALLOWED_NPX.has(target)) {
      return lib.ask(`"npx ${target}" downloads and runs a package that is not part of this repository. Running new node modules is a critical issue; approve only if @${policy.ENGINEER} agreed.`);
    }
    return null;
  }
  if (program !== 'npm') return null;
  const [sub, ...rest] = words.slice(1).filter((w) => !w.startsWith('-'));
  if (['install', 'i', 'add', 'isntall', 'in', 'ins', 'inst', 'insta', 'instal', 'install-test', 'it'].includes(sub) && rest.length) {
    return lib.ask(`"npm ${sub} ${rest.join(' ')}" adds node modules. New node modules compared with ${MAIN} are a critical issue: open a critical issue tagging @${policy.ENGINEER} and get approval first.`);
  }
  if (['uninstall', 'remove', 'rm', 'un', 'update', 'up', 'upgrade'].includes(sub)) {
    return lib.ask(`"npm ${sub}" changes the node modules of this repository. The human engineer must approve dependency changes.`);
  }
  return null;
}

function evaluateSegment(words, ctx) {
  const npm = checkNpm(words);
  if (npm) return npm;
  const git = parseGit(words);
  if (!git) return null;
  const { sub, args } = git;
  if (sub === 'push') return checkPush(args, ctx);
  if (sub === 'commit') return checkCommit(args, ctx);
  if (sub === 'merge' && ctx.currentBranch() === MAIN) {
    return lib.deny(`Claude never merges into ${MAIN}. Changes reach ${MAIN} only through a pull request approved by a human engineer.`);
  }
  if (sub === 'rebase' && ctx.currentBranch() === MAIN) return lib.deny(`Claude never rewrites ${MAIN}.`);
  if (sub === 'reset' && args.includes('--hard') && ctx.currentBranch() === MAIN) {
    return lib.ask(`"git reset --hard" on ${MAIN} discards work. Approve only if this is intended.`);
  }
  const branch = newBranchName(sub, args);
  if (branch) return checkBranchName(branch, ctx);
  return null;
}

function evaluate(command, ctx) {
  return lib.strongest(lib.segments(command).map((words) => evaluateSegment(words, ctx)));
}

function defaultContext(cwd) {
  let branch;
  return {
    currentBranch() {
      if (branch === undefined) {
        try {
          branch = lib.runCommand('git', ['rev-parse', '--abbrev-ref', 'HEAD'], cwd).trim();
          if (branch === 'HEAD') branch = lib.runCommand('git', ['symbolic-ref', '--short', 'HEAD'], cwd).trim();
        } catch {
          try {
            branch = lib.runCommand('git', ['symbolic-ref', '--short', 'HEAD'], cwd).trim();
          } catch {
            branch = '';
          }
        }
      }
      return branch;
    },
    stagedFiles({ all }) {
      const staged = lib.runCommand('git', ['diff', '--cached', '--name-only'], cwd).split('\n');
      const tracked = all ? lib.runCommand('git', ['diff', '--name-only'], cwd).split('\n') : [];
      return [...new Set([...staged, ...tracked].map((s) => s.trim()).filter(Boolean))];
    },
    issueLabels(number) {
      try {
        const out = lib.runCommand('gh', ['issue', 'view', String(number), '--json', 'labels', '--jq', '.labels[].name'], cwd);
        return out.split('\n').map((s) => s.trim()).filter(Boolean);
      } catch {
        return null;
      }
    },
  };
}

if (require.main === module) {
  lib.run((input) => {
    if (input.tool_name !== 'Bash') return null;
    const command = (input.tool_input && input.tool_input.command) || '';
    return evaluate(command, defaultContext(lib.projectDirFor(input)));
  });
}

module.exports = { evaluate, parseGit, newBranchName };
