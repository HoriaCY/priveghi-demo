// The plays (charter section 7, RULINGS R70): the renderer's, reporting a grade; the engine owns
// every rule and resolves the commit. Bocanit for URNESTE, ported from prototype v5 section 12
// (batatia, skipPlay): the flame gives a rhythm, four taps are measured against it. The dream play
// lands in step 4, so a dream commit resolves at once as the skip; ARATA-TE has no play (R64).
// The skip's transitions, the cat and the draft, cycle and are never the same twice in a row (the
// mask joins in step 4). performance.now() and setTimeout only, so Playwright's clock can drive
// the knock. Every word on the paper from src/strings.ts; the palette only through C.
import './plays.css';
import type { Grade, Verb } from '../engine';
import { ART } from '../render/art';
import { CANDLE } from '../render/layout';
import { C } from '../render/palette';
import { CAT, PLAY, SKIP } from '../strings';
import { TUNING } from '../tuning';

export type Transition = 'cat' | 'draft';

export interface PlayDeps {
  stage: HTMLElement;
  /** The grade goes to the engine (`resolve {dor, grade}`); a fumble and the skip go as `skipped` and `slab`. */
  resolve: (grade: Grade) => void;
  /** The card the cat knocks over (the cup, or the commit's target), if one is on the table. */
  victim: () => HTMLElement | null;
  /** The table candle's flame gutters this long (the draft). */
  gutter: (ms: number) => void;
  tick: (pitch?: number) => void;
  /** The strip. */
  say: (html: string) => void;
  reduced: boolean;
}

export interface Play {
  /** Removes the paper, stops a transition and cancels every timer; idempotent. The engine is not told. */
  close(): void;
}

/** Reduced motion: the charter's fade (section 7), a law, not a knob. */
const FADE_MS = 200;

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

/** The tap zone's label: the wolf-tooth row of URNESTE's lintel. No string names the zone, so it carries a mark. */
const mark = () =>
  `<svg viewBox="0 0 120 24" aria-hidden="true"><path d="M2 20 L14 4 L26 20 L38 4 L50 20 L62 4 L74 20 L86 4 L98 20 L110 4 L118 16" fill="none" stroke="${C.wax}" stroke-width="2.4"/></svg>`;

/** Where the hand rises in the draft: over the candle's foot, cupping the flame from the left (the candle's x is R92's). */
const HAND = { x: CANDLE.x - 56, y: CANDLE.y + 20, w: 90, h: 90 };
/** The cat's lunge, measured from its victim's left edge: v5's cat (left -140, lunge 560) met the cup at 510. */
const LUNGE_DX = 50;

class Timers {
  private ids: number[] = [];
  after(ms: number, f: () => void): void {
    this.ids.push(window.setTimeout(f, ms));
  }
  cancel(): void {
    for (const id of this.ids) window.clearTimeout(id);
    this.ids = [];
  }
}

interface Run {
  cancel(): void;
}

let last: Transition | null = null;

/** The next transition in the cycle: never the same twice in a row. */
export function nextTransition(prev: Transition | null): Transition {
  return prev === 'cat' ? 'draft' : 'cat';
}

const pick = (): Transition => {
  last = nextTransition(last);
  return last;
};

/**
 * One transition on the stage, then `then`. The cat crosses and knocks the victim at mid-crossing
 * (v5's 0.9 s of 1.8); the draft gutters the flame under a hand and nudges the victim. A fumble's
 * cat crosses without the knock. Reduced motion: the piece fades in place over FADE_MS.
 */
function start(t: Transition, deps: PlayDeps, then: () => void, knock: boolean): Run {
  const timers = new Timers();
  const piece = document.createElement('div');
  let victim: HTMLElement | null = null;
  let held = '';
  const release = () => {
    if (victim && held) victim.classList.remove(held);
    held = '';
  };
  const end = (ms: number) =>
    timers.after(ms, () => {
      piece.remove();
      release();
      then();
    });
  const fade = () => {
    piece.style.animationDuration = `${FADE_MS}ms`;
    piece.classList.add('fade');
    end(FADE_MS);
  };

  if (t === 'cat') {
    piece.className = 'cat';
    piece.innerHTML = `<svg viewBox="0 0 120 168" aria-hidden="true">${ART.pisica()}</svg>`;
    // the cat lunges where its victim lies (v5's lunge met the cup where v5 kept it): the victim's
    // left edge sets the lunge; a stack carries its x, the side seat its left
    victim = deps.victim();
    const vx = victim ? Number(victim.dataset.x ?? parseFloat(victim.style.left)) : NaN;
    if (Number.isFinite(vx)) piece.style.setProperty('--lunge-x', `${vx + LUNGE_DX}px`);
    deps.stage.append(piece);
    deps.say(`<span>${esc(CAT.ro)}</span>`);
    if (deps.reduced) {
      fade();
    } else {
      piece.style.animationDuration = `${TUNING.cat_ms}ms`;
      piece.classList.add('run');
      if (knock) {
        timers.after(TUNING.cat_ms / 2, () => {
          if (!victim) return;
          deps.stage.style.setProperty('--knock-ms', `${TUNING.knock_hit_ms}ms`);
          held = 'knocked';
          victim.classList.add(held);
          deps.tick(1.4);
          timers.after(TUNING.knock_hit_ms, release);
        });
      }
      end(TUNING.cat_ms);
    }
  } else {
    piece.className = 'draft';
    piece.style.left = `${HAND.x}px`;
    piece.style.top = `${HAND.y}px`;
    piece.style.width = `${HAND.w}px`;
    piece.style.height = `${HAND.h}px`;
    piece.innerHTML = `<svg viewBox="0 0 120 120" aria-hidden="true">${ART.mana()}</svg>`;
    deps.stage.append(piece);
    if (deps.reduced) {
      deps.gutter(FADE_MS);
      fade();
    } else {
      deps.gutter(TUNING.draft_ms);
      piece.style.animationDuration = `${TUNING.draft_ms}ms`;
      piece.classList.add('run');
      victim = deps.victim();
      if (victim) {
        deps.stage.style.setProperty('--draft-ms', `${TUNING.draft_ms}ms`);
        held = 'drafted';
        victim.classList.add(held);
      }
      // the one material sound: the flame's dry gutter, as the hand reaches it
      timers.after(TUNING.draft_ms / 4, () => deps.tick(0.6));
      end(TUNING.draft_ms);
    }
  }

  return {
    cancel: () => {
      timers.cancel();
      piece.remove();
      release();
    },
  };
}

