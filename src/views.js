'use strict';

// Minimal server-side templates: {{name}} is HTML-escaped, {{{name}}} is
// inserted as-is (only for HTML this application rendered itself).

const fs = require('node:fs');
const path = require('node:path');
const { escapeHtml } = require('./markdown');

const VIEWS_DIR = path.join(__dirname, 'views');

function fill(template, data) {
  return template.replace(/\{\{\{\s*(\w+)\s*\}\}\}|\{\{\s*(\w+)\s*\}\}/g, (match, raw, escaped) => {
    if (raw) return data[raw] == null ? '' : String(data[raw]);
    return data[escaped] == null ? '' : escapeHtml(data[escaped]);
  });
}

function loadViews(dir = VIEWS_DIR) {
  const views = {};
  for (const name of ['layout', 'home', 'stage', 'page', 'search', 'not-found']) {
    views[name] = fs.readFileSync(path.join(dir, `${name}.html`), 'utf8');
  }
  return views;
}

module.exports = { fill, loadViews };
