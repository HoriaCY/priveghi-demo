// The demo: the engine holds the dead's wake; the table and the page draw it; hands send actions;
// the clock ticks; the wake is saved on this device only. Step 2: the table, the clock and taps.
import './render/style.css';
import { Wake } from './engine';
import type { Action, Entry, View } from './engine';
import { applyFixture, isFixture } from './fixtures';
import { attachInput } from './play/input';
import { Page, type Focus } from './play/page';
import { SOUND, silence, startAmbience, unlockAudio } from './render/audio';
import { fitStage } from './render/fit';
import { rotateSVG } from './render/furniture';
import { CANDLE, DOOR_X, FORECAST, PUTERE, ROW_CLOTH, ROW_KIT, STILL_LIFE, TALLY, nicheX } from './render/layout';
import { Table } from './render/table';
import { LINES, TYPE_TEST } from './strings';
import { TUNING } from './tuning';

const params = new URLSearchParams(location.search);
const SAVE_KEY = 'priveghi.v3';

declare global {
  interface Window {
    /** Review mode only (`?fixture=`): the browser tests read the engine's view, so they assert what it says. */
    priveghi?: { view(): View };
  }
}

/** The brief's diacritics string in all three faces; mounting it also makes the browser load them. */
async function loadFaces(): Promise<void> {
  const typetest = document.createElement('div');
  typetest.className = 'typetest';
  typetest.setAttribute('aria-hidden', 'true');
  typetest.innerHTML = ['d', 'b', 'l'].map((f) => `<span class="${f}">${TYPE_TEST}</span>`).join('');
  typetest.classList.toggle('show', params.has('typetest'));
  document.body.append(typetest);
  const faces = ['600 16px "Cormorant Unicase"', '500 16px "Cormorant Unicase"', '400 16px Alegreya', '600 16px Alegreya', 'italic 400 16px Alegreya', '400 16px "Alegreya SC"'];
  await Promise.all(faces.map((f) => document.fonts.load(f, TYPE_TEST)));
}

/** Numbered markers for review screenshots; README.md "What is on the table" is the legend. */
function annotate(stage: HTMLElement): void {
  const marks: [number, number][] = [
    [452, 20], // 1 the far seat
    [nicheX(0) + 6, 126], // 2 ODIHNESTE-TE
    [nicheX(1) + 6, 126], // 3 the verbs
    [DOOR_X - 12, 140], // 4 the dark door
    [64, 384], // 5 the plank with your card
    [64, TALLY.y - 6], // 6 the tally
    [64, FORECAST.y], // 7 the forecast
    [ROW_CLOTH.x - 14, 366], // 8 the cloth row
    [ROW_KIT.x - 14, 520], // 9 the kit and the road
    [CANDLE.x - 18, 400], // 10 STINGE
    [PUTERE.x + 70, PUTERE.y - 6], // 11 Putere
    [STILL_LIFE.x + 4, STILL_LIFE.y + 4], // 12 bread and salt
  ];
  marks.forEach(([x, y], i) => {
    const a = document.createElement('div');
    a.className = 'ann';
    a.textContent = String(i + 1);
    a.style.left = `${x}px`;
    a.style.top = `${y}px`;
    stage.append(a);
  });
}

/** Material sounds for the beats the engine logged (charter section 6); losses are quiet. */
function sound(e: Entry): void {
  switch (e.event) {
    case 'brought_home':
      SOUND.match();
      window.setTimeout(() => SOUND.thread(), 250);
      window.setTimeout(() => SOUND.toaca(), 500);
      window.setTimeout(() => SOUND.chime(), TUNING.pool_open_ms);
      return;
    case 'precue':
      return SOUND.tick(0.6);
    case 'dusk':
      return SOUND.tick(0.7);
    case 'stinge':
      return SOUND.blow();
    case 'day_closed':
      return SOUND.chime();
    case 'committed':
    case 'walked':
    case 'tied':
      return SOUND.thread();
    case 'resolved':
      return SOUND.seal();
    case 'pomenire':
    case 'priest':
    case 'listened':
      return SOUND.page();
    case 'soroc_held':
    case 'buried':
    case 'rested':
      return SOUND.toaca();
    case 'untied':
      return SOUND.tick();
    case 'bride_stands':
      return SOUND.ison();
    case 'ended':
      if (e.ending === 'uitare') silence(TUNING.silence_s);
      if (e.ending === 'tarus') SOUND.tick(0.5);
      return;
    default:
      return;
  }
}

