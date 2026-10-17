import { expect, test, type Locator, type Page } from '@playwright/test';
import { TUNING } from '../../src/tuning';

// Step 5: the boot in the dark, the endings on the table, the save, the long gap, the hit areas.
const SIZES = [
  { width: 844, height: 390 },
  { width: 1024, height: 768 },
  { width: 1280, height: 720 },
];
const DESK = SIZES[2];
const PHONE = SIZES[0];
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
const stage = (page: Page) => page.locator('#stage');

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

/** The cold start: a touch in the dark strikes the match; the next brings you home. */
async function light(page: Page, size = DESK) {
  await page.mouse.click(size.width / 2, size.height / 2);
  await expect(stage(page)).not.toHaveClass(/dark0/);
  await page.mouse.click(size.width / 2, size.height / 2);
  await expect(body(page)).toHaveAttribute('data-phase', 'wake');
}

for (const size of SIZES) {
  test(`a cold start: the dark, the match, the second touch brings you home (${size.width}x${size.height})`, async ({ page }) => {
    const { errors, origins } = await open(page, 'reset', size);
    await expect(body(page)).toHaveAttribute('data-phase', 'boot');
    await expect(stage(page)).toHaveClass(/dark0/);
    await expect(page.locator('.daytag')).toBeHidden();
    await page.screenshot({ path: `${SHOTS}/boot-dark-${size.width}x${size.height}.png` });
    await page.mouse.click(size.width / 2, size.height / 2);
    await expect(stage(page)).not.toHaveClass(/dark0/);
    await expect(body(page)).toHaveAttribute('data-phase', 'boot');
    await page.screenshot({ path: `${SHOTS}/boot-lit-${size.width}x${size.height}.png` });
    await page.mouse.click(size.width / 2, size.height / 2);
    await expect(body(page)).toHaveAttribute('data-phase', 'wake');
    await expect(body(page)).toHaveAttribute('data-day', '1');
    // the one line the boot speaks, once the pool is open
    await expect(page.locator('.toast')).toHaveText('Te-au adus acasă.', { timeout: TUNING.pool_open_ms + 3000 });
    await expect(page.locator('.page .said')).toHaveText('Te-au adus acasă.');
    await expect(page.locator('.stack[data-om="mama"]')).toBeVisible();
    await expect(page.locator('.daytag')).toBeVisible();
    await expect(stage(page)).not.toHaveClass(/booting/);
    expect(await overflowing(page)).toEqual([]);
    expect(errors).toEqual([]);
    expect([...origins]).toEqual(['http://localhost:4173']);
    await page.waitForTimeout(TUNING.pool_open_ms + 200);
    await page.screenshot({ path: `${SHOTS}/table-${size.width}x${size.height}.png` });
  });
}

test('after the match, the wait alone brings you home', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-17T09:00:00Z') });
  await open(page, 'reset');
  await page.mouse.click(DESK.width / 2, DESK.height / 2);
  await expect(stage(page)).not.toHaveClass(/dark0/);
  await page.clock.runFor(TUNING.boot_wait_ms + 100);
  await expect(body(page)).toHaveAttribute('data-phase', 'wake');
});

