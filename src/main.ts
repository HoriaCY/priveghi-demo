// The demo: the engine holds the wake; the table and the page draw it; hands send actions; the
// clock ticks; the wake is saved on this device only.
import './render/style.css';
import { Wake } from './engine';
import type { Entry, Kind, Target } from './engine';
import { applyFixture } from './fixtures';
import { attachInput } from './play/input';
import { Page, type Focus } from './play/page';
import { SOUND, silence, startAmbience, unlockAudio } from './render/audio';
import { fitStage } from './render/fit';
import { rotateSVG } from './render/furniture';
import { Table } from './render/table';
import { LINES, TYPE_TEST } from './strings';
import { TUNING } from './tuning';

const params = new URLSearchParams(location.search);
const seed = Number(params.get('seed') ?? '1') || 1;
const SAVE_KEY = 'priveghi.v1';

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
  const marks: [number, number][] = [[452, 20], [100, 126], [272, 140], [784, 140], [1100, 140], [64, 384], [200, 366], [200, 520], [992, 400], [862, 560], [1084, 510]];
  marks.forEach(([x, y], i) => {
    const a = document.createElement('div');
    a.className = 'ann';
    a.textContent = String(i + 1);
    a.style.left = `${x}px`;
    a.style.top = `${y}px`;
    stage.append(a);
  });
}

/** Material sounds for the beats the engine logged; most losses are quiet by design. */
function sound(e: Entry): void {
  switch (e.event) {
    case 'precue':
      return SOUND.tick(0.6);
    case 'day_closed':
      return SOUND.chime();
    case 'placed':
      return typeof e.target === 'object' && e.target.niche === 'troita' ? SOUND.toaca() : SOUND.thread();
    case 'tied':
      return SOUND.thread();
    case 'unplaced':
      return SOUND.tick(0.9);
    case 'wax_fed':
    case 'offered':
      return SOUND.seal();
    case 'door_answered':
      return SOUND.page();
    case 'jale_mourned':
      return SOUND.heldNote();
  }
}

