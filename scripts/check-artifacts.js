'use strict';

// Verifies that every work/<id>/{intent,spec,plan}.md has the structure its
// required skill declares. The required headings are read from the skill's
// own SKILL.md ("## Required headings"), so the skill stays the single source
// of the procedure and this check only verifies it was followed.

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const ARTIFACT_SKILLS = { 'intent.md': 'write-intent', 'spec.md': 'write-spec', 'plan.md': 'write-plan' };

function normalize(heading) {
  return heading.trim().replace(/\s+/g, ' ').toLowerCase();
}

function requiredHeadings(skillMarkdown) {
  const lines = String(skillMarkdown).replace(/\r\n?/g, '\n').split('\n');
  const start = lines.findIndex((line) => /^##\s+Required headings\s*$/i.test(line));
  if (start === -1) return [];
  const headings = [];
  for (const line of lines.slice(start + 1)) {
    if (/^##\s/.test(line)) break;
    const match = line.match(/^\s*-\s+`(#{1,6}\s+[^`]+)`\s*$/);
    if (match) headings.push(match[1].trim());
  }
  return headings;
}

function missingHeadings(doc, required) {
  const present = new Set(String(doc).replace(/\r\n?/g, '\n').split('\n')
    .filter((line) => /^#{1,6}\s/.test(line))
    .map(normalize));
  return required.filter((heading) => !present.has(normalize(heading)));
}

function skillFor(relPath) {
  const match = String(relPath).replace(/\\/g, '/').match(/^work\/[^/]+\/(intent|spec|plan)\.md$/);
  return match ? ARTIFACT_SKILLS[`${match[1]}.md`] : null;
}

function loadSkill(skill, root = ROOT) {
  const file = path.join(root, '.claude', 'skills', skill, 'SKILL.md');
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
}

// Returns the list of problems for one artifact ([] when it complies).
function checkArtifact(relPath, text, root = ROOT) {
  const skill = skillFor(relPath);
  if (!skill) return [];
  const skillText = loadSkill(skill, root);
  if (!skillText) return [`${relPath}: required skill "${skill}" not found in .claude/skills/${skill}/SKILL.md`];
  return missingHeadings(text, requiredHeadings(skillText))
    .map((heading) => `${relPath}: missing "${heading}" (required by the ${skill} skill)`);
}

function checkRepo(root = ROOT) {
  const workDir = path.join(root, 'work');
  if (!fs.existsSync(workDir)) return [];
  const problems = [];
  for (const entry of fs.readdirSync(workDir, { withFileTypes: true }).filter((e) => e.isDirectory()).sort((a, b) => a.name.localeCompare(b.name))) {
    for (const artifact of Object.keys(ARTIFACT_SKILLS)) {
      const rel = `work/${entry.name}/${artifact}`;
      const file = path.join(root, rel);
      if (fs.existsSync(file)) problems.push(...checkArtifact(rel, fs.readFileSync(file, 'utf8'), root));
    }
  }
  return problems;
}

if (require.main === module) {
  const problems = checkRepo();
  if (problems.length) {
    console.error('Artifact check failed:');
    for (const p of problems) console.error(`  ${p}`);
    process.exit(1);
  }
  console.log('Artifact check passed: every work/ artifact follows its required skill.');
}

module.exports = { requiredHeadings, missingHeadings, skillFor, checkArtifact, checkRepo, ARTIFACT_SKILLS };
