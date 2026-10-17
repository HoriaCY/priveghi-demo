import { expect, test, type Page } from '@playwright/test';

// Step 5: the page's three compositions, its agreement with the engine, and the final pictures.
const PHONE = { width: 844, height: 390 };
const IPAD = { width: 1024, height: 768 };
const DESK = { width: 1280, height: 720 };
const IPAD_PRO = { width: 1366, height: 1024 };
const SHOTS = 'docs/shots/v3-step-5';

async function open(page: Page, query: string, size = DESK) {
  const errors: string[] = [];
  const origins = new Set<string>();
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('request', (r) => origins.add(new URL(r.url()).origin));
  await page.setViewportSize(size);
  await page.goto(`./?${query}`);
  await expect(page.locator('body[data-ready="1"]')).toBeAttached();
  return { errors, origins };
}

const body = (page: Page) => page.locator('body');

const overflowing = (page: Page) =>
  page.evaluate(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    return [...document.querySelectorAll('#stage *, .page, .page *')]
      .filter((e) => {
        const r = e.getBoundingClientRect();
        const cs = getComputedStyle(e);
        return cs.display !== 'none' && cs.visibility !== 'hidden' && r.width > 0 && r.height > 0 && (r.left < -1 || r.right > vw + 1 || r.top < -1 || r.bottom > vh + 1);
      })
      .map((e) => e.getAttribute('class') ?? e.tagName);
  });

test('the page beside the table on a desktop, below it on an iPad (the large one too: the table is larger that way, R37), folded away on a phone', async ({ page }) => {
  await open(page, 'fixture=wake&still', DESK);
  await expect(body(page)).toHaveAttribute('data-composition', 'side');
  await expect(page.locator('.page')).toBeVisible();
  expect(await overflowing(page)).toEqual([]);
  await page.setViewportSize(IPAD);
  await expect(body(page)).toHaveAttribute('data-composition', 'below');
  await expect(page.locator('.page')).toBeVisible();
  expect(await overflowing(page)).toEqual([]);
  await page.screenshot({ path: `${SHOTS}/page-below-1024x768.png` });
  await page.setViewportSize(IPAD_PRO);
  await expect(body(page)).toHaveAttribute('data-composition', 'below');
  expect(await overflowing(page)).toEqual([]);
  await page.setViewportSize(PHONE);
  await expect(body(page)).toHaveAttribute('data-composition', 'phone');
  await expect(page.locator('.page')).toBeHidden();
  await page.locator('.daytag').click();
  await expect(page.locator('.page')).toBeVisible();
  await expect(page.locator('.page .day')).toHaveText('Ziua a cincea');
  expect(await overflowing(page)).toEqual([]);
  await page.screenshot({ path: `${SHOTS}/page-phone-844x390.png` });
  // a tap on the page folds it away on the phone
  await page.locator('.page').click();
  await expect(page.locator('.page')).toBeHidden();
});

test('the page says what the engine says: the counters, the forecast, the dishes, the tally', async ({ page }) => {
  await open(page, 'fixture=wake&still', DESK);
  const b = await page.evaluate(() => ({ ...document.body.dataset }));
  const counts = page.locator('.page .counts');
  await expect(counts).toContainText(`Uitare ${b.uitare}`);
  await expect(counts).toContainText(`Spaimă ${b.spaima}`);
  const forecast = (await page.locator('.forecast .n').textContent()) ?? '';
  await expect(counts).toContainText(forecast.split(' · ').slice(1).join(' · '));
  await expect(page.locator('.page .tally-rows .row')).toHaveCount(5);
  await expect(page.locator('.page .soroace .soroc')).toHaveCount(2);
  await expect(page.locator('.page .drops')).toBeVisible();
});

test('a tap shows the strip; a second tap opens the page on the card', async ({ page }) => {
  await open(page, 'fixture=start&still', PHONE);
  const card = page.locator('.stack[data-lucru="icoana"]');
  await card.click();
  await expect(page.locator('.toast')).toContainText('Icoană');
  await expect(page.locator('.toast')).toContainText('Mama');
  await expect(page.locator('.page')).toBeHidden();
  await card.click();
  await expect(page.locator('.page')).toBeVisible();
  await expect(page.locator('.page .focus .nm')).toHaveText('Icoană');
  await expect(page.locator('.page .focus .sub')).toContainText('Mama');
});

for (const size of [PHONE, IPAD, DESK]) {
  test(`final pictures at ${size.width}x${size.height}`, async ({ page }) => {
    const name = `${size.width}x${size.height}`;
    const { errors, origins } = await open(page, 'reset', size);
    await page.mouse.click(size.width / 2, size.height / 2);
    await expect(page.locator('#stage')).not.toHaveClass(/dark0/);
    await page.screenshot({ path: `${SHOTS}/final-boot-${name}.png` });

    await page.goto('./?fixture=wake&still');
    await expect(page.locator('body[data-ready="1"]')).toBeAttached();
    await page.locator('.stack[data-lucru="broboada"]').click();
    await expect(page.locator('.toast')).toHaveCSS('opacity', '1');
    expect(await overflowing(page)).toEqual([]);
    await page.screenshot({ path: `${SHOTS}/final-wake-${name}.png` });

    await page.goto('./?fixture=door&still');
    await expect(page.locator('body[data-ready="1"]')).toBeAttached();
    await expect(page.locator('.darkdoor')).toHaveClass(/bride/);
    await page.waitForTimeout(2600);
    expect(await overflowing(page)).toEqual([]);
    await page.screenshot({ path: `${SHOTS}/final-door-${name}.png` });
    expect(errors).toEqual([]);
    expect([...origins]).toEqual(['http://localhost:4173']);
  });
}
