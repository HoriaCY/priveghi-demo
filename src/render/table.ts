// The table as a function of the engine's view (the dead's wake, RULINGS R61). Built once;
// render(view) moves, adds and removes stacks and updates the niches, the sill, the tally, the
// forecast, the door and the dusk; renderCandle(view, now) runs every tick so the candle burns
// down in real time (R67). Step 4: Spaima's tells on the places and on ARATA-TE's lintel (R69, from
// the thresholds in src/tuning.ts, unsimulated), the soroc dishes on the far side, the door's label
// in her door. Nothing here decides a rule.
import type { Card, Loc, Lucru, Verb, View, Where } from '../engine';
import { OAMENI, SOURCES } from '../engine';
import { DAYS, NICHE as LABELS, PREVESTIRE, STINGE, TRECI } from '../strings';
import { TUNING } from '../tuning';
import { cardBackSVG } from './card';
import { faceSVG, hemOfPerson } from './catalog';
import { brideSVG, candleSVG, cordSVG, darkDoorSVG, grainRowSVG, nicheSVG, pipsSVG, plankSVG, sorocSVG, stillLifeSVG, tallyBandSVG, tellSVG } from './furniture';
import { CANDLE, CANDLE_LABEL, CARD, DOOR_X, FLAME_HIT, FORECAST, NICHE, PLANK, PUTERE, ROW_CLOTH, ROW_KIT, SEAT, SIDE, SILL, SOROACE, STILL_LIFE, TALLY, YOU_AT, flameAt, nicheX, rowSlots, shadowFor } from './layout';
import { M } from './motifs';
import { C } from './palette';

/** A drop target (step 3): a card, a niche, the troita's sill, the dark door. */
export type Target = { card: number } | { niche: Verb } | 'sill' | 'door';
type Tell = Parameters<typeof tellSVG>[0];
export type SorocState = Parameters<typeof sorocSVG>[0];

type NicheOpts = Parameters<typeof nicheSVG>[1];
const NICHES: { id: Verb; opts: NicheOpts }[] = [
  { id: 'odihneste', opts: { roof: true, thread: true, icon: true } },
  { id: 'bantuie', opts: { mark: 'meandru' } },
  { id: 'asculta', opts: { mark: 'pom' } },
  { id: 'urneste', opts: { mark: 'colt' } },
  { id: 'sopteste', opts: { mark: 'sarpe' } },
  { id: 'arata', opts: { mark: 'ochi' } },
];

/** Row order on the kit row: the house's things, the finds, then the pomane. */
const LUCRURI: Lucru[] = ['cana', 'broboada', 'inel', 'icoana', 'oglinda', 'cutit', 'fluier', 'arc', 'pomana'];
const LOCURI: Loc[] = ['casa', 'tinda', 'curte', 'sat', 'biserica'];
/** The dark door's width (style.css .darkdoor; charter section 3). */
const DOOR_W = 60;

interface Group { key: string; cards: Card[] }
interface NicheView { el: HTMLElement; heart: HTMLElement; side: HTMLElement; sig: string }

const el = (cls: string, html = ''): HTMLDivElement => {
  const d = document.createElement('div');
  d.className = cls;
  d.innerHTML = html;
  return d;
};
const at = (e: HTMLElement, x: number, y: number) => {
  e.style.left = `${x}px`;
  e.style.top = `${y}px`;
};
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
/** The rows' zones, as the engine places cards. */
const ROWS: readonly Where[] = ['cloth', 'kit', 'road', 'plank', 'cimitir'];
const onRows = (at: Where) => typeof at === 'string' && ROWS.includes(at);
const resting = (c: Card, day: number) => c.kind === 'lucru' && c.rests_until >= day;
/** Dor stack by sender and stub; the resting things one pile (R91); everything else its own stack. */
const keyOf = (c: Card, day: number) =>
  c.kind === 'dor' && c.at === 'cloth' ? `dor:${c.from}:${c.left}` : c.at === 'kit' && resting(c, day) ? 'rest' : `c${c.id}`;
const REDUCED = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

/** Spaima's tell on a place (R69): the dog at the yard's gate, garlic on the house's window, the Hunter's horse at the village. */
function tellOf(loc: Loc, spaima: number): Tell | null {
  switch (loc) {
    case 'curte': return spaima >= TUNING.tell_dog_spaima ? 'dog' : null;
    case 'casa': return spaima >= TUNING.tell_garlic_spaima ? 'garlic' : null;
    case 'sat': return spaima >= TUNING.tell_horse_spaima ? 'horse' : null;
    default: return null;
  }
}

