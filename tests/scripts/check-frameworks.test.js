'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { checkFile, checkRepo } = require('../../scripts/check-frameworks');

test('the repository itself passes', () => {
  assert.deepEqual(checkRepo(), []);
});

test('allows W3.CSS and W3.JS from w3schools.com', () => {
  const html = '<link rel="stylesheet" href="https://www.w3schools.com/w3css/5/w3.css"><script src="https://www.w3schools.com/lib/w3.js"></script>';
  assert.deepEqual(checkFile('src/views/x.html', html), []);
});

test('flags other CDN frameworks', () => {
  const html = '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5/dist/css/bootstrap.min.css">';
  const violations = checkFile('src/views/x.html', html);
  assert.equal(violations.length, 1);
  assert.equal(violations[0].rule, 'external-asset');
});

test('flags framework and third-party imports', () => {
  assert.match(checkFile('src/app.js', "const express = require('express');")[0].message, /framework outside the chosen stack/);
  assert.match(checkFile('src/app.js', "import React from 'react';")[0].message, /framework/);
  assert.equal(checkFile('src/app.js', "const fs = require('fs');").length, 1, 'built-ins need the node: prefix');
});

test('allows built-ins, relative modules and Playwright in tests', () => {
  assert.deepEqual(checkFile('src/app.js', "const fs = require('node:fs'); const db = require('./db');"), []);
  assert.deepEqual(checkFile('tests/e2e/a.spec.js', "const { test } = require('@playwright/test');"), []);
  assert.equal(checkFile('src/app.js', "require('@playwright/test')").length, 1);
});

test('flags non-CommonJS languages', () => {
  assert.equal(checkFile('src/app.tsx', '').length, 1);
});
