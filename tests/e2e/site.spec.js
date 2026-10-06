'use strict';

const { test, expect } = require('@playwright/test');

const STAGES = [
  { slug: 'plan', title: 'Plan' },
  { slug: 'design', title: 'Design' },
  { slug: 'build', title: 'Build' },
  { slug: 'test', title: 'Test' },
  { slug: 'deploy', title: 'Deploy' },
  { slug: 'maintain', title: 'Maintain' },
];

test('home shows the six stages in loop order', async ({ page }) => {
  await page.goto('/');
  const cards = page.locator('.stage-loop .stage-card');
  await expect(cards).toHaveCount(6);
  const titles = (await cards.locator('h3').allTextContents()).map((t) => t.trim());
  expect(titles).toEqual(STAGES.map((s) => s.title));
});

for (const stage of STAGES) {
  test(`the ${stage.title} card opens its stage page with all three panels`, async ({ page }) => {
    await page.goto('/');
    await page.locator(`.stage-card a[href="/stages/${stage.slug}"]`).click();
    await expect(page).toHaveURL(new RegExp(`/stages/${stage.slug}$`));
    await expect(page.locator('h1')).toHaveText(stage.title);
    await expect(page.locator('#details h2')).toHaveText('Details');
    await expect(page.locator('#recommendations h2')).toHaveText('Recommendations');
    await expect(page.locator('#research h2')).toHaveText('Future research questions');
  });
}

test('the stage pages form a loop', async ({ page }) => {
  await page.goto('/stages/maintain');
  await page.locator('a[rel="next"]').click();
  await expect(page).toHaveURL(/\/stages\/plan$/);
  await page.locator('a[rel="prev"]').click();
  await expect(page).toHaveURL(/\/stages\/maintain$/);
});

test('the dynamics visualization shows both actors and explains each step', async ({ page }) => {
  await page.goto('/');
  const svg = page.locator('svg.dynamics:visible');
  await expect(svg).toHaveCount(1);
  await expect(svg.locator('.dyn-human')).toHaveCount(3);
  await expect(svg.locator('.dyn-agent')).toHaveCount(3);
  await svg.locator('.dyn-node').nth(1).focus();
  await expect(page.locator('#dynamics-detail h3')).toContainText('Claude');
  await svg.locator('.dyn-node').nth(0).click();
  await expect(page.locator('#dynamics-detail h3')).toContainText('Human');
});

test('the actor toggle switches between humans and agents', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#human-list')).toBeVisible();
  await expect(page.locator('#agent-list')).toBeHidden();
  await page.getByRole('button', { name: 'Agents do the work' }).click();
  await expect(page.locator('#agent-list')).toBeVisible();
  await expect(page.locator('#human-list')).toBeHidden();
  await expect(page.getByRole('button', { name: 'Agents do the work' })).toHaveAttribute('aria-pressed', 'true');
});

test('the introduction is shown below the visualization', async ({ page }) => {
  await page.goto('/');
  const dynamics = await page.locator('#dynamics').boundingBox();
  const intro = await page.locator('#intro').boundingBox();
  expect(intro.y).toBeGreaterThan(dynamics.y + dynamics.height - 1);
  await expect(page.locator('#intro')).toContainText('The core idea');
  await expect(page.locator('#intro')).toContainText('A breached control writes the next');
});

test('topic pages are reachable', async ({ page }) => {
  for (const slug of ['roles', 'security', 'efficiency', 'structure']) {
    const response = await page.goto(`/${slug}`);
    expect(response.status()).toBe(200);
    await expect(page.locator('main h1')).toBeVisible();
  }
});

test('search finds content and filters results', async ({ page }) => {
  await page.goto('/search?q=hook');
  const results = page.locator('#results .search-result');
  expect(await results.count()).toBeGreaterThan(1);
  await page.locator('#search-filter').fill('Deploy');
  await expect(page.locator('#results .search-result:visible').first()).toContainText('Deploy');
});

test('pages never scroll horizontally', async ({ page }) => {
  for (const url of ['/', '/stages/build', '/security', '/structure', '/search?q=intent']) {
    await page.goto(url);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, url).toBeLessThanOrEqual(0);
  }
});
