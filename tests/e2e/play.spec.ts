import { expect, test, type Locator, type Page } from '@playwright/test';
import { TUNING } from '../../src/tuning';

// Step 3: the drags that commit, the knock, the skip's cat, STINGE, rest, BANTUIE, ASCULTA, the sill.
// The brief's checkpoint sizes (§5): iPhone landscape, iPad, desktop.
const SIZES = [
  { width: 844, height: 390 },
  { width: 1024, height: 768 },
  { width: 1280, height: 720 },
];
const DESK = SIZES[2];
const SHOTS = 'docs/shots/v3-step-3';
const T0 = new Date('2026-10-16T09:00:00Z');

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
    return { cards: v.cards as Card[], uitare: v.uitare, putere: v.putere, spaima: v.spaima, night: v.night, day: v.day, commit: v.commit };
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

/** A point of the reference frame, in viewport pixels. */
async function at(page: Page, x: number, y: number) {
  const b = await page.locator('#stage').boundingBox();
  if (!b) throw new Error('no stage');
  const k = b.width / 1280;
  return { x: b.x + x * k, y: b.y + y * k };
}

const mama = (page: Page) => page.locator('.stack[data-kind="dor"][data-from="mama"]');
const broboada = (page: Page) => page.locator('.stack[data-lucru="broboada"]');

for (const size of SIZES) {
  test(`the mother's longing on her kerchief opens the knock at ${size.width}x${size.height}`, async ({ page }) => {
    const { errors, origins } = await open(page, 'fixture=start&still', size);
    const before = await view(page);
    const dor = before.cards.find((c) => c.kind === 'dor' && c.from === 'mama')!;
    const kerchief = before.cards.find((c) => c.kind === 'lucru' && c.lucru === 'broboada')!;
    await drag(page, mama(page), broboada(page));
    const urneste = page.locator('.verb[data-niche="urneste"]');
    await expect(urneste).toHaveClass(/working/);
    await expect(page.locator('.heart[data-niche="urneste"]')).toHaveAttribute('data-ids', String(dor.id));
    await expect(page.locator('.side[data-niche="urneste"]')).toHaveAttribute('data-ids', String(kerchief.id));
    await expect(page.locator('.play[data-play="bocanit"]')).toBeVisible();
    await expect(page.locator('.play .skip')).toBeVisible();
    const after = await view(page);
    expect(after.putere).toBe(before.putere - 1);
    expect(after.putere).toBe(3);
    await expect(page.locator('body')).toHaveAttribute('data-putere', '3');
    // the kerchief left the kit row for the side seat; nothing on the rows can be carried meanwhile
    await expect(broboada(page)).toHaveCount(0);
    await expect(page.locator('.stack[data-drag]')).toHaveCount(0);
    expect(await overflowing(page)).toEqual([]);
    expect(errors).toEqual([]);
    expect([...origins]).toEqual(['http://localhost:4173']);
    await page.screenshot({ path: `${SHOTS}/play-${size.width}x${size.height}.png` });
  });
}

test('Sari peste: the cat takes the blame, the kerchief keeps the memory', async ({ page }) => {
  const { errors } = await open(page, 'fixture=start&still');
  await drag(page, mama(page), broboada(page));
  await expect(page.locator('.play[data-play="bocanit"]')).toBeVisible();
  await page.locator('.play .skip').click();
  const cat = page.locator('.cat.run');
  await expect(cat).toBeAttached();
  await expect(page.locator('.play')).toHaveCount(0);
  await expect(page.locator('.toast')).toContainText('Pisica.');
  // the cat lunges where the cup lies (R112): its lunge is set from the cup's left edge
  const cup = page.locator('.stack[data-lucru="cana"]');
  const cupX = Number(await cup.getAttribute('data-x'));
  expect(await cat.evaluate((e) => e.style.getPropertyValue('--lunge-x'))).toBe(`${cupX + 50}px`);
  // mid-run: the cup goes over under the cat (held knock_hit_ms, so the poll is finer than the default cadence)
  await expect.poll(() => cup.evaluate((e) => e.classList.contains('knocked')), { intervals: [40], timeout: TUNING.cat_ms }).toBe(true);
  await page.screenshot({ path: `${SHOTS}/cat-1280x720.png` });
  // the cat has crossed: the engine resolved the act as the skip
  await expect(mama(page)).toHaveCount(0);
  await expect(page.locator('.verb.working')).toHaveCount(0);
  const marks = page.locator('.tally-band[data-om="mama"] > svg > path');
  await expect(marks).toHaveCount(1);
  // strength 2 (the mother's longing in the mother's kerchief): a tall stroke
  await expect(marks).toHaveAttribute('d', 'M65 1 V11');
  const pile = page.locator('.stack[data-key="rest"]');
  await expect(pile).toHaveAttribute('data-lucru', 'broboada');
  await expect(pile).toHaveAttribute('data-resting', '1');
  await expect(page.locator('body')).toHaveAttribute('data-uitare', '0');
  await expect(page.locator('body')).toHaveAttribute('data-putere', '3');
  // the living name you, even when the counter does not move
  await expect(page.locator('.toast .nm')).toHaveText('Amintire vie');
  await expect(page.locator('.toast .sub')).toHaveText('Mama · Pomenire');
  await expect(page.locator('.page .said')).toContainText('Mama');
  await expect(page.locator('.page .said')).toContainText('Pomenire');
  const v = await view(page);
  expect(v.uitare).toBe(0);
  expect(v.commit).toBeNull();
  expect(errors).toEqual([]);
});

