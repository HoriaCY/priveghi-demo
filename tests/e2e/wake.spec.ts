import { expect, test, type Locator, type Page } from '@playwright/test';
import { TUNING } from '../../src/tuning';

// Step 4: the dream (Vis), the vigil nights' mask, the priest's cords, Spaima's tells, the soroc
// dishes, the burial, her door (TRECI, the refusal), the endings' pages, another wake after one.
// The brief's checkpoint sizes: iPhone landscape, iPad, desktop.
const SIZES = [
  { width: 844, height: 390 },
  { width: 1024, height: 768 },
  { width: 1280, height: 720 },
];
const DESK = SIZES[2];
const SHOTS = 'docs/shots/v3-step-4';
const T0 = new Date('2026-10-17T09:00:00Z');

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

/** The engine's view, in review mode: what the table must agree with (RULINGS R95). */
type Card = { id: number; kind: string; at: unknown; from?: string; lucru?: string; om?: string; loc?: string };
const view = (page: Page) =>
  page.evaluate(() => {
    const v = window.priveghi!.view();
    return {
      cards: v.cards as Card[], uitare: v.uitare, putere: v.putere, spaima: v.spaima, night: v.night, day: v.day, commit: v.commit,
      phase: v.phase, ending: v.ending, soroace: v.stats.soroace, missed: v.stats.missed, preot_until: v.preot_until, amintiri: v.amintiri,
    };
  });

const centre = async (l: Locator) => {
  const b = await l.boundingBox();
  if (!b) throw new Error('not on the page');
  return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
};

/** A thumb's drag: press, a first move past the slop, the carry in steps, the drop. */
async function dragTo(page: Page, from: Locator, to: { x: number; y: number }) {
  const a = await centre(from);
  await page.mouse.move(a.x, a.y);
  await page.mouse.down();
  await page.mouse.move(a.x + 14, a.y + 14, { steps: 2 });
  await page.mouse.move(to.x, to.y, { steps: 8 });
  await page.mouse.up();
}
const drag = async (page: Page, from: Locator, to: Locator) => dragTo(page, from, await centre(to));

const mama = (page: Page) => page.locator('.stack[data-kind="dor"][data-from="mama"]');
const mother = (page: Page) => page.locator('.stack[data-om="mama"]');
const tile = (page: Page, fel: string, nth = 0) => page.locator(`.play[data-play="vis"] .tile[data-fel="${fel}"]`).nth(nth);
const body = (page: Page) => page.locator('body');
const settled = (page: Page, ms: number) => expect(page.locator('.verb.working')).toHaveCount(0, { timeout: ms + 3000 });

// ---------------------------------------------------------------- the dream

for (const size of SIZES) {
  test(`Vis: the mother's longing whispered into her sleep opens the dream at ${size.width}x${size.height}`, async ({ page }) => {
    const { errors, origins } = await open(page, 'fixture=night&still', size);
    await expect(mother(page)).toHaveAttribute('data-asleep', '1');
    await drag(page, mama(page), mother(page));
    await expect(page.locator('.verb[data-niche="sopteste"]')).toHaveClass(/working/);
    const paper = page.locator('.play[data-play="vis"]');
    await expect(paper).toBeVisible();
    await expect(paper.locator('.tile')).toHaveCount(6);
    // the five kinds, then the Dor's kind again (R70)
    await expect(paper.locator('.tile[data-fel="neam"]')).toHaveCount(2);
    await expect(paper.locator('.skip')).toBeVisible();
    await expect(body(page)).toHaveAttribute('data-putere', '3');
    expect(await overflowing(page)).toEqual([]);
    expect(errors).toEqual([]);
    expect([...origins]).toEqual(['http://localhost:4173']);
    await page.screenshot({ path: `${SHOTS}/vis-${size.width}x${size.height}.png` });
  });
}