/** The one tell a host carries (`.tell[data-tell]`), added, replaced or removed, so the DOM holds only the tells that stand. */
function setTell(host: HTMLElement, tell: Tell | null): void {
  const cur = host.querySelector<HTMLElement>(':scope > .tell');
  if ((cur?.dataset.tell ?? null) === tell) return;
  cur?.remove();
  if (tell === null) return;
  const t = el('tell', tellSVG(tell));
  t.dataset.tell = tell;
  host.append(t);
}

/** The memorial days the demo reaches: the soroace inside its days (the fortieth is M1's). */
export const sorocDays = (v: View): number[] => v.config.soroace.filter((d) => d <= v.config.zile);
/** A soroc's dish as the engine's stats have it: held (the house made the meal), missed, or still waiting. */
export function sorocState(v: View, d: number): SorocState {
  if (v.stats.soroace.includes(d)) return 'held';
  if (v.stats.missed.includes(d)) return 'missed';
  return 'waiting';
}

/** The order of the rows (charter section 3): sources, then the living; the things, the resting pile, then the road. */
function rank(g: Group): number {
  if (g.key === 'rest') return 50_000;
  const c = g.cards[0];
  switch (c.kind) {
    case 'dor':
      return SOURCES.indexOf(c.from) * 10 + c.left;
    case 'frantura':
      return 100 + c.id;
    case 'semn':
      return 10_000 + c.id;
    case 'om':
      return 20_000 + OAMENI.indexOf(c.om);
    case 'lucru':
      return LUCRURI.indexOf(c.lucru) * 1000 + c.id;
    case 'loc':
      return 100_000 + LOCURI.indexOf(c.loc);
    default:
      return 0;
  }
}

export class Table {
  private readonly stacks = new Map<string, HTMLElement>();
  private readonly niches = new Map<Verb, NicheView>();
  private readonly layer: HTMLElement;
  private readonly pool: HTMLElement;
  private readonly candle: HTMLElement;
  private readonly putere: HTMLElement;
  private readonly tally: HTMLElement;
  private readonly bands: HTMLElement[] = [];
  private readonly forecast: HTMLElement;
  private readonly sill: HTMLElement[] = [];
  private readonly dayTag: HTMLElement;
  private readonly door: HTMLElement;
  private readonly dusk: HTMLElement;
  private readonly soroace: HTMLElement;
  /** The flame's tap target (44 CSS px or more at the phone's scale). */
  readonly flame: HTMLElement;
  private candleSig = '';
  private tallySig = '';
  private soroaceSig = '';