test('the second skip is the draft: the flame gutters under a hand at the candle', async ({ page }) => {
  const { errors } = await open(page, 'fixture=start&still');
  await drag(page, mama(page), broboada(page));
  await page.locator('.play .skip').click();
  await expect(page.locator('.cat.run')).toBeAttached();
  await expect(page.locator('.verb.working')).toHaveCount(0, { timeout: TUNING.cat_ms + 3000 });
  // the betrothed's longing on the ring: the next skip in the cycle is the draft, never the cat twice
  await drag(page, page.locator('.stack[data-kind="dor"][data-from="draguta"]'), page.locator('.stack[data-lucru="inel"]'));
  await expect(page.locator('.play[data-play="bocanit"]')).toBeVisible();
  await page.locator('.play .skip').click();
  const hand = page.locator('.draft.run');
  await expect(hand).toBeAttached();
  await expect(page.locator('.cat')).toHaveCount(0);
  await expect(page.locator('.maincandle')).toHaveClass(/gutter/);
  await expect(page.locator('.stack[data-lucru="cana"]')).toHaveClass(/drafted/);
  await expect(page.locator('.toast')).not.toContainText('Pisica.');
  await page.waitForTimeout(TUNING.draft_ms / 3);
  await page.screenshot({ path: `${SHOTS}/draft-1280x720.png` });
  await expect(page.locator('.verb.working')).toHaveCount(0, { timeout: TUNING.draft_ms + 3000 });
  await expect(page.locator('.draft')).toHaveCount(0);
  const v = await view(page);
  expect(v.commit).toBeNull();
  expect(v.putere).toBe(2);
  expect(errors).toEqual([]);
});

test('Bocanit played on the beat: a Minune, the Semn on the cloth', async ({ page }) => {
  await page.clock.install({ time: T0 });
  const { errors } = await open(page, 'fixture=start&still');
  // from here only runFor moves the clock: the taps land where the test puts them
  await page.clock.pauseAt(T0.getTime() + 10_000);
  await drag(page, mama(page), broboada(page));
  const zone = page.locator('.play .tapzone');
  await expect(zone).toBeAttached();
  const gaps = TUNING.knock_gaps_ms;
  const total = gaps.reduce((a, b) => a + b, 0);
  await page.clock.runFor(TUNING.play_open_ms + total + TUNING.knock_lead_ms);
  await expect(zone).toHaveClass(/ready/);
  for (const gap of gaps) {
    await page.clock.runFor(gap);
    await zone.click();
  }
  await expect(page.locator('.play')).toHaveCount(0);
  await expect(page.locator('.stack[data-kind="semn"]')).toHaveCount(1);
  await expect(page.locator('.stack[data-kind="semn"]')).toHaveAttribute('data-at', 'cloth');
  await expect(page.locator('body')).toHaveAttribute('data-uitare', '0');
  await expect(page.locator('.toast .nm')).toHaveText('Minune');
  await expect(page.locator('.tally-band[data-om="mama"] > svg > path')).toHaveCount(1);
  const v = await view(page);
  expect(v.cards.filter((c) => c.kind === 'semn')).toHaveLength(1);
  expect(v.commit).toBeNull();
  expect(errors).toEqual([]);
});