test('Vis graded Bun: two right tiles of three; the Dor kept on the mother\'s tally', async ({ page }) => {
  const { errors } = await open(page, 'fixture=night&still');
  const before = await view(page);
  await drag(page, mama(page), mother(page));
  await expect(page.locator('.play[data-play="vis"]')).toBeVisible();
  // right: the Dor's kind (neam) and the sleeper's affinities (neam, rugaciune); frate is wrong
  await tile(page, 'neam').click();
  await tile(page, 'rugaciune').click();
  await tile(page, 'frate').click();
  await expect(page.locator('.play')).toHaveCount(0);
  await expect(mama(page)).toHaveCount(0);
  await expect(page.locator('.verb.working')).toHaveCount(0);
  await expect(page.locator('.tally-band[data-om="mama"] > svg > path')).toHaveCount(1);
  await expect(body(page)).toHaveAttribute('data-putere', '3');
  const after = await view(page);
  expect(after.commit).toBeNull();
  expect(after.putere).toBe(before.putere - 1);
  expect(after.amintiri[0]).toHaveLength(1);
  expect(after.amintiri[0][0].strength).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});

test('Vis graded Minunat: three right tiles; the sleeper leaves a pomana at dawn', async ({ page }) => {
  await page.clock.install({ time: T0 });
  const { errors } = await open(page, 'fixture=night');
  await drag(page, mama(page), mother(page));
  await expect(page.locator('.play[data-play="vis"]')).toBeVisible();
  await tile(page, 'neam', 0).click();
  await tile(page, 'rugaciune').click();
  await tile(page, 'neam', 1).click();
  await expect(page.locator('.play')).toHaveCount(0);
  await expect(mama(page)).toHaveCount(0);
  const v = await view(page);
  expect(v.commit).toBeNull();
  expect(v.amintiri[0]).toHaveLength(1);
  // the dawn: the engine leaves the dream's thing in the kit row, and the table shows it settle there
  await page.clock.runFor(61_000);
  await expect(body(page)).toHaveAttribute('data-day', '2');
  const pomana = page.locator('.stack[data-lucru="pomana"]');
  await expect(pomana).toHaveCount(1);
  await expect(pomana).toHaveAttribute('data-at', 'kit');
  expect(errors).toEqual([]);
});

test('the vigil night\'s skip: the mask takes the blame, not the cat', async ({ page }) => {
  const { errors } = await open(page, 'fixture=night&still');
  await drag(page, mama(page), mother(page));
  await expect(page.locator('.play[data-play="vis"]')).toBeVisible();
  await page.locator('.play .skip').click();
  const mask = page.locator('.masca.run');
  await expect(mask).toBeAttached();
  await expect(page.locator('.cat')).toHaveCount(0);
  await expect(page.locator('.play')).toHaveCount(0);
  await page.waitForTimeout(TUNING.mask_ms / 3);
  await page.screenshot({ path: `${SHOTS}/mask-1280x720.png` });
  await settled(page, TUNING.mask_ms);
  await expect(page.locator('.masca')).toHaveCount(0);
  await expect(mama(page)).toHaveCount(0);
  const v = await view(page);
  expect(v.commit).toBeNull();
  expect(errors).toEqual([]);
});

// ---------------------------------------------------------------- the burial, the soroace, the tells

test('the fifth day: the cross on the plank, the third dish held, the village on the road', async ({ page }) => {
  const { errors } = await open(page, 'fixture=wake&still');
  const v = await view(page);
  expect(v.day).toBe(5);
  expect(v.soroace).toEqual([3]);
  const you = page.locator('.stack[data-kind="you"]');
  await expect(you).toHaveAttribute('data-at', 'cimitir');
  await expect(you.locator('.face text').first()).toHaveText('Cruce');
  // the dishes on the far side, one per soroc inside the nine days, as the engine's stats have them
  await expect(page.locator('#stage .soroc')).toHaveCount(2);
  await expect(page.locator('#stage .soroc[data-soroc="3"]')).toHaveAttribute('data-state', 'held');
  await expect(page.locator('#stage .soroc[data-soroc="9"]')).toHaveAttribute('data-state', 'waiting');
  await expect(page.locator('.page .soroace .soroc[data-soroc="3"]')).toHaveAttribute('data-state', 'held');
  // the village set stands on the road from the burial on (the engine's presence rule); haunting it is a night act
  await expect(page.locator('.stack[data-loc="sat"]')).toHaveCount(1);
  await expect(page.locator('.stack[data-loc="biserica"]')).toHaveCount(1);
  // the dishes' strip: the memorial's name and each of its days
  await page.locator('#stage .soroace').click();
  await expect(page.locator('.toast .nm')).toHaveText('Soroc');
  await expect(page.locator('.toast')).toContainText('Ziua a treia');
  await expect(page.locator('.toast')).toContainText('Ziua a noua');
  await expect(page.locator('.toast .dish')).toHaveCount(2);
  expect(errors).toEqual([]);
});

