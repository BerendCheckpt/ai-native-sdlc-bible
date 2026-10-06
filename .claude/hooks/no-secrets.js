'use strict';

// PreToolUse(Bash): scans the staged diff before every git commit and blocks
// the commit when it contains credentials or sensitive files.

const path = require('node:path');
const lib = require('./lib');
const policy = require(path.join(__dirname, '..', '..', 'scripts', 'lib', 'policy.js'));

const PATTERNS = [
  { name: 'private key', re: /-----BEGIN (?:RSA |EC |DSA |OPENSSH |PGP )?PRIVATE KEY-----/ },
  { name: 'AWS access key', re: /\bAKIA[0-9A-Z]{16}\b/ },
  { name: 'GitHub token', re: /\b(?:gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{40,})\b/ },
  { name: 'Anthropic API key', re: /\bsk-ant-[A-Za-z0-9_-]{20,}/ },
  { name: 'OpenAI-style API key', re: /\bsk-(?:proj-)?[A-Za-z0-9]{32,}\b/ },
  { name: 'Slack token', re: /\bxox[abprs]-[A-Za-z0-9-]{10,}/ },
  { name: 'hard-coded credential', re: /\b(?:password|passwd|secret|api[_-]?key|access[_-]?token|auth[_-]?token)\b\s*[:=]\s*["'][^"'\s]{8,}["']/i },
];

// Returns findings for added lines in a unified diff: [{ file, line, name }].
function scanDiff(diff) {
  const findings = [];
  let file = null;
  let lineNo = 0;
  for (const line of String(diff).split('\n')) {
    if (line.startsWith('+++ ')) {
      file = line.slice(4).replace(/^b\//, '');
      continue;
    }
    const hunk = line.match(/^@@ -\d+(?:,\d+)? \+(\d+)/);
    if (hunk) {
      lineNo = Number(hunk[1]) - 1;
      continue;
    }
    if (line.startsWith('+') && !line.startsWith('+++')) {
      lineNo++;
      for (const pattern of PATTERNS) {
        if (pattern.re.test(line)) findings.push({ file, line: lineNo, name: pattern.name });
      }
    } else if (!line.startsWith('-')) {
      lineNo++;
    }
  }
  return findings;
}

function isCommit(words) {
  if (lib.programName(words[0]) !== 'git') return false;
  return words.slice(1).find((w) => !w.startsWith('-')) === 'commit';
}

function evaluate(command, ctx) {
  const commit = lib.segments(command).find(isCommit);
  if (!commit) return null;
  const all = commit.some((a) => a === '--all' || /^-[A-Za-z]*a[A-Za-z]*$/.test(a));
  const sensitive = ctx.stagedFiles({ all }).filter((file) => policy.classifyPath(file) === 'secret');
  if (sensitive.length) {
    return lib.deny(`Sensitive files are staged: ${sensitive.join(', ')}. Unstage them (git restore --staged <file>) and make sure they are listed in .gitignore.`);
  }
  const findings = scanDiff(ctx.stagedDiff({ all }));
  if (findings.length) {
    const list = findings.map((f) => `${f.file}:${f.line} (${f.name})`).join(', ');
    return lib.deny(`Possible credentials in the staged changes: ${list}. Remove them, load secrets from .env (gitignored) and commit again.`);
  }
  return null;
}

function defaultContext(cwd) {
  return {
    stagedFiles({ all }) {
      const staged = lib.runCommand('git', ['diff', '--cached', '--name-only'], cwd).split('\n');
      const tracked = all ? lib.runCommand('git', ['diff', '--name-only'], cwd).split('\n') : [];
      return [...new Set([...staged, ...tracked].map((s) => s.trim()).filter(Boolean))];
    },
    stagedDiff({ all }) {
      const staged = lib.runCommand('git', ['diff', '--cached', '--unified=0', '--no-color'], cwd);
      return all ? staged + lib.runCommand('git', ['diff', '--unified=0', '--no-color'], cwd) : staged;
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

module.exports = { evaluate, scanDiff, PATTERNS };
