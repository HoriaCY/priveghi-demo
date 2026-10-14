import { expect, test, type Locator, type Page } from '@playwright/test';

const SIZES = [
  { width: 844, height: 390 },
  { width: 1024, height: 768 },
  { width: 1280, height: 720 },
];

async function open(page: Page, query: string, size = SIZES[2]) {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.setViewportSize(size);
  await page.goto(`./?seed=1&${query}`);
  // polled from the test runner, so it works under a fake page clock too
  await expect(page.locator('body[data-ready="1"]')).toBeAttached();
  return errors;
}

async function centre(l: Locator) {
  const b = (await l.boundingBox())!;
  return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
}

/** Press on a card, move past the slop, carry it over the target. Leaves the button down. */
async function carry(page: Page, from: Locator, to: Locator) {
  const a = await centre(from);
  const b = await centre(to);
  await page.mouse.move(a.x, a.y);
  await page.mouse.down();
  await page.mouse.move(a.x + 12, a.y + 12, { steps: 3 });
  await page.mouse.move(b.x, b.y, { steps: 12 });
}

async function drag(page: Page, from: Locator, to: Locator) {
  await carry(page, from, to);
  await page.mouse.up();
}

test('a card dragged onto a niche goes in; one that does not fit comes back with the refusal line', async ({ page }) => {
  const errors = await open(page, 'still');
  await drag(page, page.locator('.stack[data-kind="codrii_vlasiei"]'), page.locator('.verb[data-niche="umbla"]'));
  await expect(page.locator('.heart[data-niche="umbla"]')).not.toHaveAttribute('data-ids', '');
  await expect(page.locator('.stack[data-kind="codrii_vlasiei"]')).toHaveCount(0);

  await drag(page, page.locator('.stack[data-kind="sare"]'), page.locator('.verb[data-niche="boci"]'));
  await expect(page.locator('.toast')).toHaveText('Nu se potrivește aici.');
  await expect(page.locator('.toast')).toHaveClass(/show/);
  await expect(page.locator('.stack[data-kind="sare"]')).toHaveCount(1);
  expect(errors).toEqual([]);
});

test('a niche answers by contour weight only when the engine would take the card', async ({ page }) => {
  await open(page, 'still');
  await carry(page, page.locator('.stack[data-kind="rada"]'), page.locator('.verb[data-niche="boci"]'));
  await expect(page.locator('.verb[data-niche="boci"]')).toHaveClass(/accept/);
  const umbla = await centre(page.locator('.verb[data-niche="umbla"]'));
  await page.mouse.move(umbla.x, umbla.y, { steps: 8 });
  await expect(page.locator('.verb[data-niche="boci"]')).not.toHaveClass(/accept/);
  await expect(page.locator('.verb[data-niche="umbla"]')).not.toHaveClass(/accept/);
  await page.mouse.up();
  await expect(page.locator('.stack[data-kind="rada"]')).toHaveCount(1);
});

test('a card a niche still holds goes back to the cloth', async ({ page }) => {
  await open(page, 'still');
  await drag(page, page.locator('.stack[data-kind="codrii_vlasiei"]'), page.locator('.verb[data-niche="umbla"]'));
  await expect(page.locator('.stack[data-kind="codrii_vlasiei"]')).toHaveCount(0);
  await drag(page, page.locator('.heart[data-niche="umbla"]'), page.locator('.stilllife'));
  await expect(page.locator('.stack[data-kind="codrii_vlasiei"]')).toHaveCount(1);
});

test('tapping the flame closes the day after the pre-cue', async ({ page }) => {
  await open(page, '');
  await expect(page.locator('body')).toHaveAttribute('data-day', '1');
  await page.locator('.flame-hit').click();
  await expect(page.locator('body')).toHaveAttribute('data-day', '2');
});

test('resting at the troita with the flask closes the day and gives the flask back', async ({ page }) => {
  await open(page, '');
  await drag(page, page.locator('.stack[data-kind="plosca"]'), page.locator('.verb[data-niche="troita"]'));
  await expect(page.locator('body')).toHaveAttribute('data-day', '2');
  await expect(page.locator('.stack[data-kind="plosca"]')).toHaveCount(1);
});

test('a broken watcher: three niches tied shut, the rest open', async ({ page }) => {
  const errors = await open(page, 'fixture=frant&still');
  await expect(page.locator('.verb.locked')).toHaveCount(3);
  await expect(page.locator('.stack[data-kind="jale"] .count')).toHaveText('×3');
  await page.screenshot({ path: 'docs/shots/step-3/frant-1280x720.png' });
  await drag(page, page.locator('.stack[data-kind="codrii_vlasiei"]'), page.locator('.verb[data-niche="umbla"]'));
  await expect(page.locator('.toast')).toHaveClass(/show/);
  await expect(page.locator('.stack[data-kind="codrii_vlasiei"]')).toHaveCount(1);
  expect(errors).toEqual([]);
});

test('a candle card in the dish raises the candle a notch', async ({ page }) => {
  await open(page, '');
  for (const day of ['2', '3', '4']) {
    await page.locator('.flame-hit').click();
    await expect(page.locator('body')).toHaveAttribute('data-day', day);
  }
  await expect(page.locator('body')).toHaveAttribute('data-wax', '4');
  await drag(page, page.locator('.stack[data-kind="lumanare"]'), page.locator('.dish'));
  await expect(page.locator('body')).toHaveAttribute('data-wax', '5');
  await expect(page.locator('.stack[data-kind="lumanare"] .count')).toHaveText('×4');
});

for (const size of SIZES) {
  test(`nine days play out to an ending with no input (${size.width}x${size.height})`, async ({ page }) => {
    await page.clock.install({ time: new Date('2026-10-14T09:00:00Z') });
    const errors = await open(page, '', size);
    await page.clock.runFor(9 * 60_000 + 1_000);
    await expect(page.locator('body')).toHaveAttribute('data-phase', 'ended');
    await expect(page.locator('body')).toHaveAttribute('data-day', '9');
    await expect(page.locator('.wreath')).toBeVisible();
    expect(errors).toEqual([]);
    await page.screenshot({ path: `docs/shots/step-3/ending-${size.width}x${size.height}.png` });
  });
}