  constructor(stage: HTMLElement) {
    stage.innerHTML = '';
    stage.append(el('wall'));
    const far = el('farside');
    for (let i = 0; i < 4; i++) far.append(el('back', cardBackSVG(`far${i}`)));
    stage.append(far);
    stage.append(el('farcandle', candleSVG(0.6, { out: true })));
    // the soroc dishes: the living set the memorial meal on their side of the table (step 4); one tap target
    this.soroace = el('soroace');
    this.soroace.dataset.tap = 'soroace';
    this.soroace.setAttribute('role', 'button');
    this.soroace.tabIndex = 0;
    at(this.soroace, SOROACE.x, SOROACE.y);
    this.soroace.style.height = `${SOROACE.h}px`;
    stage.append(this.soroace);

    const cloth = el(
      'cloth',
      `<div class="linen"></div><svg class="border" viewBox="0 0 1132 326" preserveAspectRatio="none" aria-hidden="true"><defs>${M.brad('clothbrad', C.clot)}</defs><rect x="0" y="0" width="1132" height="9" fill="url(#clothbrad)"/><rect x="0" y="317" width="1132" height="9" fill="url(#clothbrad)"/></svg>`,
    );
    stage.append(cloth);
    const plank = el('plank', plankSVG());
    at(plank, PLANK.x, PLANK.y);
    plank.style.width = `${PLANK.w}px`;
    plank.style.height = `${PLANK.h}px`;
    stage.append(plank);

    NICHES.forEach((n, i) => {
      const v = el('verb');
      v.dataset.niche = n.id;
      v.tabIndex = 0;
      v.setAttribute('role', 'button');
      v.setAttribute('aria-label', LABELS[n.id].ro);
      v.innerHTML = nicheSVG(n.id, n.opts);
      if (n.id === 'odihneste') v.dataset.tap = 'troita';
      // the priest's cords (step 4) ride in the niche, hidden until it is locked
      v.append(el('cord', cordSVG()), el('vname', LABELS[n.id].ro));
      at(v, nicheX(i), NICHE.top);
      v.style.width = `${NICHE.w}px`;
      v.style.height = `${NICHE.h}px`;
      stage.append(v);
      // the open commit's cards ride in the card layer, above the vignette, as in the prototype
      const heart = el('heart');
      const side = el('side');
      at(heart, nicheX(i) + SEAT.x, NICHE.top + SEAT.y);
      at(side, nicheX(i) + SIDE.x, NICHE.top + SIDE.y);
      heart.dataset.niche = side.dataset.niche = n.id;
      this.niches.set(n.id, { el: v, heart, side, sig: '' });
    });
    this.door = el('darkdoor', `${darkDoorSVG()}<div class="bridefig">${brideSVG()}</div>`);
    this.door.dataset.tap = 'door';
    // TRECI: the door's verb, shown while she stands in it; focusable for the keyboard path (Enter puts your card down)
    this.door.append(el('vname', TRECI.ro));
    this.door.setAttribute('role', 'button');
    this.door.setAttribute('aria-label', TRECI.ro);
    this.door.tabIndex = 0;
    at(this.door, DOOR_X, NICHE.top);
    stage.append(this.door);

    const still = el('stilllife', stillLifeSVG());
    at(still, STILL_LIFE.x, STILL_LIFE.y);
    still.style.width = `${STILL_LIFE.w}px`;
    still.style.height = `${STILL_LIFE.h}px`;
    stage.append(still);
    // the candle, its label and the drops are placed from layout.ts, the one source the flame's maths reads
    this.candle = el('maincandle');
    this.candle.setAttribute('role', 'img');
    this.candle.setAttribute('aria-label', STINGE.ro);
    at(this.candle, CANDLE.x, CANDLE.y);
    this.candle.style.width = `${CANDLE.w}px`;
    this.candle.style.height = `${CANDLE.h}px`;
    // the boot (step 5): the candle is lit at your head and settles into its place by the cloth's edge
    this.candle.style.setProperty('--boot-dx', `${YOU_AT.x + 30 - CANDLE.x}px`);
    this.candle.style.setProperty('--boot-dy', `${YOU_AT.y - 6 - CANDLE.y}px`);
    const label = el('candle-label', STINGE.ro);
    at(label, CANDLE_LABEL.x, CANDLE_LABEL.y);
    label.style.width = `${CANDLE_LABEL.w}px`;
    this.putere = el('putere');
    at(this.putere, PUTERE.x, PUTERE.y);
    this.putere.style.width = `${PUTERE.w}px`;
    this.putere.style.height = `${PUTERE.h}px`;
    stage.append(this.candle, label, this.putere);

    this.pool = el('pool');
    stage.append(this.pool, el('vignette'));
    this.dusk = el('dusk');
    // the dusk and the pool dim together, on one knob (R67)
    this.dusk.style.transitionDuration = `${TUNING.dusk_fade_ms}ms`;
    this.pool.style.transitionDuration = `${TUNING.dusk_fade_ms}ms`;
    this.dayTag = el('daytag');
    this.dayTag.dataset.tap = 'page';
    this.dayTag.setAttribute('role', 'button');
    this.dayTag.tabIndex = 0;
    stage.append(this.dayTag);

    // the tally: five bands under your card, one tap target
    this.tally = el('tally');
    this.tally.dataset.tap = 'tally';
    this.tally.setAttribute('role', 'button');
    this.tally.tabIndex = 0;
    at(this.tally, TALLY.x, TALLY.y);
    this.tally.style.width = `${TALLY.w}px`;
    this.tally.style.height = `${TALLY.gap * SOURCES.length}px`;
    SOURCES.forEach((om, i) => {
      const band = el('tally-band');
      band.dataset.om = om;
      band.style.top = `${i * TALLY.gap}px`;
      band.style.height = `${TALLY.h}px`;
      this.tally.append(band);
      this.bands.push(band);
    });
    this.forecast = el('forecast');
    at(this.forecast, FORECAST.x, FORECAST.y);
    this.forecast.style.width = `${FORECAST.w}px`;
    this.forecast.style.height = `${FORECAST.h}px`;
    stage.append(this.tally, this.forecast);

    this.layer = el('cards');
    for (const v of this.niches.values()) this.layer.append(v.heart, v.side);
    for (let i = 0; i < 3; i++) {
      const t = el('tied');
      at(t, nicheX(0) + SILL.x + i * (SILL.w + SILL.gap), NICHE.top + SILL.y);
      this.sill.push(t);
      this.layer.append(t);
    }
    this.flame = el('flame-hit');
    this.flame.setAttribute('role', 'button');
    this.flame.setAttribute('aria-label', STINGE.ro);
    this.flame.tabIndex = 0;
    this.flame.style.width = `${FLAME_HIT}px`;
    this.flame.style.height = `${FLAME_HIT}px`;
    // the boot's darkness (step 5), over everything but the troita's small pool
    const t = { x: nicheX(0) + NICHE.w / 2, y: NICHE.top + 118 };
    const night = el('night');
    night.style.background = `radial-gradient(circle at ${t.x}px ${t.y}px, transparent 0, transparent var(--hole, 0px), rgba(17,14,11,.97) calc(var(--hole, 0px) + 90px))`;
    // dusk darkens the whole table, the cards too (R67); the flame's hit area and the strip stay above it
    stage.append(this.layer, this.dusk, this.flame, night);
  }