test('the soroc fixture: the burial\'s close and the memorial held', async ({ page }) => {
  const { errors } = await open(page, 'fixture=soroc&still');
  const v = await view(page);
  expect(v.day).toBe(4);
  expect(v.soroace).toEqual([3]);
  await expect(page.locator('.stack[data-kind="you"]')).toHaveAttribute('data-at', 'cimitir');
  await expect(page.locator('#stage .soroc[data-soroc="3"]')).toHaveAttribute('data-state', 'held');
  expect(await overflowing(page)).toEqual([]);
  expect(errors).toEqual([]);
  await page.screenshot({ path: `${SHOTS}/soroc-1280x720.png` });
});

test('Spaima\'s tells: the dog at the gate from 3, garlic on the lintel from 4 and on the house from 5', async ({ page }) => {
  const { errors } = await open(page, 'fixture=start&still');
  const curte = page.locator('.stack[data-loc="curte"]');
  const casa = page.locator('.stack[data-loc="casa"]');
  const lintel = page.locator('.verb[data-niche="arata"] .tell[data-tell="lintel"]');
  await expect(page.locator('.tell')).toHaveCount(0);
  // an apparition by day: the mother's longing shown to the mother (ARATA-TE resolves as the skip, R64)
  await drag(page, mama(page), mother(page));
  await settled(page, TUNING.mask_ms);
  let v = await view(page);
  expect(v.spaima).toBe(3);
  await expect(curte.locator('.tell[data-tell="dog"]')).toHaveCount(1);
  await expect(lintel).toHaveCount(0);
  await expect(casa.locator('.tell')).toHaveCount(0);
  // a second one on the porch: 6; the garlic on the house and on the lintel
  await drag(page, page.locator('.stack[data-kind="dor"][data-from="draguta"]'), page.locator('.stack[data-loc="tinda"]'));
  await settled(page, TUNING.cat_ms);
  v = await view(page);
  expect(v.spaima).toBe(6);
  await expect(curte.locator('.tell[data-tell="dog"]')).toHaveCount(1);
  await expect(casa.locator('.tell[data-tell="garlic"]')).toHaveCount(1);
  await expect(lintel).toHaveCount(1);
  await expect(page.locator('.stack[data-loc="sat"]')).toHaveCount(0);
  await expect(body(page)).toHaveAttribute('data-spaima', '6');
  await expect(page.locator('.page .counts')).toContainText('Spaimă 6');
  expect(await overflowing(page)).toEqual([]);
  expect(errors).toEqual([]);
  await page.screenshot({ path: `${SHOTS}/tells-1280x720.png` });
});

// ---------------------------------------------------------------- the priest, the Hunter, the dark dawn

test('the preot fixture: two cords, the priest\'s line, a drop on URNESTE\'s thing refused', async ({ page }) => {
  const { errors } = await open(page, 'fixture=preot&still');
  const v = await view(page);
  expect(v.day).toBeLessThanOrEqual(v.preot_until);
  await expect(page.locator('.verb.locked')).toHaveCount(2);
  await expect(page.locator('.verb[data-niche="urneste"]')).toHaveClass(/locked/);
  await expect(page.locator('.verb[data-niche="arata"]')).toHaveClass(/locked/);
  await expect(page.locator('.toast')).toContainText('Preotul a venit cu apă sfințită.');
  await expect(page.locator('.page .said')).toContainText('Preotul a venit cu apă sfințită.');
  // the cords: the engine refuses the knock (locked); the card returns, nothing is committed
  const dor = page.locator('.stack[data-kind="dor"]').first();
  const thing = page.locator('.stack[data-kind="lucru"][data-resting="0"]').first();
  const home = await dor.evaluate((e) => getComputedStyle(e).transform);
  await drag(page, dor, thing);
  await expect(page.locator('.verb.working')).toHaveCount(0);
  await expect(page.locator('.play')).toHaveCount(0);
  // the refused card is back where it lay before the shot (its return glides over the stack's transition)
  await expect(dor).toHaveCSS('transform', home);
  const after = await view(page);
  expect(after.commit).toBeNull();
  expect(after.putere).toBe(v.putere);
  // inside his service Spaima stands at 2 (the priest resets it to 3 and the decay takes one): the lintel's garlic (from 4) is not here
  expect(after.spaima).toBeLessThan(TUNING.tell_lintel_spaima);
  await expect(page.locator('.tell[data-tell="lintel"]')).toHaveCount(0);
  expect(await overflowing(page)).toEqual([]);
  expect(errors).toEqual([]);
  await page.screenshot({ path: `${SHOTS}/preot-1280x720.png` });
});

