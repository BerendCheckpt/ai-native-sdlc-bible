'use strict';

// HTTP server built on node:http only (no web framework). Pages are rendered
// from SQLite; static assets are served from public/.

const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const db = require('./db');
const { route } = require('./router');
const { fill, loadViews } = require('./views');
const { escapeHtml } = require('./markdown');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const W3_HOST = 'https://www.w3schools.com';

const CONTENT_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
};

const SECURITY_HEADERS = {
  'Content-Security-Policy': [
    "default-src 'self'",
    `style-src 'self' ${W3_HOST}`,
    `script-src 'self' ${W3_HOST}`,
    "img-src 'self' data:",
    "connect-src 'self'",
    "base-uri 'none'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; '),
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'X-Frame-Options': 'DENY',
};

const STAGE_ARROWS = { wide: ['→', '→', '↓', '←', '←', '↑'], tall: '↓' };

function send(res, req, status, body, contentType = 'text/html; charset=utf-8', extraHeaders = {}) {
  res.writeHead(status, { ...SECURITY_HEADERS, 'Content-Type': contentType, ...extraHeaders });
  res.end(req.method === 'HEAD' ? undefined : body);
}

function navLinks(database, current, className) {
  const links = [`<a href="/#stages" class="${className}">Stages</a>`];
  for (const page of db.getNavPages(database)) {
    const active = page.slug === current ? ' aria-current="page"' : '';
    links.push(`<a href="/${page.slug}" class="${className}"${active}>${escapeHtml(page.nav_label)}</a>`);
  }
  return links.join('\n');
}

function stageCards(stages) {
  return stages.map((stage, i) => {
    const next = stages[(i + 1) % stages.length];
    const wideArrow = STAGE_ARROWS.wide[i] || '→';
    return `<li class="stage-card">
<a class="w3-card w3-hover-shadow w3-round-large stage-link" href="/stages/${stage.slug}">
<span class="w3-tag w3-round stage-num">${stage.position}</span>
<h3>${escapeHtml(stage.title)}</h3>
<p class="stage-artifact">Commits ${stage.artifactHtml}</p>
<p class="stage-summary">${stage.summaryHtml}</p>
<span class="stage-next"><span class="w3-hide-small" aria-hidden="true">${wideArrow}</span><span class="w3-hide-medium w3-hide-large" aria-hidden="true">${STAGE_ARROWS.tall}</span> Next: ${escapeHtml(next.title)}</span>
</a>
</li>`;
  }).join('\n');
}

function createApp({ database, views = loadViews(), publicDir = PUBLIC_DIR }) {
  const pageSlugs = new Set(db.getNavPages(database).map((page) => page.slug));

  function layout(res, req, status, { title, description, current, body }) {
    const html = fill(views.layout, {
      title,
      description,
      navLinks: navLinks(database, current, 'w3-bar-item w3-button w3-hide-small'),
      mobileNavLinks: navLinks(database, current, 'w3-bar-item w3-button'),
      body,
    });
    send(res, req, status, html);
  }

  function notFound(res, req) {
    layout(res, req, 404, { title: 'Page not found', description: 'Page not found', body: fill(views['not-found'], {}) });
  }

  function home(res, req) {
    const intro = db.getPage(database, 'home');
    const body = fill(views.home, {
      stageCards: stageCards(db.getStages(database)),
      dynamicsWide: db.getBlock(database, 'dynamics-wide'),
      dynamicsTall: db.getBlock(database, 'dynamics-tall'),
      humansList: db.getBlock(database, 'humans-list'),
      agentsList: db.getBlock(database, 'agents-list'),
      introHtml: intro ? intro.body_html : '',
    });
    layout(res, req, 200, {
      title: 'Home',
      description: 'The AI-native SDLC bible: stages, roles of agents and engineers, security and efficient use of agents.',
      current: 'home',
      body,
    });
  }

  function stage(res, req, slug) {
    const data = db.getStagePage(database, slug);
    if (!data) return notFound(res, req);
    const body = fill(views.stage, {
      position: data.stage.position,
      total: data.total,
      title: data.stage.title,
      summaryHtml: data.stage.summaryHtml,
      artifactHtml: data.stage.artifactHtml,
      prevSlug: data.prev.slug,
      prevLabel: `${data.prev.position}. ${data.prev.title}`,
      nextSlug: data.next.slug,
      nextLabel: `${data.next.position}. ${data.next.title}`,
      details: data.sections.details || '',
      recommendations: data.sections.recommendations || '',
      research: data.sections.research || '',
    });
    return layout(res, req, 200, {
      title: `Stage ${data.stage.position}: ${data.stage.title}`,
      description: data.stage.summary.replace(/`/g, ''),
      current: 'stages',
      body,
    });
  }

  function page(res, req, slug) {
    const row = db.getPage(database, slug);
    if (!row) return notFound(res, req);
    return layout(res, req, 200, {
      title: row.title,
      description: row.title,
      current: slug,
      body: fill(views.page, { bodyHtml: row.body_html }),
    });
  }

  function searchPage(res, req, query) {
    const results = db.search(database, query);
    const items = results.map((result) => `<li class="search-result">
<a href="${escapeHtml(result.url)}"><strong>${escapeHtml(result.title)}</strong></a>
<p>${escapeHtml(result.snippet)}</p>
</li>`).join('\n');
    let summary = 'Type a word to search all stages and pages.';
    if (query) summary = results.length ? `${results.length} result${results.length === 1 ? '' : 's'} for “${query}”.` : `No results for “${query}”.`;
    layout(res, req, 200, {
      title: 'Search',
      description: 'Search the AI-native SDLC bible',
      current: 'search',
      body: fill(views.search, { query, summary, results: items }),
    });
  }

  function serveStatic(res, req, pathname) {
    let decoded;
    try {
      decoded = decodeURIComponent(pathname);
    } catch {
      return send(res, req, 400, 'Bad request', 'text/plain; charset=utf-8');
    }
    const file = path.resolve(publicDir, `.${decoded}`);
    if (!file.startsWith(publicDir + path.sep)) return notFound(res, req);
    let stat;
    try {
      stat = fs.statSync(file);
    } catch {
      return notFound(res, req);
    }
    if (!stat.isFile()) return notFound(res, req);
    const type = CONTENT_TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream';
    return send(res, req, 200, fs.readFileSync(file), type, { 'Cache-Control': 'public, max-age=300' });
  }

  return function handle(req, res) {
    try {
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        return send(res, req, 405, 'Method not allowed', 'text/plain; charset=utf-8', { Allow: 'GET, HEAD' });
      }
      const url = new URL(req.url, 'http://localhost');
      const match = route(url.pathname, pageSlugs);
      switch (match.name) {
        case 'home': return home(res, req);
        case 'stage': return stage(res, req, match.slug);
        case 'page': return page(res, req, match.slug);
        case 'search': return searchPage(res, req, (url.searchParams.get('q') || '').slice(0, 100));
        default: return serveStatic(res, req, url.pathname);
      }
    } catch (err) {
      console.error(err);
      return send(res, req, 500, 'Internal server error', 'text/plain; charset=utf-8');
    }
  };
}

function createServer(options) {
  return http.createServer(createApp(options));
}

if (require.main === module) {
  const dbPath = path.resolve(process.env.DB_PATH || db.DEFAULT_DB_PATH);
  if (!fs.existsSync(dbPath)) {
    console.error(`Database not found at ${dbPath}. Run "npm run seed" first.`);
    process.exit(1);
  }
  const port = Number(process.env.PORT || 3000);
  const host = process.env.HOST || '127.0.0.1';
  createServer({ database: db.openDb(dbPath, { readOnly: true }) }).listen(port, host, () => {
    console.log(`AI-Native SDLC Bible running at http://${host}:${port}`);
  });
}

module.exports = { createApp, createServer };