  render(v: View): void {
    this.renderStacks(v);
    for (const n of NICHES) this.renderNiche(n.id, v);
    this.renderSill(v);
    this.renderTally(v);
    const now = String(v.uitare);
    this.forecast.innerHTML = `<span class="lbl">${PREVESTIRE.ro}</span><span class="n">${[now, ...v.forecast].join(' · ')}</span>`;
    this.dayTag.textContent = DAYS[Math.min(v.day, DAYS.length) - 1].ro;
    this.putere.innerHTML = pipsSVG(v.putere, v.config.putere);
    this.door.classList.toggle('bride', v.phase === 'door' || v.ending === 'nunta');
    this.door.classList.toggle('treci', v.phase === 'door');
    this.renderSoroace(v);
    this.dusk.classList.toggle('on', v.night);
    this.renderCandle(v, v.clock.paused_at ?? Date.now());
  }

  /**
   * The candle in time (R67): its height is the time left to dusk, re-rendered on every tick; out
   * through the night and all day when the house did not light it. The pool follows it.
   */
  renderCandle(v: View, now: number): void {
    const lit = v.candle && !v.night && v.phase !== 'boot';
    const span = Math.max(1, v.config.zi_ms - v.config.zi_noapte_ms);
    const t = v.clock.paused_at ?? now;
    const frac = lit ? clamp((v.clock.dusk_at - t) / span, 0, 1) : 0;
    // a step of half a wax unit: the SVG is rebuilt only when the height would differ
    const q = Math.round(frac * 120) / 120;
    const sig = `${lit}:${q}`;
    if (sig === this.candleSig) return;
    this.candleSig = sig;
    // the flame keeps its breath across the rebuild: the animation resumes at the same phase
    this.candle.style.setProperty('--phase', `-${((Date.now() / 1000) % 1.3).toFixed(3)}s`);
    this.candle.innerHTML = candleSVG(q, { out: !lit });
    this.candle.classList.toggle('out', !lit);
    const f = flameAt(q);
    at(this.flame, f.x - FLAME_HIT / 2, f.y - FLAME_HIT / 2);
    const p = Math.max(0.4, q);
    const r = (n: number) => Math.round(n * p);
    this.pool.style.background = `radial-gradient(circle at ${f.x}px ${f.y}px, rgba(233,220,181,.16) 0, rgba(233,220,181,.07) ${r(110)}px, rgba(233,220,181,.025) ${r(220)}px, transparent ${r(420)}px)`;
    this.pool.style.opacity = lit ? '1' : '0.15';
  }

  /** The pre-cue made visible: the candle's flame gutters once before the day closes (R47). */
  gutter(ms: number): void {
    this.candle.classList.add('gutter');
    window.setTimeout(() => this.candle.classList.remove('gutter'), ms);
  }