/** A line the table speaks at a beat, from src/strings.ts; most beats are wordless. */
function line(e: Entry): string | null {
  switch (e.event) {
    case 'stinge':
      return LINES.candleOut.ro;
    case 'dark_dawn':
      return LINES.darkDawn.ro;
    case 'soroc_missed':
      return LINES.noColiva.ro;
    case 'priest':
      return LINES.priest.ro;
    case 'ended':
      return e.ending === 'tarus' ? LINES.hunter.ro : null;
    default:
      return null;
  }
}

/** A saved wake on this device, unless `?reset` or a fixture asks for a fresh one. */
async function openWake(now: number): Promise<Wake> {
  if (params.has('reset')) localStorage.removeItem(SAVE_KEY);
  const fixture = params.get('fixture');
  const saved = fixture ? null : localStorage.getItem(SAVE_KEY);
  const loaded = saved ? await Wake.load(saved) : null;
  if (loaded) {
    loaded.apply({ type: 'resume' }, now);
    if (loaded.state().phase === 'boot') loaded.apply({ type: 'begin' }, now);
    return loaded;
  }
  const wake = await Wake.begin(now);
  // until step 5 there is no boot sequence: they bring you home at once
  if (isFixture(fixture)) applyFixture(wake, fixture, now);
  else wake.apply({ type: 'begin' }, now);
  return wake;
}

