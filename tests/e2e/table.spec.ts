import { expect, test, type Page } from '@playwright/test';

// The brief's checkpoint sizes (§5): iPhone landscape, iPad, desktop.
const SIZES = [
  { width: 844, height: 390 },
  { width: 1024, height: 768 },
  { width: 1280, height: 720 },
];

async function open(page: Page, query: string, size: { width: number; height: number }) {
  const errors: string[] = [];
  const origins = new Set<string>();
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('request', (r) => origins.add(new URL(r.url()).origin));
  await page.setViewportSize(size);
  await page.goto(`./?seed=1&${query}`);
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  return { errors, origins };
}

/** Elements that leave the viewport (the brief: no element wider than the viewport). */
const overflowing = (page: Page) =>
  page.evaluate(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    return [...document.querySelectorAll('#stage *')]
      .filter((e) => {
        const r = e.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && (r.left < -1 || r.right > vw + 1 || r.top < -1 || r.bottom > vh + 1);
      })
      .map((e) => e.getAttribute('class') ?? e.tagName);
  });

for (const fixture of ['start', 'wake']) {
  for (const size of SIZES) {
    test(`the ${fixture} table at ${size.width}x${size.height}`, async ({ page }) => {
      const { errors, origins } = await open(page, `fixture=${fixture}`, size);
      expect(await overflowing(page)).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      expect(errors).toEqual([]);
      expect([...origins]).toEqual(['http://localhost:4173']);
      await page.screenshot({ path: `docs/shots/step-2/${fixture}-${size.width}x${size.height}.png` });
    });
  }
}

test('the starting table is drawn from the engine state', async ({ page }) => {
  await open(page, 'fixture=start', SIZES[2]);
  await expect(page.locator('.stack[data-kind="lumanare"] .count')).toHaveText('×5');
  await expect(page.locator('.stack[data-kind="cel_nenuntit"]')).toHaveCount(1);
  await expect(page.locator('.stack')).toHaveCount(7);
  await expect(page.locator('.verb.working')).toHaveCount(0);
});

test('a mid-wake table shows the sitting, the grains and the grief', async ({ page }) => {
  await open(page, 'fixture=wake', SIZES[2]);
  await expect(page.locator('.verb[data-niche="boci"]')).toHaveClass(/working/);
  await expect(page.locator('.heart[data-niche="boci"]')).not.toBeEmpty();
  await expect(page.locator('.side[data-niche="boci"] .count')).toHaveText('×3');
  await expect(page.locator('.stack[data-kind="jale"]')).toHaveCount(1);
  await expect(page.locator('.stack[data-key="fir_de_dor:2"]')).toHaveCount(1);
  await expect(page.locator('.stack[data-key="fir_de_dor:3"]')).toHaveCount(1);
  await expect(page.locator('.stack[data-kind="negustor"]')).toHaveCount(1);
});

test('the diacritics string renders in all three faces', async ({ page }) => {
  await open(page, 'fixture=start&typetest', SIZES[2]);
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
  await page.locator('.typetest').screenshot({ path: 'docs/shots/step-2/typetest.png' });
});

test('review markers, numbered for the README legend', async ({ page }) => {
  await open(page, 'fixture=wake&annotate', SIZES[2]);
  await expect(page.locator('.ann')).toHaveCount(11);
  await page.screenshot({ path: 'docs/shots/step-2/annotated-1280x720.png' });
});

test('the card sheet: every face on one page', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.setViewportSize({ width: 1280, height: 860 });
  await page.goto('./?sheet');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  await expect(page.locator('.sheet-card')).toHaveCount(17);
  expect(errors).toEqual([]);
  await page.screenshot({ path: 'docs/shots/step-2/cards-sheet.png' });
});
