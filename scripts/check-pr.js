'use strict';

// PR policy check for CI. Verifies the PR body has a non-empty
// "## Justification" section (required by the write-pr skill) and reports
// whether governance files changed.
//
// Env: PR_BODY (the PR description), CHANGED_FILES (newline-separated paths)
// Writes "governance=true|false" to $GITHUB_OUTPUT when available.

const fs = require('node:fs');
const { classifyPath } = require('./lib/policy');

function sectionBody(markdown, title) {
  const text = String(markdown || '').replace(/\r\n?/g, '\n').replace(/<!--[\s\S]*?-->/g, '');
  const lines = text.split('\n');
  const start = lines.findIndex((line) => new RegExp(`^##\\s+${title}\\s*$`, 'i').test(line));
  if (start === -1) return null;
  const body = [];
  for (const line of lines.slice(start + 1)) {
    if (/^##\s/.test(line)) break;
    body.push(line);
  }
  return body.join('\n').trim();
}

function checkPrBody(body) {
  const justification = sectionBody(body, 'Justification');
  if (justification === null) return ['The PR description has no "## Justification" section (see .github/pull_request_template.md).'];
  if (!justification) return ['The "## Justification" section is empty. Explain why this change is needed, the alternatives considered and the remaining risks.'];
  return [];
}

function governanceFiles(changedFiles) {
  return changedFiles.filter((file) => classifyPath(file) === 'governance');
}

if (require.main === module) {
  const problems = checkPrBody(process.env.PR_BODY || '');
  const changed = (process.env.CHANGED_FILES || '').split('\n').map((s) => s.trim()).filter(Boolean);
  const governance = governanceFiles(changed);
  if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `governance=${governance.length > 0}\n`);
  if (governance.length) console.log(`Governance files changed (code-owner review required):\n  ${governance.join('\n  ')}`);
  if (problems.length) {
    for (const p of problems) console.error(p);
    process.exit(1);
  }
  console.log('PR policy check passed.');
}

module.exports = { checkPrBody, sectionBody, governanceFiles };
