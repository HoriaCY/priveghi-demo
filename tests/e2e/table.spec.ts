import { expect, test, type Page } from '@playwright/test';
import { YOU_AT } from '../../src/render/layout';

// The brief's checkpoint sizes (§5): iPhone landscape, iPad, desktop.
const SIZES = [
  { width: 844, height: 390 },
  { width: 1024, height: 768 },
  { width: 1280, height: 720 },
];
const DESK = SIZES[2];
const SHOTS = 'docs/shots/v3-step-2';

async function open(page: Page, query: string, size = DESK) {
  const errors: string[] = [];
  const origins = new Set<string>();
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('request', (r) => origins.add(new URL(r.url()).origin));
  await page.setViewportSize(size);
  await page.goto(`./?${query.includes('fixture=') ? '' : 'fixture=start&'}${query}`);
  // polled from the test runner, so it works under a fake page clock too
  await expect(page.locator('body[data-ready="1"]')).toBeAttached();
  return { errors, origins };
}

/** Elements that leave the viewport (the brief: no element wider than the viewport). */
const overflowing = (page: Page) =>
  page.evaluate(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    return [...document.querySelectorAll('#stage *, .page, .page *')]
      .filter((e) => {
        const r = e.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && (r.left < -1 || r.right > vw + 1 || r.top < -1 || r.bottom > vh + 1);
      })
      .map((e) => e.getAttribute('class') ?? e.tagName);
  });

/** The tallest rect of the candle: the wax; its height is the time left to dusk. */
const waxHeight = (page: Page) =>
  page.evaluate(() => Math.max(...[...document.querySelectorAll('.maincandle rect')].map((r) => Number(r.getAttribute('height')) || 0)));

for (const fixture of ['start', 'night', 'wake', 'dark']) {
  for (const size of SIZES) {
    test(`the ${fixture} table at ${size.width}x${size.height}`, async ({ page }) => {
      const { errors, origins } = await open(page, `fixture=${fixture}&still`, size);
      expect(await overflowing(page)).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      expect(errors).toEqual([]);
      expect([...origins]).toEqual(['http://localhost:4173']);
      await page.screenshot({ path: `${SHOTS}/${fixture}-${size.width}x${size.height}.png` });
    });
  }
}

/** The engine's view, in review mode: what the table must agree with. */
type Card = { kind: string; at: unknown; from?: string; fel?: unknown; om?: string };
const view = (page: Page) =>
  page.evaluate(() => {
    const v = window.priveghi!.view();
    return { cards: v.cards as Card[], uitare: v.uitare, forecast: v.forecast, putere: v.putere, night: v.night, day: v.day };
  });

test('the starting table is drawn from the engine', async ({ page }) => {
  await open(page, 'fixture=start&still');
  const v = await view(page);
  const on = (kind: string, at: string) => v.cards.filter((c) => c.kind === kind && c.at === at);
  const dor = page.locator('.stack[data-kind="dor"]');
  await expect(dor).toHaveCount(on('dor', 'cloth').length);
  for (const c of on('dor', 'cloth')) {
    await expect(page.locator(`.stack[data-kind="dor"][data-from="${c.from}"]`)).toHaveAttribute('data-fel', String(c.fel));
  }
  expect(on('dor', 'cloth').map((c) => c.from).sort()).toEqual(['draguta', 'dusman', 'mama']);
  await expect(page.locator('.stack[data-kind="lucru"]')).toHaveCount(on('lucru', 'kit').length);
  await expect(page.locator('.stack[data-kind="loc"]')).toHaveCount(on('loc', 'road').length);
  await expect(page.locator('.stack[data-kind="om"]')).toHaveCount(on('om', 'cloth').length);
  for (const c of on('om', 'cloth')) await expect(page.locator(`.stack[data-om="${c.om}"]`)).toHaveCount(1);
  const you = page.locator('.stack[data-kind="you"]');
  await expect(you).toHaveCount(1);
  await expect(you).toHaveAttribute('data-at', 'plank');
  await expect(you).toHaveCSS('transform', `matrix(1, 0, 0, 1, ${YOU_AT.x}, ${YOU_AT.y})`);
  await expect(page.locator('.forecast')).toContainText([v.uitare, ...v.forecast].join(' · '));
  await expect(page.locator('.daytag')).toHaveText('Ziua întâi');
  await expect(page.locator('body')).toHaveAttribute('data-putere', String(v.putere));
  await expect(page.locator('body')).toHaveAttribute('data-night', v.night ? '1' : '0');
  await expect(page.locator('.tally-band')).toHaveCount(5);
  await expect(page.locator('.verb')).toHaveCount(6);
  await expect(page.locator('.verb[data-niche="odihneste"]')).toHaveAttribute('data-tap', 'troita');
});

