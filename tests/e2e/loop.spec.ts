import { expect, test, type Locator, type Page } from '@playwright/test';

const SIZES = [
  { width: 844, height: 390 },
  { width: 1024, height: 768 },
  { width: 1280, height: 720 },
];

async function open(page: Page, size = SIZES[2]) {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.setViewportSize(size);
  await page.goto('./?seed=1&fixture=start');
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

const card = (page: Page, kind: string) => page.locator(`.stack[data-kind="${kind}"]`);
const niche = (page: Page, id: string) => page.locator(`.verb[data-niche="${id}"]`);

/** Tap the flame and wait for the next day. */
async function nextDay(page: Page) {
  const day = Number(await page.locator('body').getAttribute('data-day'));
  await page.locator('.flame-hit').click();
  await expect(page.locator('body')).toHaveAttribute('data-day', String(day + 1));
}

const wander = async (page: Page) => drag(page, card(page, 'codrii_vlasiei'), niche(page, 'umbla'));

for (const size of SIZES) {
  test(`the full loop, through the hands: both marks kept, the Pomelnic (${size.width}x${size.height})`, async ({ page }) => {
    const errors = await open(page, size);
    // day 1: the kit's wheat to the hearth; a wander
    await drag(page, card(page, 'grau'), niche(page, 'gazdui'));
    await wander(page);
    await nextDay(page);
    // day 2: a wander
    await wander(page);
    await nextDay(page);
    // day 3: colivă laid on Cel Nenuntit; a wander
    await drag(page, card(page, 'coliva'), page.locator('.plank'));
    await wander(page);
    await nextDay(page);
    await expect(page.locator('.mark[data-soroc="3"]')).toHaveAttribute('data-state', 'held');
    // day 4: the fourth wander brings the peddler
    await wander(page);
    await nextDay(page);
    await expect(card(page, 'negustor')).toHaveCount(1);
    // day 5: wheat bought for bog iron
    await drag(page, card(page, 'negustor'), niche(page, 'gazdui'));
    await drag(page, card(page, 'fier'), niche(page, 'gazdui'));
    await nextDay(page);
    // day 6: the hearth makes the colivă for day 9
    await drag(page, card(page, 'grau'), niche(page, 'gazdui'));
    await nextDay(page);
    await nextDay(page);
    await nextDay(page);
    // day 9: the second mark, and the wake is kept
    await drag(page, card(page, 'coliva'), page.locator('.plank'));
    await page.locator('.flame-hit').click();
    await expect(page.locator('body')).toHaveAttribute('data-phase', 'ended');
    await expect(page.locator('body')).toHaveAttribute('data-ending', 'pomelnic');
    await expect(page.locator('.mark[data-soroc="9"]')).toHaveAttribute('data-state', 'held');
    await expect(page.locator('.page .end .title')).toHaveText('Pomelnic');
    await expect(page.locator('.page .end .line')).toHaveText('S-a ținut priveghiul.');
    await expect(page.locator('.wreath')).toBeHidden();
    expect(errors).toEqual([]);
    await page.screenshot({ path: `docs/shots/step-4/kept-${size.width}x${size.height}.png` });
  });
}

test('the dark door answers a spoken name with its line, and a blessing lies on the cloth', async ({ page }) => {
  await open(page);
  await wander(page);
  await nextDay(page);
  await wander(page);
  await nextDay(page);
  await drag(page, card(page, 'cantec_de_leagan'), niche(page, 'asculta'));
  await nextDay(page);
  await expect(card(page, 'nume')).toHaveCount(1);
  await drag(page, card(page, 'nume'), niche(page, 'descanta'));
  await nextDay(page);
  await expect(page.locator('.toast')).toHaveText('Se spune că morții nu lasă bani. Lasă ce n-au apucat să ducă.');
  await expect(card(page, 'binecuvantare')).toHaveCount(1);
  await expect(card(page, 'nume')).toHaveCount(1);
  await page.screenshot({ path: 'docs/shots/step-4/door-1280x720.png' });
});