  /**
   * The drop target under a point of the reference frame: a card on the rows (the topmost where a
   * spread hand overlaps, never the one being carried), the troita niche as the sill, the five
   * verbs, the dark door. The flame's hit area is never one. The engine decides whether a drop fits.
   */
  targetAt(x: number, y: number): Target | null {
    const inside = (bx: number, by: number, w: number, h: number) => x >= bx && x <= bx + w && y >= by && y <= by + h;
    let hit: { id: number; z: number } | null = null;
    for (const stack of this.stacks.values()) {
      if (stack.classList.contains('lifted')) continue;
      const sx = Number(stack.dataset.x);
      const sy = Number(stack.dataset.y);
      if (!inside(sx, sy, CARD.w, CARD.h)) continue;
      const z = Number(stack.style.zIndex) || 0;
      const id = Number((stack.dataset.ids ?? '').split(' ')[0]);
      if (Number.isFinite(id) && (!hit || z > hit.z)) hit = { id, z };
    }
    if (hit) return { card: hit.id };
    for (let i = 0; i < NICHES.length; i++) {
      if (inside(nicheX(i), NICHE.top, NICHE.w, NICHE.h)) return i === 0 ? 'sill' : { niche: NICHES[i].id };
    }
    if (inside(DOOR_X, NICHE.top, DOOR_W, NICHE.h)) return 'door';
    return null;
  }

  /** The element that answers for a target by contour weight while a card hovers over it. */
  targetEl(t: Target): HTMLElement | null {
    if (t === 'sill') return this.niches.get('odihneste')!.el;
    if (t === 'door') return this.door;
    if ('niche' in t) return this.niches.get(t.niche)!.el;
    return this.stackOf(t.card);
  }

  /** The stack on the rows, or the sill slot, that holds this card. */
  stackOf(id: number): HTMLElement | null {
    const holds = (e: HTMLElement) => (e.dataset.ids ?? '').split(' ').includes(String(id));
    for (const stack of this.stacks.values()) if (holds(stack)) return stack;
    return this.sill.find(holds) ?? null;
  }

  /** The side seat of the verb at work: where the open commit's target sits. */
  seatOf(verb: Verb): HTMLElement {
    return this.niches.get(verb)!.side;
  }

  private renderStacks(v: View): void {
    const groups = new Map<string, Group>();
    for (const c of v.cards) {
      if (!onRows(c.at)) continue;
      // TRECI taken: your card went through the door with her; the engine leaves it at the grave, the plank shows it gone
      if (c.kind === 'cel_nenuntit' && v.phase === 'ended' && v.ending === 'nunta') continue;
      const key = keyOf(c, v.day);
      const g = groups.get(key) ?? { key, cards: [] };
      g.cards.push(c);
      groups.set(key, g);
    }
    const pos = new Map<string, { x: number; y: number }>();
    // a spread hand paints left to right: the i-th card of a row lies over the ones before it (R88)
    const z = new Map<string, number>();
    const inRow = (where: Where[]) =>
      [...groups.values()].filter((g) => where.includes(g.cards[0].at)).sort((a, b) => rank(a) - rank(b));
    for (const g of groups.values()) {
      if (g.cards[0].kind === 'cel_nenuntit') {
        pos.set(g.key, YOU_AT);
        z.set(g.key, 0);
      }
    }
    const cloth = inRow(['cloth']);
    rowSlots(ROW_CLOTH, cloth.length).forEach((x, i) => {
      pos.set(cloth[i].key, { x, y: ROW_CLOTH.y });
      z.set(cloth[i].key, 1 + i);
    });
    const kit = inRow(['kit', 'road']);
    rowSlots(ROW_KIT, kit.length).forEach((x, i) => {
      pos.set(kit[i].key, { x, y: ROW_KIT.y });
      z.set(kit[i].key, 1 + i);
    });
    for (const g of groups.values()) {
      const p = pos.get(g.key);
      if (!p) continue;
      const stack = this.stacks.get(g.key) ?? this.addStack(g);
      this.updateStack(stack, g, p, v, z.get(g.key) ?? 0);
    }
    for (const [key, stack] of this.stacks) {
      if (!groups.has(key)) {
        stack.remove();
        this.stacks.delete(key);
      }
    }
  }