async function main(): Promise<void> {
  await loadFaces();
  if (params.has('icon')) {
    // the home-screen icon: the troita niche on the room's dark (scripts/make-icons.mjs photographs it)
    const { nicheSVG } = await import('./render/furniture');
    const icon = document.createElement('div');
    icon.className = 'icon-mark';
    icon.innerHTML = nicheSVG('icon', { roof: true, thread: true, icon: true });
    document.body.append(icon);
    return;
  }
  if (params.has('sheet')) {
    // every card face on one page: the wireframe an artist replaces
    const { cardSheet } = await import('./render/sheet');
    document.body.append(cardSheet());
    return;
  }
  const wake = await openWake(Date.now());
  if (params.has('fixture')) window.priveghi = { view: () => wake.state() };

  const stage = document.getElementById('stage')!;
  const rotate = document.getElementById('rotate')!;
  rotate.innerHTML = rotateSVG();
  const table = new Table(stage);
  const pageEl = document.createElement('section');
  pageEl.className = 'page';
  pageEl.setAttribute('aria-live', 'polite');
  document.body.append(pageEl);
  const page = new Page(pageEl, (dor, on) => wake.matches(dor, on, Date.now()));
  const strip = document.createElement('div');
  strip.className = 'toast';
  strip.setAttribute('role', 'status');
  stage.append(strip);
  if (params.has('annotate')) annotate(stage);

  let stripTimer = 0;
  let stripFocus = '';
  const say = (html: string, ms: number = TUNING.toast_ms, focus = '') => {
    strip.innerHTML = html;
    strip.classList.add('show');
    stripFocus = focus;
    window.clearTimeout(stripTimer);
    stripTimer = window.setTimeout(() => {
      strip.classList.remove('show');
      stripFocus = '';
    }, ms);
  };
  const text = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  // a review fixture never touches the wake saved on this device
  const persist = !params.get('fixture');
  const save = () => {
    if (!persist) return;
    const now = Date.now();
    const paused = wake.state().clock.paused_at !== null;
    if (!paused) wake.apply({ type: 'pause' }, now);
    localStorage.setItem(SAVE_KEY, wake.save());
    if (!paused) wake.apply({ type: 'resume' }, now);
  };

  let view: View = wake.state();
  let seen = view.log.length;
  let clock = 0;
  const act = (a: Action) => {
    const answer = wake.apply(a, Date.now());
    if (answer.ok && answer.changed) refresh();
    return answer.ok;
  };
  /** The clock runs while the wake does: a stopped wake (her door, an ending) is drawn still. */
  const startClock = () => {
    window.clearInterval(clock);
    if (params.has('still') || view.phase !== 'wake') return;
    clock = window.setInterval(() => {
      act({ type: 'tick' });
      // the candle burns between the engine's beats: a cheap re-render on every tick (R67)
      table.renderCandle(view, Date.now());
    }, TUNING.tick_ms);
  };
  /** The Dor in hand is told by contour weight on its stack; a Dor that left the cloth leaves the hand. */
  const select = () => {
    for (const s of stage.querySelectorAll('.stack.selected')) s.classList.remove('selected');
    const id = page.inHand;
    if (id === null) return;
    const stack = [...stage.querySelectorAll<HTMLElement>('.stack[data-kind="dor"], .cards .tied[data-kind="dor"]')].find((s) => (s.dataset.ids ?? '').split(' ').includes(String(id)));
    if (stack) stack.classList.add('selected');
    else page.inHand = null;
  };
  function refresh(): void {
    view = wake.state();
    const v = view;
    const fresh = v.log.slice(seen);
    seen = v.log.length;
    stage.classList.toggle('booting', v.phase === 'boot');
    for (const e of fresh) {
      sound(e);
      if (e.event === 'precue') table.gutter(v.config.precue_ms);
      const said = line(e);
      if (said) {
        page.say(said);
        say(`<span>${text(said)}</span>`);
      }
      if (e.event === 'ended' || e.event === 'bride_stands') pageEl.classList.add('open');
    }
    table.render(v);
    select();
    page.render(v);
    if (fresh.some((e) => ['day_closed', 'ended', 'bride_stands'].includes(e.event))) save();
    if (v.phase !== 'wake') window.clearInterval(clock);
    const b = document.body.dataset;
    b.day = String(v.day);
    b.phase = v.phase;
    b.night = v.night ? '1' : '0';
    b.candle = v.candle ? '1' : '0';
    b.uitare = String(v.uitare);
    b.spaima = String(v.spaima);
    b.putere = String(v.putere);
    b.ending = v.ending ?? '';
  }

  const focusOf = (el: HTMLElement): Focus => {
    if (el.dataset.tap === 'tally') return { tally: true };
    const ids = (el.dataset.ids ?? '').split(' ').filter(Boolean).map(Number);
    return ids.length ? { ids } : null;
  };

  attachInput(stage, table, {
    // the drags of step 3
    probe: () => false,
    place: () => false,
    unplace: () => false,
    tapFlame: () => undefined,
    lifted: () => SOUND.tick(1.1),
    refused: () => SOUND.tick(0.8),
    clear: () => {
      page.inHand = null;
      select();
    },
    tap: (el: HTMLElement, long: boolean) => {
      const kind = el.dataset.tap;
      if (kind === 'page') {
        pageEl.classList.toggle('open');
        return;
      }
      // the troita (rest) and the door (TRECI) answer in steps 3 and 4
      if (kind === 'troita' || kind === 'door') return;
      const f = focusOf(el);
      if (!f) return;
      const key = JSON.stringify(f);
      const second = stripFocus === key;
      const v = view;
      if ('ids' in f) {
        const c = v.cards.find((x) => x.id === f.ids[0]);
        // a tapped Dor is the Dor in hand until another Dor is tapped, or the bare table
        if (c?.kind === 'dor' && (c.at === 'cloth' || c.at === 'sill')) page.inHand = c.id;
      }
      select();
      page.say(null);
      page.focus = f;
      page.render(v);
      // a tap shows the strip; a second tap, or a hold, opens the page (on a phone it is folded away)
      if (second || long) pageEl.classList.add('open');
      const html = page.strip(v, f, page.inHand);
      if (html) say(html, TUNING.toast_ms, key);
      SOUND.page();
    },
  });
  // the first touch opens the sound (iOS needs a gesture) and lets the wind in
  const firstTouch = () => {
    unlockAudio();
    startAmbience();
  };
  stage.addEventListener('pointerdown', firstTouch, { capture: true });
  stage.addEventListener('keydown', firstTouch, { capture: true });
  pageEl.addEventListener('pointerdown', () => {
    unlockAudio();
    if (document.body.dataset.composition === 'phone') pageEl.classList.remove('open');
  });
  // the clock runs only while someone is at the table; leaving saves the wake
  document.addEventListener('visibilitychange', () => {
    act({ type: document.hidden ? 'pause' : 'resume' });
    if (document.hidden) save();
  });

  refresh();
  startClock();
  if (view.phase === 'ended' || view.phase === 'door') pageEl.classList.add('open');

  const fit = () => fitStage(stage, pageEl, rotate);
  fit();
  window.addEventListener('resize', fit);
  window.visualViewport?.addEventListener('resize', fit);
}

await main();
document.body.dataset.ready = '1';
