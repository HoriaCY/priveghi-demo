// The demo: the engine holds the dead's wake; the table and the page draw it; hands send actions;
// the clock ticks; the wake is saved on this device only. Step 3: the drags that commit, the plays,
// STINGE and rest by touch, the close's visible beats. Step 4: the dream's deps, her door (TRECI by
// a drag, the refusal by a tap on the page), another wake after an ending, the dishes' strip.
// Step 5: the boot in the dark (a touch strikes the match, a second brings you home), the fade and
// the stake, the Bride's dimming, the save at every beat, another wake landing in the dark.
import './render/style.css';
import { Wake } from './engine';
import type { Action, Card, Commit, Entry, View } from './engine';
import { applyFixture, isFixture } from './fixtures';
import { attachInput } from './play/input';
import { Page, type Focus } from './play/page';
import { openPlay, type Play } from './play/plays';
import { SOUND, silence, startAmbience, unlockAudio } from './render/audio';
import { ownerName } from './render/catalog';
import { fitStage } from './render/fit';
import { rotateSVG } from './render/furniture';
import { CANDLE, DOOR_X, FORECAST, PUTERE, ROW_CLOTH, ROW_KIT, STILL_LIFE, TALLY, nicheX } from './render/layout';
import { Table, type Target } from './render/table';
import { AMINTIRE, BROUGHT_HOME, LINES, POMENIRE, TYPE_TEST } from './strings';
import { TUNING } from './tuning';

const params = new URLSearchParams(location.search);
const SAVE_KEY = 'priveghi.v3';
const REDUCED = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

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
      // the match was struck at the first touch; the thread, the toaca and the chime as the pool opens
      SOUND.thread();
      window.setTimeout(() => SOUND.toaca(), 250);
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
    case 'treci':
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

/** The last line the table spoke in the log's last close (what a reload, or a review fixture, lands on). */
function lastLine(log: Entry[]): string | null {
  const from = log.map((e) => e.event).lastIndexOf('day_closed');
  return log.slice(Math.max(0, from)).map(line).filter((s): s is string => s !== null).pop() ?? null;
}