test('the candle burns down in real time, and dusk falls at the fortieth second', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-15T09:00:00Z') });
  await open(page, 'fixture=start');
  const h0 = await waxHeight(page);
  await page.clock.runFor(10_000);
  const h1 = await waxHeight(page);
  expect(h1).toBeLessThan(h0);
  await expect(page.locator('.dusk')).not.toHaveClass(/on/);
  await page.clock.runFor(31_000);
  await expect(page.locator('.dusk')).toHaveClass(/on/);
  await expect(page.locator('body')).toHaveAttribute('data-night', '1');
  await expect(page.locator('.maincandle')).toHaveClass(/out/);
  await expect(page.locator('.stack[data-kind="om"]').first()).toHaveAttribute('data-asleep', '1');
  // the fade runs on the browser's own clock, not the faked one: the picture waits for its end state
  await expect(page.locator('.dusk')).toHaveCSS('background-color', 'rgba(17, 14, 11, 0.5)');
  await page.screenshot({ path: `${SHOTS}/dusk-1280x720.png` });
});

test('the idle dead: nine minutes with no input ends in Uitare before day nine', async ({ page }) => {
  test.slow();
  await page.clock.install({ time: new Date('2026-10-15T09:00:00Z') });
  await open(page, 'fixture=start');
  await page.clock.runFor(9 * 60_000);
  await expect(page.locator('body')).toHaveAttribute('data-ending', 'uitare');
  expect(Number(await page.locator('body').getAttribute('data-day'))).toBeLessThanOrEqual(7);
});

test('a tap shows the strip; with a Dor in hand a thing names the match', async ({ page }) => {
  await open(page, 'fixture=start&still');
  const toast = page.locator('.toast');
  await page.locator('.stack[data-kind="dor"][data-from="mama"]').click();
  await expect(toast).toHaveClass(/show/);
  await expect(toast).toContainText('Dorul mamei');
  await expect(toast).toContainText('neam');
  await expect(page.locator('.stack.selected[data-from="mama"]')).toHaveCount(1);
  await page.locator('.stack[data-lucru="broboada"]').click();
  await expect(toast).toContainText('Broboadă');
  await expect(toast).toContainText('Mama');
  await expect(toast.locator('.match')).toHaveText('Amintire vie');
  await page.locator('.stack[data-lucru="oglinda"]').click();
  await expect(toast).toContainText('Oglindă');
  await expect(toast.locator('.match')).toHaveText('Amintire ștearsă');
  await expect(toast).toHaveCSS('opacity', '1');
  await page.screenshot({ path: `${SHOTS}/strip-1280x720.png` });
  // a person is their own owner and is named once
  await page.locator('.stack[data-om="rada"]').click();
  await expect(toast).toContainText('Rada');
  expect(((await toast.textContent()) ?? '').match(/Rada/g)?.length).toBe(1);
  // the tally: the five names
  await page.locator('.tally').click();
  await expect(toast.locator('.row')).toHaveCount(5);
  await expect(toast).toContainText('Mama');
  // the day tag opens the page, which carries the counters
  await page.locator('.daytag').click();
  await expect(page.locator('.page')).toHaveClass(/open/);
  await expect(page.locator('.page .counts')).toContainText('Uitare 0');
  await expect(page.locator('.page .counts')).toContainText('Putere');
});

