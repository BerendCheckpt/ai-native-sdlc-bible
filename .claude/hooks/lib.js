'use strict';

// Shared helpers for the PreToolUse hooks. Each hook exports a pure
// evaluate() function (unit-tested in tests/hooks/) and only touches stdin,
// stdout, git and gh when run as a script.

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const RANK = { allow: 0, ask: 1, deny: 2 };

function deny(reason) {
  return { decision: 'deny', reason };
}

function ask(reason) {
  return { decision: 'ask', reason };
}

// Picks the strictest decision: deny > ask > nothing.
function strongest(decisions) {
  return decisions.filter(Boolean).reduce((best, d) => (!best || RANK[d.decision] > RANK[best.decision] ? d : best), null);
}

// Splits a shell command into tokens, honouring quotes and escapes.
// Control operators (; && || | & and newlines) become { op } tokens.
function tokenize(command) {
  const tokens = [];
  let current = '';
  let started = false;
  const push = () => {
    if (started) tokens.push(current);
    current = '';
    started = false;
  };
  const cmd = String(command);
  let i = 0;
  while (i < cmd.length) {
    const c = cmd[i];
    if (c === "'") {
      const end = cmd.indexOf("'", i + 1);
      const stop = end === -1 ? cmd.length : end;
      current += cmd.slice(i + 1, stop);
      started = true;
      i = stop + 1;
    } else if (c === '"') {
      i++;
      while (i < cmd.length && cmd[i] !== '"') {
        if (cmd[i] === '\\' && i + 1 < cmd.length && '"\\$`'.includes(cmd[i + 1])) {
          current += cmd[i + 1];
          i += 2;
        } else {
          current += cmd[i++];
        }
      }
      i++;
      started = true;
    } else if (c === '\\' && i + 1 < cmd.length) {
      if (cmd[i + 1] !== '\n') current += cmd[i + 1];
      started = started || cmd[i + 1] !== '\n';
      i += 2;
    } else if (c === '\n' || c === ';') {
      push();
      tokens.push({ op: c });
      i++;
    } else if (c === '&' || c === '|') {
      push();
      if (cmd[i + 1] === c) {
        tokens.push({ op: c + c });
        i += 2;
      } else {
        tokens.push({ op: c });
        i++;
      }
    } else if (/\s/.test(c)) {
      push();
      i++;
    } else {
      current += c;
      started = true;
      i++;
    }
  }
  push();
  return tokens;
}

// Returns the simple commands in a command line, each as an array of words,
// with leading VAR=value assignments removed.
function segments(command) {
  const result = [];
  let current = [];
  for (const token of tokenize(command)) {
    if (typeof token === 'object') {
      if (current.length) result.push(current);
      current = [];
    } else {
      current.push(token);
    }
  }
  if (current.length) result.push(current);
  return result
    .map((words) => {
      let start = 0;
      while (start < words.length && /^[A-Za-z_][A-Za-z0-9_]*=/.test(words[start])) start++;
      return words.slice(start);
    })
    .filter((words) => words.length);
}

function programName(word) {
  return path.basename(String(word)).replace(/\.(exe|cmd|bat)$/i, '').toLowerCase();
}

// Values passed to a flag, e.g. flagValues(['-l', 'a,b', '--label=c'], ['-l', '--label']) => ['a,b', 'c'].
function flagValues(args, names) {
  const values = [];
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    for (const name of names) {
      if (arg === name && i + 1 < args.length) values.push(args[i + 1]);
      else if (name.startsWith('--') && arg.startsWith(`${name}=`)) values.push(arg.slice(name.length + 1));
    }
  }
  return values;
}

function relativeToProject(filePath, projectDir) {
  if (!filePath) return null;
  const rel = path.relative(projectDir, path.resolve(projectDir, filePath));
  if (!rel || rel.startsWith('..') || path.isAbsolute(rel)) return null;
  return rel.split(path.sep).join('/');
}

function projectDirFor(input) {
  return process.env.CLAUDE_PROJECT_DIR || (input && input.cwd) || process.cwd();
}

function runCommand(cmd, args, cwd) {
  return execFileSync(cmd, args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 15000 });
}

function writeDecision(result) {
  if (!result) return;
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: result.decision,
      permissionDecisionReason: result.reason,
    },
  }));
}

// Runs a hook: reads the tool call from stdin and prints the decision.
// Unexpected errors fail towards a human decision ("ask"), never silently.
function run(evaluate) {
  let input;
  try {
    const raw = fs.readFileSync(0, 'utf8');
    input = raw.trim() ? JSON.parse(raw) : {};
  } catch (err) {
    writeDecision(ask(`Policy hook could not read its input (${err.message}). Asking the human engineer to review this action.`));
    return;
  }
  try {
    writeDecision(evaluate(input));
  } catch (err) {
    writeDecision(ask(`Policy hook failed (${err.message}). Asking the human engineer to review this action.`));
  }
}

module.exports = {
  deny,
  ask,
  strongest,
  tokenize,
  segments,
  programName,
  flagValues,
  relativeToProject,
  projectDirFor,
  runCommand,
  run,
};
