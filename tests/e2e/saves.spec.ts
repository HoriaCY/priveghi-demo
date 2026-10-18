import { expect, test, type Page } from '@playwright/test';
import { TUNING } from '../../src/tuning';

// The save's version, its kept-aside slot and the journal's replay in WebAssembly (R141–R147).
const DESK = { width: 1280, height: 720 };
const SAVE = 'priveghi.v3';
const ASIDE = 'priveghi.v3.refused';

async function open(page: Page, query: string) {
  const errors: string[] = [];
  const origins = new Set<string>();
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('request', (r) => origins.add(new URL(r.url()).origin));
  await page.setViewportSize(DESK);
  await goto(page, query);
  return { errors, origins };
}

async function goto(page: Page, query: string) {
  await page.goto(`./?${query}`);
  await expect(page.locator('body[data-ready="1"]')).toBeAttached();
}

const body = (page: Page) => page.locator('body');
const stage = (page: Page) => page.locator('#stage');

/** The cold start: a touch in the dark strikes the match; the next brings you home. */
async function light(page: Page) {
  await page.mouse.click(DESK.width / 2, DESK.height / 2);
  await expect(stage(page)).not.toHaveClass(/dark0/);
  await page.mouse.click(DESK.width / 2, DESK.height / 2);
  await expect(body(page)).toHaveAttribute('data-phase', 'wake');
}

/** Blow the candle out and rest: the next dawn, and the save at its close. */
async function nextDay(page: Page, day: string) {
  await page.locator('.flame-hit').click();
  await expect(body(page)).toHaveAttribute('data-night', '1');
  await page.locator('.verb[data-niche="odihneste"]').click();
  await expect(body(page)).toHaveAttribute('data-day', day);
}

const stored = (page: Page) => page.evaluate(([a, b]) => ({ save: localStorage.getItem(a), aside: localStorage.getItem(b) }), [SAVE, ASIDE]);

/**
 * Writes the device's save from a page of the same origin that runs no game: leaving the table
 * hides it, and a hidden table saves itself over whatever was planted.
 */
async function plant(page: Page, save: string) {
  await page.goto('./credits.html');
  await page.evaluate(([k, v]) => localStorage.setItem(k, v), [SAVE, save]);
}

test('a save from before the version resumes into the same day, and is written back as version 1', async ({ page }) => {
  const { errors, origins } = await open(page, 'reset');
  await light(page);
  await nextDay(page, '2');
  const live = JSON.parse((await stored(page)).save!);
  expect(live.version).toBe(1);
  // the shape every save had before the version: the wake's one field
  await plant(page, JSON.stringify({ state: live.state }));
  await goto(page, '');
  await expect(body(page)).toHaveAttribute('data-phase', 'wake');
  await expect(body(page)).toHaveAttribute('data-day', '2');
  await nextDay(page, '3');
  const back = await stored(page);
  expect(back.aside).toBeNull();
  const wake = JSON.parse(back.save!);
  expect(wake.version).toBe(1);
  expect(wake.origin.day).toBe(2);
  expect(wake.journal.length).toBeGreaterThan(0);
  expect(wake.journal.every((m: { seat: number }) => m.seat === 0)).toBe(true);
  expect(errors).toEqual([]);
  expect([...origins]).toEqual(['http://localhost:4173']);
});

test('a save from a newer build is kept aside, the dark comes, and after the boot the strip names it once', async ({ page }) => {
  const { errors, origins } = await open(page, 'reset');
  await light(page);
  const newer = JSON.stringify({ ...JSON.parse((await stored(page)).save!), version: 99 });
  await plant(page, newer);
  await goto(page, '');
  await expect(body(page)).toHaveAttribute('data-phase', 'boot');
  await expect(stage(page)).toHaveClass(/dark0/);
  expect((await stored(page)).aside).toBe(newer);
  await light(page);
  await expect(page.locator('.toast')).toHaveText('Te-au adus acasă.', { timeout: TUNING.pool_open_ms + 3000 });
  await expect(page.locator('.toast')).toHaveText('Priveghiul acela e din altă vreme.', {
    timeout: TUNING.toast_ms + TUNING.kept_aside_ms + 3000,
  });
  // the new wake is saved at the boot; the newer one stays aside
  const after = await stored(page);
  expect(JSON.parse(after.save!).version).toBe(1);
  expect(after.aside).toBe(newer);
  // a reload of the new wake is no refusal: the line is not said again
  await goto(page, '');
  await expect(body(page)).toHaveAttribute('data-phase', 'wake');
  await page.waitForTimeout(TUNING.pool_open_ms + TUNING.toast_ms + TUNING.kept_aside_ms + 300);
  await expect(page.locator('.toast')).not.toHaveText('Priveghiul acela e din altă vreme.');
  // ?reset wipes both
  await goto(page, 'reset');
  expect(await stored(page)).toEqual({ save: null, aside: null });
  expect(errors).toEqual([]);
  expect([...origins]).toEqual(['http://localhost:4173']);
});

test('a save that is no save is kept aside too, and a fixture touches neither key', async ({ page }) => {
  const { errors } = await open(page, 'reset');
  await plant(page, 'not a wake');
  await goto(page, '');
  await expect(body(page)).toHaveAttribute('data-phase', 'boot');
  expect(await stored(page)).toEqual({ save: 'not a wake', aside: 'not a wake' });
  // leaving the boot saved its new wake; plant the stray again for the fixture
  await plant(page, 'not a wake');
  await goto(page, 'fixture=start&still');
  expect(await stored(page)).toEqual({ save: 'not a wake', aside: 'not a wake' });
  await expect(body(page)).toHaveAttribute('data-phase', 'wake');
  expect(errors).toEqual([]);
});

for (const fixture of ['door', 'ninth', 'uitare']) {
  test(`the WebAssembly build replays its own journal (${fixture})`, async ({ page }) => {
    const { errors } = await open(page, `fixture=${fixture}&still`);
    expect(await page.evaluate(() => window.priveghi!.view().log.length)).toBeGreaterThan(50);
    expect(await page.evaluate(() => window.priveghi!.replays())).toBe(true);
    expect(errors).toEqual([]);
  });
}