/** A saved wake on this device, unless `?reset` or a fixture asks for a fresh one. */
async function openWake(): Promise<Wake> {
  if (params.has('reset')) localStorage.removeItem(SAVE_KEY);
  const fixture = params.get('fixture');
  const saved = fixture ? null : localStorage.getItem(SAVE_KEY);
  const loaded = saved ? await Wake.load(saved) : null;
  if (loaded) {
    loaded.apply({ type: 'resume' }, Date.now());
    return loaded;
  }
  const wake = await Wake.begin(seed, Date.now());
  if (fixture) applyFixture(wake, fixture);
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
    // every card face on one page: the wireframe an artist replaces (docs/shots/step-2/cards-sheet.png)
    const { cardSheet } = await import('./render/sheet');
    document.body.append(cardSheet());
    return;
  }
  const wake = await openWake();

  const stage = document.getElementById('stage')!;
  const rotate = document.getElementById('rotate')!;
  rotate.innerHTML = rotateSVG();
  const table = new Table(stage);
  const pageEl = document.createElement('section');
  pageEl.className = 'page';
  pageEl.setAttribute('aria-live', 'polite');
  document.body.append(pageEl);
  const page = new Page(pageEl);
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
  const text = (line: string) => line.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  // a review fixture never touches the wake saved on this device
  const persist = !params.get('fixture');
  const save = () => {
    if (!persist) return;
    const now = Date.now();
    const paused = wake.state().clock.paused_left !== null;
    if (!paused) wake.apply({ type: 'pause' }, now);
    localStorage.setItem(SAVE_KEY, wake.save());
    if (!paused) wake.apply({ type: 'resume' }, now);
  };

  // the boot: a dark frame until the first touch, then the match, the troita's flame, the candle on its sill
  let lit = wake.state().phase !== 'boot';
  const strike = () => {
    if (lit) return;
    lit = true;
    unlockAudio();
    SOUND.match();
    window.setTimeout(() => stage.classList.remove('dark0'), 280);
  };

  let seen = wake.state().log.length;
  let clock = 0;
  const act = (a: Parameters<Wake['apply']>[0]) => {
    const answer = wake.apply(a, Date.now());
    if (answer.ok && answer.changed) refresh();
    return answer.ok;
  };
  const startClock = () => {
    window.clearInterval(clock);
    if (!params.has('still')) clock = window.setInterval(() => act({ type: 'tick' }), TUNING.tick_ms);
  };
  function refresh(): void {
    const s = wake.state();
    const fresh = s.log.slice(seen);
    seen = s.log.length;
    stage.classList.toggle('booting', s.phase === 'boot');
    stage.classList.toggle('dark0', s.phase === 'boot' && !lit);
    stage.classList.toggle('bride', s.phase === 'ended' && s.ending === 'cununie');
    for (const e of fresh) {
      sound(e);
      if (e.event === 'kindled') {
        // thread, the toaca, the chime; the candle becomes the table's; the pool opens over 1.8 s
        SOUND.thread();
        window.setTimeout(() => SOUND.toaca(), 250);
        window.setTimeout(() => SOUND.chime(), TUNING.pool_open_ms);
        window.setTimeout(startAmbience, TUNING.pool_open_ms);
      }
      if (e.event === 'door_answered') {
        page.say(LINES.deadLeave.ro);
        say(`<span>${text(LINES.deadLeave.ro)}</span>`);
      }
      if (e.event === 'silence') {
        silence(TUNING.silence_s);
        page.say(LINES.sabbathWater.ro);
        say(`<span>${text(LINES.sabbathWater.ro)}</span>`, TUNING.silence_s * 1000);
      }
      if (e.event === 'ended') {
        SOUND.ison();
        if (e.ending === 'pomelnic') window.setTimeout(() => SOUND.toaca(), 2500);
        pageEl.classList.add('open');
      }
    }
    table.render(s);
    page.render(s);
    if (fresh.some((e) => ['day_closed', 'kindled', 'ended'].includes(e.event))) save();
    if (s.phase === 'ended') window.clearInterval(clock);
    document.body.dataset.day = String(s.day);
    document.body.dataset.phase = s.phase;
    document.body.dataset.wax = String(s.wax);
    document.body.dataset.ending = s.ending ?? '';
  }

  /** The Bride's page, tapped: LINES.notYet, then another wake, in the dark again, with one less wax. */
  let refusing = false;
  const notYet = () => {
    const s = wake.state();
    if (s.phase !== 'ended' || s.ending !== 'cununie' || refusing) return;
    refusing = true;
    page.notYet = true;
    page.render(s);
    window.setTimeout(() => {
      page.notYet = false;
      refusing = false;
      pageEl.classList.remove('open');
      act({ type: 'again' });
      startClock();
    }, TUNING.not_yet_ms);
  };

  const focusOf = (el: HTMLElement): Focus => {
    const tap = el.dataset.tap;
    if (tap === 'troita' || tap === 'door') return { place: tap };
    const kind = el.dataset.kind as Kind | undefined;
    const ids = (el.dataset.ids ?? '').split(' ').filter(Boolean).map(Number);
    return kind ? { kind, ids } : null;
  };

  attachInput(stage, table, {
    probe: (ids: number[], target: Target) => wake.probe({ type: 'place', cards: ids, target }, Date.now()).ok,
    place: (ids: number[], target: Target) => act({ type: 'place', cards: ids, target }),
    unplace: (ids: number[]) => act({ type: 'unplace', cards: ids }),
    tapFlame: () => void act({ type: 'tap', on: 'flame' }),
    lifted: () => SOUND.tick(1.1),
    refused: () => {
      SOUND.tick(0.8);
      say(`<span>${text(LINES.doesNotFit.ro)}</span>`);
    },
    tap: (el: HTMLElement, long: boolean) => {
      if (wake.state().phase === 'ended') return notYet();
      if (el.dataset.tap === 'page') {
        pageEl.classList.toggle('open');
        return;
      }
      const f = focusOf(el);
      if (!f) return;
      const key = JSON.stringify(f);
      const second = stripFocus === key;
      page.say(null);
      page.setFocus(f);
      const s = wake.state();
      page.render(s);
      // a tap shows the strip; a second tap, or a hold, opens the page (on a phone it is folded away)
      if (second || long) pageEl.classList.add('open');
      const html = page.strip(s, f);
      if (html) say(html, TUNING.toast_ms, key);
      SOUND.page();
    },
  });
  // the first touch opens the sound (iOS needs a gesture) and, in the dark, strikes the match
  const firstTouch = () => {
    unlockAudio();
    if (wake.state().phase === 'boot') strike();
  };
  stage.addEventListener('pointerdown', firstTouch, { capture: true });
  stage.addEventListener('keydown', firstTouch, { capture: true });
  pageEl.addEventListener('pointerdown', () => {
    unlockAudio();
    if (wake.state().phase === 'ended') return notYet();
    if (document.body.dataset.composition === 'phone') pageEl.classList.remove('open');
  });
  // the clock runs only while someone is at the table; leaving saves the wake
  document.addEventListener('visibilitychange', () => {
    act({ type: document.hidden ? 'pause' : 'resume' });
    if (document.hidden) save();
  });

  refresh();
  startClock();
  if (wake.state().phase === 'ended') pageEl.classList.add('open');

  const fit = () => fitStage(stage, pageEl, rotate);
  fit();
  window.addEventListener('resize', fit);
  window.visualViewport?.addEventListener('resize', fit);
}

await main();
document.body.dataset.ready = '1';
