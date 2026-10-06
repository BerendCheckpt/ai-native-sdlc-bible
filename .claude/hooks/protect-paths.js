'use strict';

// PreToolUse(Edit|Write|MultiEdit|NotebookEdit): protects paths by owner.
// - secrets (.env, keys, local databases): never touched by Claude
// - content/: best practices are maintained by human engineers
// - CLAUDE.md, REVIEW.md, .claude/, .github/: governance files; every edit
//   needs approval and ships in its own PR reviewed by the engineer

const path = require('node:path');
const lib = require('./lib');
const policy = require(path.join(__dirname, '..', '..', 'scripts', 'lib', 'policy.js'));

function evaluate(input, projectDir) {
  const toolInput = input.tool_input || {};
  const rel = lib.relativeToProject(toolInput.file_path || toolInput.notebook_path, projectDir);
  if (!rel) return null;
  switch (policy.classifyPath(rel)) {
    case 'secret':
      return lib.deny(`${rel} holds sensitive data. Claude never reads or writes secrets; they stay out of git via .gitignore.`);
    case 'human-content':
      return lib.deny(`${rel} is best-practice content maintained by human engineers. Propose the change in an issue or a draft under work/<id>/drafts/ instead.`);
    case 'governance':
      return lib.ask(`${rel} is a governance file (CLAUDE.md, REVIEW.md, skills, subagents, hooks or CI). Changes must ship in their own pull request reviewed and approved by @${policy.ENGINEER}. Approve this edit only if that is the plan.`);
    default:
      return null;
  }
}

if (require.main === module) {
  lib.run((input) => evaluate(input, lib.projectDirFor(input)));
}

module.exports = { evaluate };
