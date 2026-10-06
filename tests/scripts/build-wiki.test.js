'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadContent } = require('../../src/content');
const { buildWiki, rewriteLinks, wikiName } = require('../../scripts/build-wiki');

test('builds Home, one page per stage, the topic pages, sidebar and footer', () => {
  const files = buildWiki(loadContent());
  assert.deepEqual(Object.keys(files), [
    'Efficient-and-deterministic-use-of-agents.md',
    'Home.md',
    'Recommended-directory-structure.md',
    'Roles-and-responsibilities.md',
    'Security-and-governance.md',
    'Stage-1-Plan.md',
    'Stage-2-Design.md',
    'Stage-3-Build.md',
    'Stage-4-Test.md',
    'Stage-5-Deploy.md',
    'Stage-6-Maintain.md',
    '_Footer.md',
    '_Sidebar.md',
  ]);
});

test('stage pages contain the three sections in order and loop navigation', () => {
  const page = buildWiki(loadContent())['Stage-6-Maintain.md'];
  const details = page.indexOf('## Details');
  const recommendations = page.indexOf('## Recommendations');
  const research = page.indexOf('## Future research questions');
  assert.ok(details > 0 && details < recommendations && recommendations < research);
  assert.match(page, /\[Stage 1: Plan\]\(Stage-1-Plan\) →/);
});

test('home contains the stage overview, the loop and the intro', () => {
  const home = buildWiki(loadContent())['Home.md'];
  assert.match(home, /1\. \[Plan\]\(Stage-1-Plan\)/);
  assert.match(home, /### Loop/);
  assert.match(home, /## The core idea/);
});

test('rewrites site links to wiki page names', () => {
  const links = new Map([['/stages/plan', 'Stage-1-Plan'], ['/roles', 'Roles']]);
  assert.equal(rewriteLinks('[a](/stages/plan#details) [b](/roles) [c](https://x.y/z)', links), '[a](Stage-1-Plan#details) [b](Roles) [c](https://x.y/z)');
  assert.equal(wikiName('Security and governance'), 'Security-and-governance');
});

test('no front-matter leaks into the wiki, and output is byte-stable', () => {
  const first = buildWiki(loadContent());
  const second = buildWiki(loadContent());
  assert.deepEqual(first, second);
  for (const [name, text] of Object.entries(first)) {
    assert.doesNotMatch(text, /^---\ntitle:/m, `${name} contains front-matter`);
  }
});
