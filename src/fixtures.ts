// Named table states for review and screenshots (`?fixture=`). A fixture is only a list of actions
// (charter section 9); the engine decides what they produce. The greedy considered hand asks the
// engine for every match (`matches`, which says -1 for a thing that rests) and never reads a rule of
// its own; it acts by night, two knocks a night, so the house stays under the priest's threshold (R90).
import type { Action, Wake } from './engine';

export const FIXTURES = ['start', 'night', 'wake', 'dark', 'door', 'preot', 'tarus', 'uitare'] as const;
export type Fixture = (typeof FIXTURES)[number];

export const isFixture = (name: string | null): name is Fixture => FIXTURES.includes(name as Fixture);

export function applyFixture(wake: Wake, name: Fixture, now: number): void {
  const act = (a: Action, when = now) => {
    const r = wake.apply(a, when);
    if (!r.ok) throw new Error(`fixture ${name}: ${a.type} refused (${r.refusal})`);
  };
  const awake = () => wake.state().phase === 'wake';
  const close = () => act({ type: 'close_day' });
  act({ type: 'begin' });
  switch (name) {
    case 'start':
      return;
    case 'night':
      return act({ type: 'stinge' });
    case 'dark':
      // idle closes until the house stops lighting the candle
      for (let i = 0; i < 12 && awake() && wake.state().candle; i++) close();
      return;
    case 'uitare':
      for (let i = 0; i < 40 && awake(); i++) close();
      return;
    case 'wake': {
      // four considered days: Tinda haunted on the first, each Dor to its best thing, rest at dusk
      const tinda = wake.state().cards.find((c) => c.kind === 'loc' && c.loc === 'tinda' && c.at === 'road');
      if (tinda) act({ type: 'bantuie', loc: tinda.id });
      for (let d = 0; d < 4 && awake(); d++) night(wake, now, act);
      return;
    }
    case 'door':
      for (let d = 0; d < 9 && awake(); d++) night(wake, now, act);
      return;
    case 'preot':
    case 'tarus': {
      // two apparitions by day: a Dor on someone at the table or on a place
      for (let i = 0; i < 2; i++) apparition(wake, now, act, name === 'tarus' ? 'minunat' : 'bun');
      if (name === 'tarus') act({ type: 'stinge' });
      close();
      return;
    }
  }
}

/**
 * One night of the considered hand (R90): the clock is ticked to dusk; a loud house (Spaima at
 * `rest_at` or above) is rested, which calms it and costs the night (a night act would cord the troita);
 * otherwise two knocks, then the close. The threshold is the hand's own, not a rule.
 */
function night(wake: Wake, now: number, act: (a: Action, when?: number) => void, rest_at = 3): void {
  const dusk = wake.state().clock.dusk_at;
  if (!wake.state().night) act({ type: 'tick' }, dusk);
  if (wake.state().spaima >= rest_at) act({ type: 'rest' });
  else greedy(wake, now, act);
  act({ type: 'close_day' });
}

/**
 * Each loose Dor, oldest first, goes to the kit thing with the highest match, at most `knocks` a
 * night; the engine's `matches` says -1 for a thing that rests.
 */
function greedy(wake: Wake, now: number, act: (a: Action, when?: number) => void, knocks = 2): void {
  const loose = wake.state().cards.filter((c) => c.kind === 'dor' && c.at === 'cloth').map((c) => c.id);
  let done = 0;
  for (const dor of loose) {
    const v = wake.state();
    if (v.phase !== 'wake' || v.putere === 0 || done >= knocks) return;
    if (!v.cards.some((c) => c.id === dor && c.at === 'cloth')) continue;
    let best: { on: number; m: number } | null = null;
    for (const t of v.cards) {
      if (t.kind !== 'lucru' || t.at !== 'kit') continue;
      const m = wake.matches(dor, t.id, now);
      if (m >= 0 && (!best || m > best.m)) best = { on: t.id, m };
    }
    if (!best) continue;
    act({ type: 'place', dor, on: best.on });
    act({ type: 'resolve', dor, grade: 'bun' });
    done++;
  }
}

/**
 * ARATA-TE by day: a loose Dor on the person or place that answers it best. The enemy's Dor is
 * left alone: a vrajba Amintire calms the house (chapter §7), and these fixtures want it frightened.
 */
function apparition(wake: Wake, now: number, act: (a: Action) => void, grade: 'bun' | 'minunat'): void {
  const v = wake.state();
  const loose = v.cards.filter((c) => c.kind === 'dor' && c.at === 'cloth');
  const dor = loose.find((c) => c.kind === 'dor' && c.fel !== 'vrajba') ?? loose[0];
  if (!dor) return;
  let best: { on: number; m: number } | null = null;
  for (const t of v.cards) {
    if (!((t.kind === 'om' && t.at === 'cloth') || (t.kind === 'loc' && t.at === 'road'))) continue;
    const m = wake.matches(dor.id, t.id, now);
    if (m >= 0 && (!best || m > best.m)) best = { on: t.id, m };
  }
  if (!best) return;
  act({ type: 'place', dor: dor.id, on: best.on });
  act({ type: 'resolve', dor: dor.id, grade });
}