  private addStack(g: Group): HTMLElement {
    const c = g.cards[0];
    const stack = el('stack');
    stack.dataset.key = g.key;
    stack.setAttribute('role', 'button');
    stack.tabIndex = 0;
    stack.dataset.tap = 'card';
    stack.innerHTML = `<div class="under u2"></div><div class="under u1"></div><div class="face"></div><div class="count"></div>`;
    if (c.kind === 'cel_nenuntit') stack.classList.add('you');
    this.layer.append(stack);
    this.stacks.set(g.key, stack);
    return stack;
  }

  private updateStack(stack: HTMLElement, g: Group, p: { x: number; y: number }, v: View, z: number): void {
    const c = g.cards[0];
    const n = g.cards.length;
    stack.classList.remove('gone');
    this.settle(stack, p);
    stack.style.zIndex = String(z);
    stack.classList.toggle('n2', n === 2);
    stack.classList.toggle('n3', n >= 3);
    stack.querySelector('.count')!.textContent = n > 1 ? `×${n}` : '';
    const d = stack.dataset;
    d.ids = g.cards.map((x) => x.id).join(' ');
    d.kind = c.kind === 'cel_nenuntit' ? 'you' : c.kind;
    d.at = typeof c.at === 'string' ? c.at : c.at.niche;
    if (c.kind === 'dor' || c.kind === 'semn' || c.kind === 'loc') d.fel = c.fel;
    else if (c.kind === 'lucru' || c.kind === 'om') d.fel = c.fel.join(' ');
    else delete d.fel;
    if (c.kind === 'dor') d.from = c.from;
    else delete d.from;
    if (c.kind === 'lucru') d.lucru = c.lucru;
    else delete d.lucru;
    if (c.kind === 'om') d.om = c.om;
    else delete d.om;
    if (c.kind === 'loc') d.loc = c.loc;
    else delete d.loc;
    d.resting = resting(c, v.day) ? '1' : '0';
    // the sleepers are the sources; Rada keens and takes no Dor by night (R51, R86)
    d.asleep = c.kind === 'om' && v.night && c.fel.length > 0 ? '1' : '0';
    // nothing is carried while a play is open (the paper covers the table; the engine answers busy anyway);
    // in her door, and after an ending, only your card can be carried (the door takes it: TRECI)
    const draggable = !v.commit && (v.phase === 'wake' ? c.kind === 'dor' || c.kind === 'loc' || c.kind === 'om' : c.kind === 'cel_nenuntit' && v.phase === 'door');
    if (draggable) d.drag = 'table';
    else delete d.drag;
    // the face is rebuilt only when what it shows changes (its kind, its stub, your Uitare)
    const sig = c.kind === 'cel_nenuntit' ? `you:${c.at}:${v.uitare}` : c.kind === 'dor' ? `dor:${c.fel}:${c.from}:${c.left}` : `${c.kind}:${c.id}`;
    if (d.face !== sig) {
      d.face = sig;
      stack.querySelector('.face')!.innerHTML = faceSVG(`s-${g.key.replace(/[^a-z0-9]/g, '-')}`, c, v.uitare) + (c.kind === 'dor' ? `<div class="grains">${grainRowSVG(c.left, v.config.dor_zile, C.soot)}</div>` : '');
    }
    // Spaima's tell rides over a place's face, after the face so a rebuild never drops it
    setTell(stack.querySelector<HTMLElement>('.face')!, c.kind === 'loc' ? tellOf(c.loc, v.spaima) : null);
    const sh = shadowFor(p.x, p.y);
    stack.style.setProperty('--sx', `${sh.sx.toFixed(2)}px`);
    stack.style.setProperty('--sy', `${sh.sy.toFixed(2)}px`);
    stack.style.filter = `brightness(${sh.warm.toFixed(3)})`;
  }

  /** A moving card settles one pixel short, then takes the last pixel (R43): no spring, no bounce. */
  private settle(stack: HTMLElement, p: { x: number; y: number }): void {
    const x0 = Number(stack.dataset.x ?? p.x);
    const y0 = Number(stack.dataset.y ?? p.y);
    stack.dataset.x = String(p.x);
    stack.dataset.y = String(p.y);
    const exact = `translate(${p.x}px, ${p.y}px)`;
    window.clearTimeout(Number(stack.dataset.settle ?? 0));
    if ((x0 === p.x && y0 === p.y) || REDUCED) {
      stack.style.transform = exact;
      return;
    }
    stack.style.transform = `translate(${p.x - Math.sign(p.x - x0)}px, ${p.y - Math.sign(p.y - y0)}px)`;
    const timer = window.setTimeout(() => {
      if (stack.classList.contains('lifted')) return;
      stack.classList.add('settle');
      stack.style.transform = exact;
      window.setTimeout(() => stack.classList.remove('settle'), 20);
    }, TUNING.settle_ms);
    stack.dataset.settle = String(timer);
  }