test('the tarus fixture: the Hunter\'s line and the stake\'s page', async ({ page }) => {
  const { errors } = await open(page, 'fixture=tarus&still');
  await expect(body(page)).toHaveAttribute('data-ending', 'tarus');
  await expect(body(page)).toHaveAttribute('data-phase', 'ended');
  await expect(page.locator('.page .end .title')).toHaveText('Țăruș');
  await expect(page.locator('.toast')).toContainText('Vânătorul.');
  await expect(page.locator('.page .said')).toContainText('Vânătorul.');
  expect(await overflowing(page)).toEqual([]);
  expect(errors).toEqual([]);
  await page.screenshot({ path: `${SHOTS}/tarus-1280x720.png` });
});

test('the dark fixture: the day begins without a flame', async ({ page }) => {
  const { errors } = await open(page, 'fixture=dark&still');
  await expect(body(page)).toHaveAttribute('data-candle', '0');
  await expect(body(page)).toHaveAttribute('data-night', '1');
  await expect(page.locator('.toast')).toContainText('Azi nu a aprins nimeni lumânarea.');
  await expect(page.locator('.page .said')).toContainText('Azi nu a aprins nimeni lumânarea.');
  await expect(page.locator('.maincandle')).toHaveClass(/out/);
  await expect(page.locator('.dusk')).toHaveClass(/on/);
  await expect(mother(page)).toHaveAttribute('data-asleep', '1');
  expect(errors).toEqual([]);
});

// ---------------------------------------------------------------- her door and the endings

for (const size of SIZES) {
  test(`her door at ${size.width}x${size.height}: the Bride stands, your card goes on the door (TRECI)`, async ({ page }) => {
    const { errors, origins } = await open(page, 'fixture=door&still', size);
    await expect(body(page)).toHaveAttribute('data-phase', 'door');
    const door = page.locator('.darkdoor');
    await expect(door).toHaveClass(/bride/);
    await expect(door.locator('.bridefig')).toBeVisible();
    await expect(door.locator('.vname')).toHaveText('Treci');
    const you = page.locator('.stack[data-kind="you"]');
    await expect(you).toHaveAttribute('data-drag', 'table');
    await expect(page.locator('.stack[data-kind="dor"][data-drag]')).toHaveCount(0);
    expect(await overflowing(page)).toEqual([]);
    expect(errors).toEqual([]);
    expect([...origins]).toEqual(['http://localhost:4173']);
    await page.screenshot({ path: `${SHOTS}/door-${size.width}x${size.height}.png` });
    // the door answers your card by contour weight, and takes it
    const a = await centre(you);
    await page.mouse.move(a.x, a.y);
    await page.mouse.down();
    await page.mouse.move(a.x + 14, a.y + 14, { steps: 2 });
    await expect(you).toHaveClass(/lifted/);
    const d = await centre(door);
    await page.mouse.move(d.x, d.y, { steps: 8 });
    await expect(door).toHaveClass(/accept/);
    await page.mouse.up();
    await expect(body(page)).toHaveAttribute('data-ending', 'nunta');
    await expect(body(page)).toHaveAttribute('data-phase', 'ended');
    await expect(page.locator('.page .end .title')).toHaveText('Nuntă');
    await expect(page.locator('.page .end .bride')).toBeVisible();
    await expect(door).toHaveClass(/bride/);
    await expect(door.locator('.vname')).toBeHidden();
    // your card went through the door with her: the plank shows it gone (R130)
    await expect(you).toHaveCount(0);
    expect(await overflowing(page)).toEqual([]);
    expect(errors).toEqual([]);
    if (size === DESK) await page.screenshot({ path: `${SHOTS}/nunta-1280x720.png` });
  });
}

