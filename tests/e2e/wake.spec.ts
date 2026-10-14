import { expect, test, type Locator, type Page } from '@playwright/test';

const PHONE = { width: 844, height: 390 };
const IPAD = { width: 1024, height: 768 };
const DESK = { width: 1280, height: 720 };

async function open(page: Page, query: string, size = DESK) {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.setViewportSize(size);
  await page.goto(`./?seed=1&${query}`);
  await expect(page.locator('body[data-ready="1"]')).toBeAttached();
  return errors;
}

async function centre(l: Locator) {
  const b = (await l.boundingBox())!;
  return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
}

async function drag(page: Page, from: Locator, to: Locator) {
  const a = await centre(from);
  const b = await centre(to);
  await page.mouse.move(a.x, a.y);
  await page.mouse.down();
  await page.mouse.move(a.x + 12, a.y + 12, { steps: 3 });
  await page.mouse.move(b.x, b.y, { steps: 12 });
  await page.mouse.up();
}

/** The cold start: a touch in the dark, then the candle on the troita's sill carried into it. */
async function light(page: Page) {
  await page.mouse.click(400, 200);
  await expect(page.locator('#stage')).not.toHaveClass(/dark0/);
  await drag(page, page.locator('.cards .tied').first(), page.locator('.verb[data-niche="troita"]'));
  await expect(page.locator('body')).toHaveAttribute('data-phase', 'wake');
}

const within = (page: Page) =>
  page.evaluate(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    return [...document.querySelectorAll('#stage *, .page, .page *')]
      .filter((e) => {
        const r = e.getBoundingClientRect();
        const shown = getComputedStyle(e).display !== 'none' && getComputedStyle(e).visibility !== 'hidden';
        return shown && r.width > 0 && r.height > 0 && (r.left < -1 || r.right > vw + 1 || r.top < -1 || r.bottom > vh + 1);
      })
      .map((e) => e.getAttribute('class') ?? e.tagName);
  });

for (const size of [PHONE, IPAD, DESK]) {
  test(`a cold start: the dark, the match, the candle lit at the troita opens the table (${size.width}x${size.height})`, async ({ page }) => {
    const errors = await open(page, 'reset', size);
    await expect(page.locator('body')).toHaveAttribute('data-phase', 'boot');
    await expect(page.locator('#stage')).toHaveClass(/dark0/);
    await page.screenshot({ path: `docs/shots/step-5/boot-dark-${size.width}x${size.height}.png` });
    await page.mouse.click(400, 200);
    await expect(page.locator('#stage')).not.toHaveClass(/dark0/);
    await expect(page.locator('.cards .tied').first()).toBeVisible();
    await page.screenshot({ path: `docs/shots/step-5/boot-lit-${size.width}x${size.height}.png` });
    await drag(page, page.locator('.cards .tied').first(), page.locator('.verb[data-niche="troita"]'));
    await expect(page.locator('body')).toHaveAttribute('data-phase', 'wake');
    await expect(page.locator('body')).toHaveAttribute('data-day', '1');
    await page.waitForTimeout(2000); // the pool opens over 1.8 s
    await expect(page.locator('.stack[data-kind="rada"]')).toBeVisible();
    expect(await within(page)).toEqual([]);
    expect(errors).toEqual([]);
    await page.screenshot({ path: `docs/shots/step-5/table-${size.width}x${size.height}.png` });
  });
}

test('the page beside the table on a desktop, below it on an iPad, folded away on a phone', async ({ page }) => {
  await open(page, 'fixture=start&still', DESK);
  await expect(page.locator('body')).toHaveAttribute('data-composition', 'side');
  await expect(page.locator('.page')).toBeVisible();
  await page.setViewportSize(IPAD);
  await expect(page.locator('body')).toHaveAttribute('data-composition', 'below');
  await expect(page.locator('.page')).toBeVisible();
  await page.setViewportSize(PHONE);
  await expect(page.locator('body')).toHaveAttribute('data-composition', 'phone');
  await expect(page.locator('.page')).toBeHidden();
  await page.locator('.daytag').click();
  await expect(page.locator('.page')).toBeVisible();
  await expect(page.locator('.page .day')).toHaveText('Ziua întâi');
});

test('a tap on a card shows its strip; a second tap opens the page', async ({ page }) => {
  await open(page, 'fixture=start&still', PHONE);
  await page.locator('.stack[data-kind="rada"]').click();
  await expect(page.locator('.toast')).toContainText('Rada');
  await expect(page.locator('.toast')).toContainText('bocitoare');
  await expect(page.locator('.page')).toBeHidden();
  await page.locator('.stack[data-kind="rada"]').click();
  await expect(page.locator('.page')).toBeVisible();
  await expect(page.locator('.page .nm')).toHaveText('Rada');
  await page.screenshot({ path: 'docs/shots/step-5/page-phone-844x390.png' });
});

test('the peddler on the page says his one line', async ({ page }) => {
  await open(page, 'fixture=wake&still', DESK);
  await page.locator('.stack[data-kind="negustor"]').click();
  await expect(page.locator('.page .line')).toHaveText('Numără din nou.');
  await page.screenshot({ path: 'docs/shots/step-5/page-desk-1280x720.png' });
});

test('the Bride: her line, a tap, „Nu încă.”, and another wake in the dark with one less wax', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-14T09:00:00Z') });
  await open(page, 'fixture=start', DESK);
  await page.clock.runFor(9 * 60_000 + 1_000);
  await expect(page.locator('body')).toHaveAttribute('data-ending', 'cununie');
  await expect(page.locator('#stage')).toHaveClass(/bride/);
  await expect(page.locator('.page .end .line').first()).toHaveText('Vine la cel ce priveghează.');
  await expect(page.locator('.wreath')).toBeVisible();
  await page.clock.runFor(3_000);
  await page.screenshot({ path: 'docs/shots/step-5/bride-1280x720.png' });
  await page.locator('.page').click();
  await expect(page.locator('.page .answer')).toHaveText('Nu încă.');
  await page.clock.runFor(2_000);
  await expect(page.locator('body')).toHaveAttribute('data-phase', 'boot');
  await expect(page.locator('body')).toHaveAttribute('data-wax', '4');
});

test('the one silence: a thread lost while broken goes down the Sabbath Water', async ({ page }) => {
  await open(page, 'fixture=broken', DESK);
  await page.locator('.flame-hit').click();
  await expect(page.locator('.toast')).toHaveText('S-a dus pe Apa Sâmbetei.');
  await expect(page.locator('.page .said')).toHaveText('S-a dus pe Apa Sâmbetei.');
});

test('a wake is saved at every close and comes back after a reload; ?reset begins anew', async ({ page }) => {
  await open(page, 'reset', DESK);
  await light(page);
  await page.locator('.flame-hit').click();
  await expect(page.locator('body')).toHaveAttribute('data-day', '2');
  await page.locator('.flame-hit').click();
  await expect(page.locator('body')).toHaveAttribute('data-day', '3');
  await page.goto('./?seed=1');
  await expect(page.locator('body[data-ready="1"]')).toBeAttached();
  await expect(page.locator('body')).toHaveAttribute('data-phase', 'wake');
  await expect(page.locator('body')).toHaveAttribute('data-day', '3');
  await page.goto('./?seed=1&reset');
  await expect(page.locator('body[data-ready="1"]')).toBeAttached();
  await expect(page.locator('body')).toHaveAttribute('data-phase', 'boot');
});