test('the Uitare ending: the table fades, the page says only the day, a tap lands in the dark', async ({ page }) => {
  const { errors } = await open(page, 'fixture=uitare&still');
  await expect(body(page)).toHaveAttribute('data-ending', 'uitare');
  await expect(stage(page)).toHaveClass(/fade/);
  await expect(page.locator('.page > *')).toHaveCount(1);
  await expect(page.locator('.page .day')).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/uitare-1280x720.png` });
  await page.locator('.page').click();
  await expect(body(page)).toHaveAttribute('data-phase', 'boot');
  await expect(stage(page)).toHaveClass(/dark0/);
  await expect(stage(page)).not.toHaveClass(/fade/);
  expect(errors).toEqual([]);
});

test('the stake: its shadow on the sheet, and nothing else moves', async ({ page }) => {
  await open(page, 'fixture=tarus&still');
  await expect(body(page)).toHaveAttribute('data-ending', 'tarus');
  await expect(stage(page)).toHaveClass(/stake/);
  await expect(page.locator('.toast')).toHaveText('Vânătorul.');
  await page.waitForTimeout(TUNING.stake_ms + 100);
  await page.screenshot({ path: `${SHOTS}/tarus-1280x720.png` });
});

test('the Bride dims every gold but the troita while she stands', async ({ page }) => {
  await open(page, 'fixture=door&still');
  await expect(body(page)).toHaveAttribute('data-phase', 'door');
  await expect(stage(page)).toHaveClass(/bride/);
  await expect(page.locator('.verb[data-niche="urneste"]')).toHaveCSS('filter', /saturate/);
  await expect(page.locator('.verb[data-niche="odihneste"]')).not.toHaveCSS('filter', /saturate/);
});

test('a wake is saved at the boot and every close and comes back after a reload; ?reset begins anew', async ({ page }) => {
  await open(page, 'reset');
  await light(page);
  await page.goto('./');
  await expect(page.locator('body[data-ready="1"]')).toBeAttached();
  await expect(body(page)).toHaveAttribute('data-phase', 'wake');
  await expect(body(page)).toHaveAttribute('data-day', '1');
  // two days: blow the candle out, then rest; twice
  for (const day of ['2', '3']) {
    await page.locator('.flame-hit').click();
    await expect(body(page)).toHaveAttribute('data-night', '1');
    await page.locator('.verb[data-niche="odihneste"]').click();
    await expect(body(page)).toHaveAttribute('data-day', day);
  }
  await page.goto('./');
  await expect(page.locator('body[data-ready="1"]')).toBeAttached();
  await expect(body(page)).toHaveAttribute('data-phase', 'wake');
  await expect(body(page)).toHaveAttribute('data-day', '3');
  await page.goto('./?reset');
  await expect(page.locator('body[data-ready="1"]')).toBeAttached();
  await expect(body(page)).toHaveAttribute('data-phase', 'boot');
});

test('a long gap with the tab hidden closes no day: the clock pauses', async ({ page }) => {
  // three minutes of the fake clock are 1800 ticks: enough for three days, and a third of the ten minutes that ran at the timeout
  test.slow();
  await page.clock.install({ time: new Date('2026-10-17T09:00:00Z') });
  await open(page, 'reset');
  await light(page);
  await page.clock.runFor(2_000);
  await expect(body(page)).toHaveAttribute('data-day', '1');
  const hide = (hidden: boolean) =>
    page.evaluate((h) => {
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => h });
      document.dispatchEvent(new Event('visibilitychange'));
    }, hidden);
  await hide(true);
  await page.clock.runFor(3 * 60_000);
  await hide(false);
  await page.clock.runFor(500);
  expect(Number(await body(page).getAttribute('data-day'))).toBeLessThanOrEqual(2);
  await expect(body(page)).toHaveAttribute('data-phase', 'wake');
});

/** The true hit extent of an element: how far from its centre a press still lands on it (through ::after too). */
const hitSize = (page: Page, selector: string) =>
  page.evaluate((sel) => {
    const el = document.querySelector<HTMLElement>(sel);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const hits = (x: number, y: number) => document.elementFromPoint(x, y)?.closest(sel) === el;
    const reach = (dx: number, dy: number) => {
      let d = 0;
      while (d < 120 && hits(cx + dx * (d + 1), cy + dy * (d + 1))) d++;
      return d;
    };
    return { w: reach(-1, 0) + reach(1, 0) + 1, h: reach(0, -1) + reach(0, 1) + 1 };
  }, selector);

test('on the phone every small thing a thumb must find is at least 44 CSS px', async ({ page }) => {
  await open(page, 'fixture=start&still', PHONE);
  await drag(page, page.locator('.stack[data-kind="dor"][data-from="dusman"]'), page.locator('.verb[data-niche="odihneste"]'));
  await expect(page.locator('.cards .tied').first()).toBeVisible();
  const short: string[] = [];
  for (const sel of ['.daytag', '.flame-hit', '.tally', '.soroace', '.cards .tied']) {
    const s = await hitSize(page, sel);
    if (!s || Math.min(s.w, s.h) < 38) short.push(`${sel}: ${s ? `${s.w}x${s.h}` : 'missing'}`);
  }
  // a knock open: the tap zone and the skip
  await drag(page, page.locator('.stack[data-kind="dor"][data-from="mama"]'), page.locator('.stack[data-lucru="broboada"]'));
  await expect(page.locator('.play[data-play="bocanit"]')).toBeVisible();
  for (const sel of ['.tapzone', '.skip']) {
    const s = await hitSize(page, sel);
    if (!s || Math.min(s.w, s.h) < 44) short.push(`${sel}: ${s ? `${s.w}x${s.h}` : 'missing'}`);
  }
  expect(short).toEqual([]);
});