/** A line the table speaks at a beat, from src/strings.ts; most beats are wordless. */
function line(e: Entry): string | null {
  switch (e.event) {
    case 'stinge':
      return LINES.candleOut.ro;
    case 'candle':
      // a day begun without a flame says so; the dark-dawn pip at its close is a loss, and losses are quiet
      return e.lit ? null : LINES.darkDawn.ro;
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
    return loaded;
  }
  // a fresh wake waits in the dark for the first touch (the boot); a review fixture begins on its own
  const wake = await Wake.begin(now);
  if (isFixture(fixture)) applyFixture(wake, fixture, now);
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
  stage.style.setProperty('--gone-ms', `${TUNING.gone_ms}ms`);
  stage.style.setProperty('--fade-s', `${TUNING.fade_s}s`);
  stage.style.setProperty('--stake-ms', `${TUNING.stake_ms}ms`);
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
  // the composition (beside, below, folded over the phone's right side) is known before the first draw reads it
  const fit = () => fitStage(stage, pageEl, rotate);
  fit();

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
  const phone = () => document.body.dataset.composition === 'phone';
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
  /** The boot: the match has been struck (the troita's small pool is open); the next touch brings you home. */
  let lit = false;
  let bootTimer = 0;
  /** The play whose paper is open; closed by the renderer when the day's close resolved its act. */
  let play: Play | null = null;
  let resolving = false;
  /** The stacks' re-flow held back while a guttered Dor fades. */
  let reflow = 0;
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
    for (const s of stage.querySelectorAll('.stack.selected, .cards .tied.selected')) s.classList.remove('selected');
    const id = page.inHand;
    if (id === null) return;
    const stack = [...stage.querySelectorAll<HTMLElement>('.stack[data-kind="dor"], .cards .tied[data-kind="dor"]')].find((s) => (s.dataset.ids ?? '').split(' ').includes(String(id)));
    if (stack) stack.classList.add('selected');
    else page.inHand = null;
  };
  const cardOf = (id: number): Card | undefined => view.cards.find((c) => c.id === id);
  /** The card an act was committed on, from the log (the resolved event does not carry it). */
  const targetOf = (dor: number): Card | undefined => {
    const c = [...view.log].reverse().find((x) => x.event === 'committed' && x.dor === dor);
    return c?.event === 'committed' ? cardOf(c.on) : undefined;
  };

  function refresh(): void {
    view = wake.state();
    const v = view;
    const fresh = v.log.slice(seen);
    seen = v.log.length;
    stage.classList.toggle('booting', v.phase === 'boot');
    stage.classList.toggle('dark0', v.phase === 'boot' && !lit);
    stage.classList.toggle('playing', Boolean(v.commit));
    // the endings' marks on the table (chapter section 10): the Bride dims every gold but the troita's;
    // Uitare fades the table to Alb de Var; the stake's shadow falls on the sheet
    stage.classList.toggle('bride', v.phase === 'door' || (v.phase === 'ended' && v.ending === 'nunta'));
    stage.classList.toggle('fade', v.phase === 'ended' && v.ending === 'uitare');
    stage.classList.toggle('stake', v.phase === 'ended' && v.ending === 'tarus');
    // the day's close resolves an open play as the skip: the paper is closed here
    if (play && !v.commit && !resolving) {
      play.close();
      play = null;
    }
    // the act just resolved: the Pomenire that follows it names the Amintire made and its owner
    let made: { strength: number; owner: string } | null = null;
    /** The strip holds one thing per beat: a spoken line outranks the Pomenire strip of the same close. */
    let named: { nm: string; sub: string } | null = null;
    let spoken: string | null = null;
    const gone: number[] = [];
    for (const e of fresh) {
      sound(e);
      if (e.event === 'precue') table.gutter(v.config.precue_ms);
      if (e.event === 'guttered') gone.push(e.card);
      if (e.event === 'resolved') {
        const on = targetOf(e.dor);
        made = { strength: e.strength, owner: on ? ownerName(on) : '' };
      }
      if (e.event === 'pomenire') {
        // the living name you, even when the counter does not move (charter section 1)
        const nm = made ? AMINTIRE[Math.max(0, Math.min(3, made.strength)) as 0 | 1 | 2 | 3].ro : POMENIRE.ro;
        const sub = made ? [made.owner, POMENIRE.ro].filter(Boolean).join(' · ') : '';
        made = null;
        named = { nm, sub };
      }
      spoken = line(e) ?? spoken;
      // the ending's page opens everywhere; in her door the page opens on its own only where it lies beside the
      // table: on the phone it would cover the door she stands in (the day tag opens it, and a tap on it refuses)
      if (e.event === 'ended' || (e.event === 'bride_stands' && !phone())) pageEl.classList.add('open');
    }
    if (spoken) {
      page.say(spoken);
      say(`<span>${text(spoken)}</span>`);
    } else if (named) {
      say(`<span class="nm">${text(named.nm)}</span>${named.sub ? `<span class="sub">${text(named.sub)}</span>` : ''}`);
      page.say([named.nm, named.sub].filter(Boolean).join(' · '));
    }
    // a guttered Dor fades where it lay before the stacks re-flow (losses are quiet)
    window.clearTimeout(reflow);
    const fading = REDUCED ? [] : gone.map((id) => table.stackOf(id)).filter((s): s is HTMLElement => s !== null);
    if (fading.length) {
      for (const s of fading) s.classList.add('gone');
      reflow = window.setTimeout(() => {
        table.render(view);
        select();
      }, TUNING.gone_ms);
    } else {
      table.render(v);
    }
    select();
    page.render(v);
    if (fresh.some((e) => ['brought_home', 'day_closed', 'ended', 'bride_stands'].includes(e.event))) save();
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

  /** The cat's victim: the cup on the kit row; when the cup is the act's own target, or away, the target in the verb's side seat. */
  const victimOf = (commit: Commit): HTMLElement | null => {
    const cup = view.cards.find((c) => c.kind === 'lucru' && c.lucru === 'cana' && c.at === 'kit');
    return (cup && table.stackOf(cup.id)) ?? table.seatOf(commit.verb);
  };
  /** The commit just made opens its play: the paper reports a grade; the engine resolves. */
  const beginPlay = () => {
    const commit = view.commit;
    if (!commit || play) return;
    const dor = commit.dor;
    const thread = cardOf(commit.dor);
    const sleeper = cardOf(commit.on);
    // the dream's hand: the Dor's kind and the sleeper's affinities are the right tiles (R70); read, never decided here
    const vis = commit.verb === 'sopteste' && thread?.kind === 'dor' && sleeper?.kind === 'om' ? { fel: thread.fel, affinities: sleeper.fel } : undefined;
    play = openPlay(commit.verb, {
      stage,
      day: view.day,
      mastiZile: view.config.masti_zile,
      vis,
      resolve: (grade) => {
        resolving = true;
        act({ type: 'resolve', dor, grade });
        resolving = false;
        play = null;
      },
      victim: () => victimOf(commit),
      gutter: (ms) => table.gutter(ms),
      tick: (pitch) => SOUND.tick(pitch),
      say: (html) => say(html),
      reduced: REDUCED,
    });
    // a play that resolved before it returned (reduced motion) leaves nothing to close
    if (!view.commit) play = null;
  };
  /** The action a drop implies (charter section 4); the engine says whether it fits. */
  const actionFor = (id: number, t: Target): Action | null => {
    if (t === 'sill') return { type: 'tie', dor: id };
    // the door takes your card and nothing else, ever (charter section 3)
    if (t === 'door') return cardOf(id)?.kind === 'cel_nenuntit' ? { type: 'treci' } : null;
    if ('niche' in t) {
      if (t.niche === 'bantuie') return { type: 'bantuie', loc: id };
      if (t.niche === 'asculta') return { type: 'asculta', om: id };
      return null;
    }
    return { type: 'place', dor: id, on: t.card };
  };

  /** Another wake, a new dead (R65): the engine lands in the dark, where the boot waits for a touch (R118 amended). */
  const again = () => {
    play?.close();
    play = null;
    page.focus = null;
    page.inHand = null;
    page.say(null);
    seen = 0;
    lit = false;
    window.clearTimeout(bootTimer);
    pageEl.classList.remove('open');
    act({ type: 'again' });
    save();
  };
  /** The boot's second touch, or its wait: they bring you home; the candle lights at your head; one line when the pool is open. */
  const begin = () => {
    window.clearTimeout(bootTimer);
    if (view.phase !== 'boot' || !lit) return;
    if (!act({ type: 'begin' })) return;
    startClock();
    window.setTimeout(() => {
      if (view.phase !== 'wake' || view.day !== 1) return;
      page.say(BROUGHT_HOME.ro);
      page.render(view);
      say(`<span>${text(BROUGHT_HOME.ro)}</span>`);
    }, TUNING.pool_open_ms);
  };
  /** The boot's first touch: the match is struck and the troita's small pool opens; the next touch, or the wait, brings you home. */
  const strike = () => {
    if (view.phase !== 'boot') return;
    if (lit) return begin();
    lit = true;
    SOUND.match();
    stage.classList.remove('dark0');
    bootTimer = window.setTimeout(begin, TUNING.boot_wait_ms);
  };

  const focusOf = (el: HTMLElement): Focus => {
    if (el.dataset.tap === 'tally') return { tally: true };
    if (el.dataset.tap === 'soroace') return { soroace: true };
    const ids = (el.dataset.ids ?? '').split(' ').filter(Boolean).map(Number);
    return ids.length ? { ids } : null;
  };

  attachInput(stage, table, {
    probe: (ids, t) => {
      const a = ids.length ? actionFor(ids[0], t) : null;
      return a ? wake.probe(a, Date.now()).ok : false;
    },
    place: (ids, t) => {
      const id = ids[0];
      if (id === undefined) return false;
      // a tied Dor let go on the sill again: it stays where it was, no act, no tick
      if (t === 'sill' && cardOf(id)?.at === 'sill') return true;
      const a = actionFor(id, t);
      if (!a || !act(a)) return false;
      if (a.type === 'place') beginPlay();
      return true;
    },
    unplace: (ids) => ids.length > 0 && act({ type: 'untie', dor: ids[0] }),
    // STINGE: refused in silence when it is already night
    tapFlame: () => void act({ type: 'stinge' }),
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
      if (kind === 'troita') {
        // ODIHNESTE-TE: the pre-cue, then the close; busy or corded, the lower tick only
        if (!act({ type: 'rest' })) return SOUND.tick(0.8);
        // the close is the act's own: it comes even where ?still holds the clock
        window.setTimeout(() => act({ type: 'tick' }), Math.max(0, view.clock.day_ends_at - Date.now()) + 1);
        return;
      }
      // the door answers a drag (TRECI), never a tap
      if (kind === 'door') return;
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
  // the first touch opens the sound (iOS needs a gesture) and lets the wind in; in the dark it strikes the match
  const firstTouch = () => {
    unlockAudio();
    startAmbience();
    if (view.phase === 'boot') strike();
  };
  stage.addEventListener('pointerdown', firstTouch, { capture: true });
  stage.addEventListener('keydown', firstTouch, { capture: true });
  pageEl.addEventListener('pointerdown', (e) => {
    unlockAudio();
    // her door: a tap on the Bride herself on the page is the refusal (R132), and the wake ends in Ratacire (R65);
    // the paper around her is not, so a stray tap on a page that lies open beside the table refuses nothing
    if (view.phase === 'door') {
      if ((e.target as Element).closest('.door .bride')) act({ type: 'ramai' });
      return;
    }
    // after any ending a tap on the page begins another wake (R65)
    if (view.phase === 'ended') return again();
    if (phone()) pageEl.classList.remove('open');
  });
  // the clock runs only while someone is at the table; leaving saves the wake
  document.addEventListener('visibilitychange', () => {
    act({ type: document.hidden ? 'pause' : 'resume' });
    if (document.hidden) save();
  });

  refresh();
  // a load lands on what the table last said (a reload mid-wake, a review fixture): the last close's line, without its sound
  const said = lastLine(view.log);
  if (said) {
    page.say(said);
    page.render(view);
    say(`<span>${text(said)}</span>`);
  }
  startClock();
  // a wake loaded with its play open (a reload mid-knock): the paper comes back
  beginPlay();
  if (view.phase === 'ended' || (view.phase === 'door' && !phone())) pageEl.classList.add('open');

  window.addEventListener('resize', fit);
  window.visualViewport?.addEventListener('resize', fit);
}

await main();
document.body.dataset.ready = '1';