test('the hover answers by contour weight only where the engine would take the drop', async ({ page }) => {
  const { errors } = await open(page, 'fixture=start&still');
  const a = await centre(mama(page));
  await page.mouse.move(a.x, a.y);
  await page.mouse.down();
  await page.mouse.move(a.x + 14, a.y + 14, { steps: 2 });
  await expect(mama(page)).toHaveClass(/lifted/);
  const kerchief = await centre(broboada(page));
  await page.mouse.move(kerchief.x, kerchief.y, { steps: 6 });
  await expect(broboada(page)).toHaveClass(/accept/);
  await expect(page.locator('.accept')).toHaveCount(1);
  // another Dor's stack does not fit: no contour answers
  const other = await centre(page.locator('.stack[data-kind="dor"][data-from="draguta"]'));
  await page.mouse.move(other.x, other.y, { steps: 6 });
  await expect(page.locator('.accept')).toHaveCount(0);
  // the troita's sill takes a loose Dor
  const sill = await centre(page.locator('.verb[data-niche="odihneste"]'));
  await page.mouse.move(sill.x, sill.y, { steps: 6 });
  await expect(page.locator('.verb[data-niche="odihneste"]')).toHaveClass(/accept/);
  // the verbs that take no Dor stay quiet
  const bantuie = await centre(page.locator('.verb[data-niche="bantuie"]'));
  await page.mouse.move(bantuie.x, bantuie.y, { steps: 6 });
  await expect(page.locator('.accept')).toHaveCount(0);
  // let go over the bare table: the card returns, nothing was committed
  await page.mouse.move(...Object.values(await at(page, 900, 440)) as [number, number], { steps: 4 });
  await page.mouse.up();
  await expect(mama(page)).not.toHaveClass(/lifted/);
  await expect(page.locator('.verb.working')).toHaveCount(0);
  await expect(page.locator('.accept')).toHaveCount(0);
  const v = await view(page);
  expect(v.commit).toBeNull();
  expect(errors).toEqual([]);
});