test('a spread hand shows every card: the paint order follows the row', async ({ page }) => {
  await open(page, 'fixture=wake&still', SIZES[0]);
  const hidden = await page.evaluate(() => {
    const out: string[] = [];
    for (const s of document.querySelectorAll<HTMLElement>('.stack')) {
      const r = s.getBoundingClientRect();
      const hit = document.elementFromPoint(r.left + 4, r.top + r.height / 2)?.closest('.stack');
      if (hit !== s) out.push(`${s.dataset.key} under ${(hit as HTMLElement | null)?.dataset.key ?? 'nothing'}`);
    }
    return out;
  });
  expect(hidden).toEqual([]);
});

test('the fifth day of a considered hand: the cross, the resting pile, no cords', async ({ page }) => {
  await open(page, 'fixture=wake&still');
  const v = await view(page);
  expect(v.day).toBe(5);
  await expect(page.locator('.stack[data-kind="you"]')).toHaveAttribute('data-at', 'cimitir');
  await expect(page.locator('.verb.locked')).toHaveCount(0);
  await expect(page.locator('.stack[data-key="rest"]')).toHaveCount(1);
  await page.locator('.stack[data-key="rest"]').click();
  await expect(page.locator('.toast .row').first()).toBeVisible();
});

test('the diacritics string renders in all three faces', async ({ page }) => {
  await open(page, 'fixture=start&still&typetest');
  const loaded = await page.evaluate(async () => {
    await document.fonts.ready;
    return [...document.fonts]
      .filter((f) => f.status === 'loaded')
      .map((f) => `${f.family.replace(/"/g, '')} ${f.weight} ${f.style}`)
      .sort();
  });
  expect(loaded).toEqual([
    'Alegreya 400 italic',
    'Alegreya 400 normal',
    'Alegreya 600 normal',
    'Alegreya SC 400 normal',
    'Cormorant Unicase 500 normal',
    'Cormorant Unicase 600 normal',
  ]);
  for (const face of ['16px "Cormorant Unicase"', '16px Alegreya', '16px "Alegreya SC"']) {
    expect(await page.evaluate((f) => document.fonts.check(f, 'Șș Țț Ăă Ââ Îî'), face)).toBe(true);
  }
  await page.locator('.typetest').screenshot({ path: `${SHOTS}/typetest.png` });
});

test('review markers, numbered for the README legend', async ({ page }) => {
  await open(page, 'fixture=wake&annotate&still');
  await expect(page.locator('.ann')).toHaveCount(12);
  await page.screenshot({ path: `${SHOTS}/annotated-1280x720.png` });
});

test('the card sheet: every face on one page', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(String(e)));
  // six rows of 252 px faces with their gaps: the sheet scrolls inside a fixed box, so the viewport must hold it whole
  await page.setViewportSize({ width: 1280, height: 1700 });
  await page.goto('./?sheet');
  await expect(page.locator('body[data-ready="1"]')).toBeAttached();
  await expect(page.locator('.sheet-card')).toHaveCount(31);
  expect(errors).toEqual([]);
  await page.screenshot({ path: `${SHOTS}/cards-sheet.png`, fullPage: true });
});

/** The fixtures that reach a beat (charter section 9): how far each gets is printed for the report. */
for (const fixture of ['door', 'preot', 'tarus', 'uitare']) {
  test(`the ${fixture} fixture reaches its beat`, async ({ page }) => {
    const { errors } = await open(page, `fixture=${fixture}&still`);
    expect(errors).toEqual([]);
    const b = await page.evaluate(() => ({ ...document.body.dataset }));
    console.log(`fixture ${fixture}: day ${b.day}, phase ${b.phase}, uitare ${b.uitare}, spaima ${b.spaima}, candle ${b.candle}, ending "${b.ending}"`);
    expect(await overflowing(page)).toEqual([]);
    await page.screenshot({ path: `${SHOTS}/${fixture}-1280x720.png` });
  });
}
