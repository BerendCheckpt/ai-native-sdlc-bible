'use strict';

// PreToolUse(Edit|Write|MultiEdit): skills are required procedures. When
// Claude writes a work/<id>/{intent,spec,plan}.md, the result must have every
// heading its skill declares; otherwise the write is blocked and the reason
// names the skill to use.

const fs = require('node:fs');
const path = require('node:path');
const lib = require('./lib');
const { skillFor, checkArtifact } = require(path.join(__dirname, '..', '..', 'scripts', 'check-artifacts.js'));

function applyEdit(text, oldString, newString, replaceAll) {
  if (!oldString) return text;
  return replaceAll ? text.split(oldString).join(newString) : text.replace(oldString, () => newString);
}

// The file content as it would be after the tool call.
function resultingContent(input, readFile) {
  const toolInput = input.tool_input || {};
  if (input.tool_name === 'Write') return toolInput.content || '';
  let current = '';
  try {
    current = readFile(toolInput.file_path);
  } catch {
    current = '';
  }
  if (input.tool_name === 'Edit') return applyEdit(current, toolInput.old_string, toolInput.new_string || '', toolInput.replace_all);
  if (input.tool_name === 'MultiEdit') {
    return (toolInput.edits || []).reduce((text, e) => applyEdit(text, e.old_string, e.new_string || '', e.replace_all), current);
  }
  return null;
}

function evaluate(input, projectDir, readFile = (file) => fs.readFileSync(file, 'utf8')) {
  const rel = lib.relativeToProject((input.tool_input || {}).file_path, projectDir);
  if (!rel) return null;
  const skill = skillFor(rel);
  if (!skill) return null;
  const content = resultingContent(input, readFile);
  if (content === null) return null;
  const problems = checkArtifact(rel, content, projectDir);
  if (!problems.length) return null;
  return lib.deny(`Use the required "${skill}" skill (.claude/skills/${skill}/SKILL.md) to write this artifact. ${problems.join('; ')}.`);
}

if (require.main === module) {
  lib.run((input) => evaluate(input, lib.projectDirFor(input)));
}

module.exports = { evaluate, resultingContent };