/** A transition on its own (the hands may call it for a skip they resolve themselves). */
export function runTransition(t: Transition, deps: PlayDeps, then: () => void): void {
  last = t;
  start(t, deps, then, true);
}

/**
 * The play a commit opens. URNESTE: the Bocanit paper. Any other verb has no play in this step
 * (the dream in step 4, the apparition never, R64): a transition runs at once and the commit
 * resolves as the skip.
 */
export function openPlay(verb: Verb, deps: PlayDeps): Play {
  const timers = new Timers();
  let paper: HTMLElement | null = null;
  let run: Run | null = null;
  let open = true;

  const close = () => {
    if (!open) return;
    open = false;
    timers.cancel();
    run?.cancel();
    run = null;
    paper?.remove();
    paper = null;
  };
  /** The paper leaves and the grade goes to the engine. */
  const finish = (grade: Grade) => {
    if (!open) return;
    open = false;
    timers.cancel();
    paper?.remove();
    paper = null;
    deps.resolve(grade);
  };
  /** The paper leaves, a transition plays, then the grade goes to the engine. */
  const leave = (t: Transition, grade: Grade, knock: boolean) => {
    if (!open || run) return;
    timers.cancel();
    paper?.remove();
    paper = null;
    run = start(
      t,
      deps,
      () => {
        run = null;
        finish(grade);
      },
      knock,
    );
  };

  if (verb !== 'urneste') {
    leave(pick(), 'skipped', true);
    return { close };
  }

  const gaps = TUNING.knock_gaps_ms;
  paper = document.createElement('div');
  paper.className = 'play';
  paper.dataset.play = 'bocanit';
  paper.innerHTML =
    `<div class="playcard"><div class="playtitle">${esc(PLAY.bocanit.ro)}</div>` +
    `<div class="flamebeat">${'<div class="dot"></div>'.repeat(gaps.length)}</div>` +
    `<button type="button" class="tapzone" aria-label="${esc(PLAY.bocanit.ro)}">${mark()}</button>` +
    `<div class="playbtns"><button type="button" class="skip">${esc(SKIP.ro)}</button></div></div>`;
  // the paper covers the table: a press on it is not a press on the table
  paper.addEventListener('pointerdown', (e) => e.stopPropagation());
  deps.stage.append(paper);
  const dots = [...paper.querySelectorAll<HTMLElement>('.dot')];
  const zone = paper.querySelector<HTMLElement>('.tapzone')!;
  const skip = paper.querySelector<HTMLElement>('.skip')!;

  // the flame gives the rhythm: the i-th dot lights at the i-th cumulative gap after the paper's rise
  const schedule: number[] = [];
  let acc = 0;
  gaps.forEach((g, i) => {
    acc += g;
    schedule.push(acc);
    timers.after(TUNING.play_open_ms + acc, () => {
      dots[i].classList.add('on');
      deps.tick(1.3);
    });
  });
  let t0: number | null = null;
  const taps: number[] = [];
  timers.after(TUNING.play_open_ms + acc + TUNING.knock_lead_ms, () => {
    for (const d of dots) d.classList.remove('on');
    zone.classList.add('ready');
    t0 = performance.now();
    zone.focus({ preventScroll: true });
  });
  // the i-th tap is expected at the i-th cumulative gap after the zone opened; the mean error grades it
  const tap = () => {
    if (t0 === null || taps.length >= gaps.length) return;
    taps.push(performance.now() - t0);
    deps.tick(1.0);
    dots[taps.length - 1].classList.add('hit');
    if (taps.length < gaps.length) return;
    const err = taps.reduce((sum, at, i) => sum + Math.abs(at - schedule[i]), 0) / gaps.length;
    if (err <= TUNING.knock_tol_ms) finish('minunat');
    else if (err <= TUNING.knock_good_ms) finish('bun');
    else {
      // a fumble: the engine resolves it as the skip; the same cat crosses, and nothing goes over
      last = 'cat';
      leave('cat', 'slab', false);
    }
  };
  zone.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    tap();
  });
  zone.addEventListener('keydown', (e) => {
    if ((e.key !== 'Enter' && e.key !== ' ') || e.repeat) return;
    e.preventDefault();
    e.stopPropagation();
    tap();
  });
  skip.addEventListener('click', () => leave(pick(), 'skipped', true));

  return { close };
}
