'use strict';

// Single source of truth for the repository's version-control policy. The
// Claude Code hooks (.claude/hooks/) and the CI scripts both read from here,
// so a rule can never be enforced differently in two places.

const ENGINEER = process.env.SDLC_ENGINEER || 'BerendCheckpt';
const AUTHOR_NAME = 'Jean Claude van Damme';
const PROTECTED_BRANCH = 'main';
const FEATURE_BRANCH_RE = /^feature\/(\d+)-[a-z0-9][a-z0-9-]*$/;
const APPROVED_LABEL = 'approved';
const DEPS_APPROVED_LABEL = 'deps-approved';
const CRITICAL_LABEL = 'critical';
const FEATURE_LABEL = 'feature';
// Labels that record a human decision; the agent must never set them.
const HUMAN_ONLY_LABELS = [APPROVED_LABEL, DEPS_APPROVED_LABEL];

const PATH_RULES = [
  { kind: 'secret', re: /(^|\/)\.env(\.(?!example$)[^/]*)?$/i },
  { kind: 'secret', re: /\.(pem|key|p12|pfx)$/i },
  { kind: 'secret', re: /^data\/.+\.db(-journal|-wal|-shm)?$/i },
  { kind: 'human-content', re: /^content\//i },
  { kind: 'governance', re: /(^|\/)CLAUDE\.md$/i },
  { kind: 'governance', re: /^REVIEW\.md$/i },
  { kind: 'governance', re: /^\.claude\//i },
  { kind: 'governance', re: /^\.github\//i },
  { kind: 'governance', re: /^scripts\/lib\/policy\.js$/i },
  { kind: 'tests', re: /^tests\//i },
];

function toPosix(p) {
  return String(p).replace(/\\/g, '/').replace(/^\.\//, '');
}

// Returns 'secret' | 'human-content' | 'governance' | 'tests' | null.
function classifyPath(relPath) {
  const p = toPosix(relPath);
  const rule = PATH_RULES.find((r) => r.re.test(p));
  return rule ? rule.kind : null;
}

module.exports = {
  ENGINEER,
  AUTHOR_NAME,
  PROTECTED_BRANCH,
  FEATURE_BRANCH_RE,
  APPROVED_LABEL,
  DEPS_APPROVED_LABEL,
  CRITICAL_LABEL,
  FEATURE_LABEL,
  HUMAN_ONLY_LABELS,
  toPosix,
  classifyPath,
};
