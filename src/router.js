'use strict';

// Pure routing: maps a pathname to a route. Anything unmatched falls through
// to the static file handler, which returns 404 when no file exists.

function route(pathname, pageSlugs = new Set()) {
  if (pathname === '/') return { name: 'home' };
  if (pathname === '/search' || pathname === '/search/') return { name: 'search' };
  let match = pathname.match(/^\/stages\/([a-z0-9-]+)\/?$/);
  if (match) return { name: 'stage', slug: match[1] };
  match = pathname.match(/^\/([a-z0-9-]+)\/?$/);
  if (match && match[1] !== 'home' && pageSlugs.has(match[1])) return { name: 'page', slug: match[1] };
  return { name: 'static' };
}

module.exports = { route };