  /** The open commit: its Dor in the verb's heart seat, the target in the side seat, the niche working; the priest's cords while his service runs (R69). */
  private renderNiche(id: Verb, v: View): void {
    const n = this.niches.get(id)!;
    n.el.classList.toggle('locked', (id === 'urneste' || id === 'arata') && v.day <= v.preot_until);
    // garlic on ARATA-TE's lintel before any commit (R69): the one tell on the screen of verbs
    if (id === 'arata') setTell(n.el, v.spaima >= TUNING.tell_lintel_spaima ? 'lintel' : null);
    const open = v.commit?.verb === id ? v.commit : null;
    const dor = open ? v.cards.find((c) => c.id === open.dor) : undefined;
    const on = open ? v.cards.find((c) => c.id === open.on) : undefined;
    const sig = `${dor?.id ?? ''}:${on?.id ?? ''}:${v.uitare}`;
    if (sig === n.sig) return;
    n.sig = sig;
    n.heart.innerHTML = dor ? faceSVG(`n-${id}-h`, dor, v.uitare) : '';
    n.side.innerHTML = on ? `<div class="face">${faceSVG(`n-${id}-s`, on, v.uitare)}</div>` : '';
    for (const [part, card] of [[n.heart, dor], [n.side, on]] as const) {
      part.dataset.ids = card ? String(card.id) : '';
      part.dataset.kind = card?.kind ?? '';
      if (card) part.dataset.tap = 'card';
      else delete part.dataset.tap;
    }
    n.el.classList.toggle('working', Boolean(open));
  }

  private renderSill(v: View): void {
    const tied = v.cards.filter((c) => c.at === 'sill').sort((a, b) => a.id - b.id);
    this.sill.forEach((slot, i) => {
      const c = tied[i];
      const sig = c ? `${c.id}:${c.kind === 'dor' ? c.left : ''}:${v.commit ? 'busy' : ''}` : '';
      if (slot.dataset.sig === sig) return;
      slot.dataset.sig = sig;
      slot.innerHTML = c ? faceSVG(`tied-${i}`, c, v.uitare) : '';
      slot.dataset.ids = c ? String(c.id) : '';
      slot.dataset.kind = c?.kind ?? '';
      slot.classList.remove('gone');
      if (c) {
        if (v.commit) delete slot.dataset.drag;
        else slot.dataset.drag = 'sill';
        slot.dataset.tap = 'card';
      } else {
        delete slot.dataset.drag;
        delete slot.dataset.tap;
      }
    });
  }

  /** One dish per soroc the demo reaches, as the engine's stats say: waiting, held (the coliva with its cross) or missed (dark). */
  private renderSoroace(v: View): void {
    const days = sorocDays(v);
    const sig = JSON.stringify([days, v.stats.soroace, v.stats.missed]);
    if (sig === this.soroaceSig) return;
    this.soroaceSig = sig;
    const pitch = SOROACE.w + SOROACE.gap;
    this.soroace.style.width = `${Math.max(0, days.length * pitch - SOROACE.gap)}px`;
    this.soroace.innerHTML = days
      .map((d, i) => {
        const state = sorocState(v, d);
        return `<div class="soroc" data-soroc="${d}" data-state="${state}" style="left:${i * pitch}px;width:${SOROACE.w}px;height:${SOROACE.h}px">${sorocSVG(state)}</div>`;
      })
      .join('');
  }

  /** The five tally bands: each person's hem, its ink by their standing, a mark per Amintire. */
  private renderTally(v: View): void {
    const sig = JSON.stringify([v.amintiri, v.standing_m, v.config.standing_cap_m]);
    if (sig === this.tallySig) return;
    this.tallySig = sig;
    SOURCES.forEach((om, i) => {
      this.bands[i].innerHTML = tallyBandSVG(hemOfPerson(v.cards, om), v.amintiri[i] ?? [], v.standing_m[i] ?? 0, v.config.standing_cap_m);
    });
  }
}