test('her door refused: a tap on the Bride\'s page, and you remain', async ({ page }) => {
  const { errors } = await open(page, 'fixture=door&still');
  await expect(page.locator('.page')).toHaveAttribute('data-phase', 'door');
  await expect(page.locator('.page .door .bride')).toBeVisible();
  await expect(page.locator('.page .end')).toHaveCount(0);
  // the paper around her refuses nothing; the Bride herself does
  await page.locator('.page .day').click();
  await expect(page.locator('.page')).toHaveAttribute('data-phase', 'door');
  await page.locator('.page .door .bride').click();
  await expect(body(page)).toHaveAttribute('data-ending', 'ratacire');
  await expect(body(page)).toHaveAttribute('data-phase', 'ended');
  await expect(page.locator('.page .end .title')).toHaveText('Rătăcire');
  await expect(page.locator('.darkdoor')).not.toHaveClass(/bride/);
  expect(await overflowing(page)).toEqual([]);
  expect(errors).toEqual([]);
  await page.screenshot({ path: `${SHOTS}/ratacire-1280x720.png` });
});

test('the ninth fixture: the door stays dark, the last soroc, Ratacire\'s page', async ({ page }) => {
  const { errors } = await open(page, 'fixture=ninth&still');
  const v = await view(page);
  console.log(`fixture ninth: day ${v.day}, phase ${v.phase}, uitare ${v.uitare}, spaima ${v.spaima}, soroace ${v.soroace}, missed ${v.missed}, ending ${v.ending}`);
  expect(v.day).toBe(9);
  await expect(body(page)).toHaveAttribute('data-ending', 'ratacire');
  await expect(page.locator('.darkdoor')).not.toHaveClass(/bride/);
  await expect(page.locator('.page .end .title')).toHaveText('Rătăcire');
  // the soroc's result stands first on the page: the ninth dish as the engine's stats have it
  await expect(page.locator('.page .soroace .soroc[data-soroc="9"]')).toHaveAttribute('data-state', v.soroace.includes(9) ? 'held' : 'missed');
  await expect(page.locator('#stage .soroc[data-soroc="9"]')).toHaveAttribute('data-state', v.soroace.includes(9) ? 'held' : 'missed');
  expect(await overflowing(page)).toEqual([]);
  expect(errors).toEqual([]);
  await page.screenshot({ path: `${SHOTS}/ninth-1280x720.png` });
});

test('the uitare fixture: gone before the ninth day; the page shows only the day', async ({ page }) => {
  const { errors } = await open(page, 'fixture=uitare&still');
  await expect(body(page)).toHaveAttribute('data-ending', 'uitare');
  expect(Number(await body(page).getAttribute('data-day'))).toBeLessThan(9);
  await expect(page.locator('.page > *')).toHaveCount(1);
  await expect(page.locator('.page .day')).toBeVisible();
  await expect(page.locator('.page .end')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('a tap on an ended page begins another wake', async ({ page }) => {
  const { errors } = await open(page, 'fixture=tarus&still');
  await expect(body(page)).toHaveAttribute('data-ending', 'tarus');
  await page.locator('.page').click();
  await expect(body(page)).toHaveAttribute('data-phase', 'wake');
  await expect(body(page)).toHaveAttribute('data-day', '1');
  await expect(body(page)).toHaveAttribute('data-uitare', '0');
  await expect(body(page)).toHaveAttribute('data-spaima', '0');
  await expect(body(page)).toHaveAttribute('data-ending', '');
  await expect(page.locator('.page .end')).toHaveCount(0);
  await expect(page.locator('.daytag')).toHaveText('Ziua întâi');
  await expect(page.locator('.stack[data-kind="dor"]')).toHaveCount(3);
  await expect(page.locator('.verb.locked')).toHaveCount(0);
  const v = await view(page);
  expect(v.phase).toBe('wake');
  expect(v.day).toBe(1);
  expect(errors).toEqual([]);
});

/** The fixtures that reach a beat: how far each gets is printed for the report. */
for (const fixture of ['soroc', 'ninth', 'wake', 'door']) {
  test(`the ${fixture} fixture's reach`, async ({ page }) => {
    const { errors } = await open(page, `fixture=${fixture}&still`);
    expect(errors).toEqual([]);
    const v = await view(page);
    console.log(`fixture ${fixture}: day ${v.day}, phase ${v.phase}, uitare ${v.uitare}, spaima ${v.spaima}, putere ${v.putere}, soroace ${v.soroace}, missed ${v.missed}, ending "${v.ending ?? ''}"`);
  });
}
