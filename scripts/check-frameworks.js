'use strict';

// Fails when code diverges from the chosen stack: Node.js, HTML, CSS and
// JavaScript with the W3 frameworks (W3.CSS and W3.JS) and SQLite.
// A failure is a critical issue; CI raises it and tags the engineer.

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const SCAN_DIRS = ['src', 'public', 'scripts', '.claude/hooks'];
const EXTENSIONS = new Set(['.html', '.css', '.js', '.mjs', '.cjs']);

// External assets may only come from the W3 frameworks.
const ALLOWED_ASSETS = [
  /^https:\/\/www\.w3schools\.com\/w3css\/[\w./-]+\.css$/,
  /^https:\/\/www\.w3schools\.com\/lib\/w3\.js$/,
];

const FORBIDDEN_FRAMEWORKS = [
  'react', 'react-dom', 'preact', 'vue', 'angular', '@angular', 'svelte', 'solid-js', 'lit', 'alpinejs', 'htmx',
  'jquery', 'bootstrap', 'tailwind', 'tailwindcss', 'bulma', 'foundation', 'materialize', 'semantic-ui',
  'express', 'koa', 'fastify', 'hapi', 'next', 'nuxt', 'gatsby', 'remix',
  'better-sqlite3', 'sqlite3', 'sequelize', 'typeorm', 'prisma', 'knex', 'mongoose', 'pg', 'mysql', 'mysql2',
];

// Packages that may be imported, and where.
const ALLOWED_PACKAGES = [{ name: '@playwright/test', dirs: ['tests/', 'playwright.config.js'] }];

function packageName(specifier) {
  const parts = specifier.split('/');
  return specifier.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0];
}

function checkImports(relPath, text, violations) {
  const re = /\brequire\(\s*['"]([^'"]+)['"]\s*\)|\bfrom\s+['"]([^'"]+)['"]|\bimport\s*\(?\s*['"]([^'"]+)['"]/g;
  let match;
  while ((match = re.exec(text))) {
    const spec = match[1] || match[2] || match[3];
    if (spec.startsWith('.') || spec.startsWith('/') || spec.startsWith('node:')) continue;
    const name = packageName(spec);
    const allowed = ALLOWED_PACKAGES.find((p) => p.name === name && p.dirs.some((d) => relPath.startsWith(d)));
    if (allowed) continue;
    const reason = FORBIDDEN_FRAMEWORKS.includes(name.toLowerCase())
      ? `"${name}" is a framework outside the chosen stack`
      : `"${spec}" is not a node: built-in or a relative path (use the node: prefix for built-ins; new packages are a critical issue)`;
    violations.push({ file: relPath, rule: 'imports', message: reason });
  }
}

function checkAssets(relPath, text, violations) {
  const re = /<(?:script|link|img|iframe)\b[^>]*?\b(?:src|href)\s*=\s*["']([^"']+)["']/gi;
  let match;
  while ((match = re.exec(text))) {
    const url = match[1];
    if (!/^(https?:)?\/\//i.test(url)) continue;
    if (!ALLOWED_ASSETS.some((allowed) => allowed.test(url))) {
      violations.push({ file: relPath, rule: 'external-asset', message: `external asset "${url}" is not a W3 framework file` });
    }
  }
  const cssImport = /@import\s+(?:url\()?\s*["']?(https?:\/\/[^"')\s]+)/gi;
  while ((match = cssImport.exec(text))) {
    if (!ALLOWED_ASSETS.some((allowed) => allowed.test(match[1]))) {
      violations.push({ file: relPath, rule: 'external-asset', message: `CSS @import of ${match[1]} is not a W3 framework file` });
    }
  }
}

function checkFile(relPath, text) {
  const violations = [];
  const ext = path.extname(relPath).toLowerCase();
  if (['.js', '.mjs', '.cjs'].includes(ext)) checkImports(relPath, text, violations);
  if (['.html', '.js', '.css'].includes(ext)) checkAssets(relPath, text, violations);
  if (ext === '.mjs' || ext === '.ts' || ext === '.tsx' || ext === '.jsx') {
    violations.push({ file: relPath, rule: 'language', message: 'only plain CommonJS JavaScript is used in this repository' });
  }
  return violations;
}

function walk(dir, root, out) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules') walk(full, root, out);
    } else if (EXTENSIONS.has(path.extname(entry.name).toLowerCase()) || /\.(ts|tsx|jsx)$/.test(entry.name)) {
      out.push(path.relative(root, full).split(path.sep).join('/'));
    }
  }
  return out;
}

function checkRepo(root = ROOT) {
  const files = SCAN_DIRS.flatMap((dir) => walk(path.join(root, dir), root, []));
  if (fs.existsSync(path.join(root, 'playwright.config.js'))) files.push('playwright.config.js');
  return files.sort().flatMap((rel) => checkFile(rel, fs.readFileSync(path.join(root, rel), 'utf8')));
}

if (require.main === module) {
  const violations = checkRepo();
  if (violations.length) {
    console.error('Framework check failed (critical issue: code diverges from the chosen stack):');
    for (const v of violations) console.error(`  ${v.file} [${v.rule}] ${v.message}`);
    process.exit(1);
  }
  console.log('Framework check passed: Node.js built-ins, W3.CSS and W3.JS only.');
}

module.exports = { checkFile, checkRepo, FORBIDDEN_FRAMEWORKS };