test('the keyboard path: Enter picks a card up, Enter on a target puts it down, Escape drops it', async ({ page }) => {
  const { errors } = await open(page, 'fixture=start&still');
  await mama(page).focus();
  await page.keyboard.press('Enter');
  await expect(mama(page)).toHaveClass(/picked/);
  await expect(page.locator('.toast')).toContainText('Dorul mamei');
  await page.keyboard.press('Escape');
  await expect(mama(page)).not.toHaveClass(/picked/);
  await mama(page).focus();
  await page.keyboard.press('Enter');
  await broboada(page).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.verb[data-niche="urneste"]')).toHaveClass(/working/);
  await expect(page.locator('.play[data-play="bocanit"]')).toBeVisible();
  await expect(page.locator('.picked')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('a drop that does not fit returns the card without a word', async ({ page }) => {
  const { errors } = await open(page, 'fixture=start&still');
  const stack = mama(page);
  const home = await stack.evaluate((e) => getComputedStyle(e).transform);
  const other = page.locator('.stack[data-kind="dor"][data-from="draguta"]');
  await drag(page, stack, other);
  await expect(stack).toHaveCSS('transform', home);
  await expect(page.locator('.toast')).not.toHaveClass(/show/);
  await expect(page.locator('.verb.working')).toHaveCount(0);
  await expect(page.locator('.accept')).toHaveCount(0);
  // a thing is not carried: the press moves nothing and commits nothing
  await drag(page, broboada(page), page.locator('.stack[data-om="mama"]'));
  await expect(page.locator('.verb.working')).toHaveCount(0);
  await expect(page.locator('.toast')).not.toHaveClass(/show/);
  const v = await view(page);
  expect(v.putere).toBe(4);
  expect(v.commit).toBeNull();
  expect(errors).toEqual([]);
});

test('STINGE: a tap on the flame brings the night; a second tap does nothing', async ({ page }) => {
  const { errors } = await open(page, 'fixture=start&still');
  await page.locator('.flame-hit').click();
  await expect(page.locator('body')).toHaveAttribute('data-night', '1');
  await expect(page.locator('.maincandle')).toHaveClass(/out/);
  await expect(page.locator('.dusk')).toHaveClass(/on/);
  await expect(page.locator('.toast')).toContainText('S-a stins lumânarea.');
  await expect(page.locator('.stack[data-om="mama"]')).toHaveAttribute('data-asleep', '1');
  // the dusk lies above the rows' cards (R78) and under the strip
  expect(
    await page.evaluate(() => {
      const z = (s: string) => Number(getComputedStyle(document.querySelector(s)!).zIndex) || 0;
      const rows = Math.max(...[...document.querySelectorAll<HTMLElement>('.stack')].map((e) => Number(e.style.zIndex) || 0));
      return z('.dusk') > rows && z('.dusk') < z('.toast');
    }),
  ).toBe(true);
  const once = await view(page);
  await page.locator('.flame-hit').click();
  const twice = await view(page);
  expect(twice.spaima).toBe(once.spaima);
  expect(twice.night).toBe(true);
  expect(errors).toEqual([]);
});

test('ODIHNESTE-TE: a tap on the troita gutters the flame, then the dawn', async ({ page }) => {
  await page.clock.install({ time: T0 });
  const { errors } = await open(page, 'fixture=start&still');
  await page.clock.pauseAt(T0.getTime() + 10_000);
  await page.locator('.verb[data-niche="odihneste"]').click();
  await expect(page.locator('.maincandle')).toHaveClass(/gutter/);
  await expect(page.locator('body')).toHaveAttribute('data-day', '1');
  await page.clock.runFor(500);
  await expect(page.locator('body')).toHaveAttribute('data-day', '2');
  await expect(page.locator('.daytag')).toHaveText('Ziua a doua');
  await expect(page.locator('.maincandle')).not.toHaveClass(/gutter/);
  expect(errors).toEqual([]);
});

test('BANTUIE: the porch dragged into the niche brings the knife and the flute', async ({ page }) => {
  const { errors } = await open(page, 'fixture=start&still');
  const before = await view(page);
  await drag(page, page.locator('.stack[data-loc="tinda"]'), page.locator('.verb[data-niche="bantuie"]'));
  await expect(page.locator('.stack[data-lucru="cutit"]')).toHaveCount(1);
  await expect(page.locator('.stack[data-lucru="fluier"]')).toHaveCount(1);
  const after = await view(page);
  expect(after.putere).toBe(before.putere - 1);
  await expect(page.locator('body')).toHaveAttribute('data-putere', String(after.putere));
  await expect(page.locator('.stack[data-loc="tinda"]')).toHaveCount(1);
  expect(errors).toEqual([]);
});

test('ASCULTA: Mama dragged into the niche leaves a fragment, twice, not a third time', async ({ page }) => {
  const { errors } = await open(page, 'fixture=start&still');
  const mother = page.locator('.stack[data-om="mama"]');
  const niche = page.locator('.verb[data-niche="asculta"]');
  const fragments = page.locator('.stack[data-kind="frantura"]');
  await drag(page, mother, niche);
  await expect(fragments).toHaveCount(1);
  await drag(page, mother, niche);
  await expect(fragments).toHaveCount(2);
  await drag(page, mother, niche);
  await page.waitForTimeout(400);
  await expect(fragments).toHaveCount(2);
  await expect(mother).toHaveCount(1);
  const v = await view(page);
  expect(v.cards.filter((c) => c.kind === 'frantura')).toHaveLength(2);
  expect(errors).toEqual([]);
});

test('the sill: a Dor tied on the troita, and untied back to the cloth', async ({ page }) => {
  const { errors } = await open(page, 'fixture=start&still');
  const before = await view(page);
  const dor = before.cards.find((c) => c.kind === 'dor' && c.from === 'mama')!;
  await drag(page, mama(page), page.locator('.verb[data-niche="odihneste"]'));
  const tied = page.locator('.cards .tied[data-drag="sill"]');
  await expect(tied).toHaveCount(1);
  await expect(tied).toHaveAttribute('data-ids', String(dor.id));
  await expect(mama(page)).toHaveCount(0);
  await expect(page.locator('body')).toHaveAttribute('data-day', '1');
  // let go over the bare cloth: untied
  await dragTo(page, tied, await at(page, 900, 440));
  await expect(tied).toHaveCount(0);
  await expect(mama(page)).toHaveCount(1);
  await expect(mama(page)).toHaveAttribute('data-ids', String(dor.id));
  const v = await view(page);
  expect(v.cards.find((c) => c.id === dor.id)?.at).toBe('cloth');
  expect(errors).toEqual([]);
});

test('the idle dead: nine minutes with no input still end in Uitare', async ({ page }) => {
  test.slow();
  await page.clock.install({ time: T0 });
  await open(page, 'fixture=start');
  await page.clock.runFor(9 * 60_000);
  await expect(page.locator('body')).toHaveAttribute('data-ending', 'uitare');
  expect(Number(await page.locator('body').getAttribute('data-day'))).toBeLessThanOrEqual(7);
});

for (const size of SIZES) {
  test(`the played fixture at ${size.width}x${size.height}`, async ({ page }) => {
    const { errors, origins } = await open(page, 'fixture=played&still', size);
    const v = await view(page);
    await expect(page.locator('.tally-band[data-om="mama"] > svg > path')).toHaveAttribute('d', 'M65 1 V11');
    await expect(page.locator('.tally-band[data-om="dusman"] > svg > path')).toHaveAttribute('d', 'M65 4 V11');
    await expect(page.locator('.stack[data-key="rest"]')).toHaveAttribute('data-ids', /\d+ \d+/);
    await expect(page.locator('.stack[data-kind="dor"]')).toHaveCount(v.cards.filter((c) => c.kind === 'dor' && c.at === 'cloth').length);
    await expect(page.locator('body')).toHaveAttribute('data-putere', String(v.putere));
    expect(v.putere).toBe(2);
    await expect(page.locator('.verb.working')).toHaveCount(0);
    expect(await overflowing(page)).toEqual([]);
    expect(errors).toEqual([]);
    expect([...origins]).toEqual(['http://localhost:4173']);
    await page.screenshot({ path: `${SHOTS}/played-${size.width}x${size.height}.png` });
  });
}
