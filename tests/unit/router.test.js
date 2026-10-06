'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { route } = require('../../src/router');

const pages = new Set(['roles', 'security']);

test('routes the home page, stages, pages and search', () => {
  assert.deepEqual(route('/', pages), { name: 'home' });
  assert.deepEqual(route('/stages/plan', pages), { name: 'stage', slug: 'plan' });
  assert.deepEqual(route('/stages/plan/', pages), { name: 'stage', slug: 'plan' });
  assert.deepEqual(route('/roles', pages), { name: 'page', slug: 'roles' });
  assert.deepEqual(route('/search', pages), { name: 'search' });
});

test('falls through to static files for anything else', () => {
  assert.deepEqual(route('/css/site.css', pages), { name: 'static' });
  assert.deepEqual(route('/unknown', pages), { name: 'static' });
  assert.deepEqual(route('/home', new Set(['home'])), { name: 'static' });
  assert.deepEqual(route('/stages/../etc', pages), { name: 'static' });
});
