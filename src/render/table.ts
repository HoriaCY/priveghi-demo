// The table as a function of the engine's state. Built once; render(state) moves, adds and
// removes stacks and updates the niches, the candle and the sill. Nothing here decides a rule.
import type { Card, Kind, Niche, Run, State, Target } from '../engine';
import { CANDLE, CARD as NAMES, CUNUNIE, DAYS, NICHE as LABELS } from '../strings';
import { cardBackSVG, cardSVG } from './card';
import { LOOK } from './catalog';
import { candleSVG, cordSVG, darkDoorSVG, dishSVG, grainRowSVG, markSVG, nicheSVG, pipsSVG, plankSVG, stillLifeSVG, type Mark } from './furniture';
import { CANDLE_BOX, DOOR_X, JALE, MARKS, NICHE, ON_PLANK, PLANK, ROW_CLOTH, ROW_KIT, flameAt, nicheX, rowSlots, shadowFor } from './layout';
import { M } from './motifs';
import { TUNING } from '../tuning';
import { C } from './palette';

const NICHES: { id: Niche; mark?: Mark; roof?: boolean; thread?: boolean; icon?: boolean }[] = [
  { id: 'troita', roof: true, thread: true, icon: true },
  { id: 'umbla', mark: 'meandru' },
  { id: 'asculta', mark: 'pom' },
  { id: 'descanta', mark: 'ochi' },
  { id: 'boci', mark: 'spic' },
  { id: 'gazdui', mark: 'sarpe' },
];

/** The card a niche shows as its heart; the rest sit beside it as one small stack. */
const HEART: Partial<Record<Niche, Kind[]>> = { boci: ['rada'], umbla: ['codrii_vlasiei'], gazdui: ['negustor', 'grau'] };

/** Where a niche seats its cards: the heart in the cardseat, the rest in its corner. */
const SEAT = { x: 21, y: 40 };
const SIDE = { x: 83, y: 45 };
/** The troita's sill: three tied threads stand on its ledge. */
const SILL = { x: 30, y: 146, w: 30, h: 42, gap: 4 };

interface Group { key: string; kind: Kind; grains: number; ids: number[] }
interface NicheView { el: HTMLElement; heart: HTMLElement; side: HTMLElement; taper: HTMLElement; sig: string }

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
const keyOf = (c: Card) => (c.kind === 'fir_de_dor' ? `fir_de_dor:${c.grains}` : c.kind);
const uidOf = (key: string) => key.replace(/[^a-z0-9]/g, '-');
const nicheOf = (c: Card): Niche | null => (typeof c.at === 'object' ? c.at.niche : null);
const face = (uid: string, kind: Kind) => cardSVG({ uid, name: NAMES[kind].ro, ...LOOK[kind] });
const REDUCED = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

export class Table {
  private readonly stacks = new Map<string, HTMLElement>();
  private readonly niches = new Map<Niche, NicheView>();
  private readonly layer: HTMLElement;
  private readonly pool: HTMLElement;
  private readonly candle: HTMLElement;
  private readonly dish: HTMLElement;
  private readonly pips: HTMLElement;
  private readonly sill: HTMLElement[] = [];
  private readonly dayTag: HTMLElement;
  private readonly wreath: HTMLElement;
  private readonly marks: HTMLElement;
  /** The flame's tap target (44 CSS px or more at the phone's scale). */
  readonly flame: HTMLElement;
  private candleSig = '';

  constructor(stage: HTMLElement) {
    stage.innerHTML = '';
    stage.append(el('wall'));
    const far = el('farside');
    for (let i = 0; i < 4; i++) far.append(el('back', cardBackSVG(`far${i}`)));
    stage.append(far);
    stage.append(el('farcandle', candleSVG(0.6, { out: true })));

    const cloth = el(
      'cloth',
      `<div class="linen"></div><svg class="border" viewBox="0 0 1132 326" preserveAspectRatio="none" aria-hidden="true"><defs>${M.brad('clothbrad', C.clot)}</defs><rect x="0" y="0" width="1132" height="9" fill="url(#clothbrad)"/><rect x="0" y="317" width="1132" height="9" fill="url(#clothbrad)"/></svg>`,
    );
    stage.append(cloth);
    const plank = el('plank', plankSVG());
    at(plank, PLANK.x, PLANK.y);
    this.marks = el('marks');
    at(this.marks, MARKS.x, MARKS.y);
    stage.append(plank, this.marks);

    NICHES.forEach((n, i) => {
      const v = el('verb');
      v.dataset.niche = n.id;
      v.tabIndex = 0;
      v.setAttribute('role', 'button');
      v.setAttribute('aria-label', LABELS[n.id].ro);
      v.innerHTML = nicheSVG(n.id, n);
      if (n.id === 'troita') v.dataset.tap = 'troita';
      const taper = el('taper');
      // no English on the table: the gloss waits for localisation (ruled 2026-10-13)
      v.append(taper, el('cord', cordSVG()), el('vname', LABELS[n.id].ro));
      at(v, nicheX(i), NICHE.top);
      stage.append(v);
      // the cards a niche holds ride in the card layer, above the vignette, as in the prototype
      const heart = el('heart');
      const side = el('side');
      at(heart, nicheX(i) + SEAT.x, NICHE.top + SEAT.y);
      at(side, nicheX(i) + SIDE.x, NICHE.top + SIDE.y);
      heart.dataset.niche = side.dataset.niche = n.id;
      this.niches.set(n.id, { el: v, heart, side, taper, sig: '' });
    });
    const door = el('darkdoor', darkDoorSVG());
    door.dataset.tap = 'door';
    at(door, DOOR_X, NICHE.top);
    stage.append(door);

    stage.append(el('stilllife', stillLifeSVG()));
    this.candle = el('maincandle');
    this.candle.setAttribute('role', 'img');
    this.candle.setAttribute('aria-label', CANDLE.ro);
    this.dish = el('dish', dishSVG());
    this.dish.tabIndex = 0;
    this.dish.setAttribute('role', 'button');
    this.dish.setAttribute('aria-label', CANDLE.ro);
    this.pips = el('pips');
    stage.append(this.candle, this.dish, el('candle-label', CANDLE.ro), this.pips);

    this.pool = el('pool');
    stage.append(this.pool, el('vignette'));
    this.dayTag = el('daytag');
    this.dayTag.dataset.tap = 'page';
    this.dayTag.setAttribute('role', 'button');
    stage.append(this.dayTag);

    this.layer = el('cards');
    for (const v of this.niches.values()) this.layer.append(v.heart, v.side);
    for (let i = 0; i < 3; i++) {
      const t = el('tied');
      at(t, nicheX(0) + SILL.x + i * (SILL.w + SILL.gap), NICHE.top + SILL.y);
      this.sill.push(t);
      this.layer.append(t);
    }
    this.wreath = el('wreath', cardSVG({ uid: 'wreath', name: CUNUNIE.ro, art: 'cununie', hem: 'brad', ground: C.lime }));
    this.wreath.hidden = true;
    this.flame = el('flame-hit');
    this.flame.setAttribute('role', 'button');
    this.flame.setAttribute('aria-label', CANDLE.ro);
    this.flame.tabIndex = 0;
    // the boot's darkness, over everything but the troita's small pool; it opens when the candle is lit
    const t = { x: nicheX(0) + NICHE.w / 2, y: NICHE.top + 118 };
    const night = el('night');
    night.style.background = `radial-gradient(circle at ${t.x}px ${t.y}px, transparent 0, transparent var(--hole, 0px), rgba(17,14,11,.97) calc(var(--hole, 0px) + 90px))`;
    stage.append(this.layer, this.wreath, this.flame, night);
  }

  render(s: State): void {
    this.renderStacks(s);
    for (const n of NICHES) {
      const inside = s.cards.filter((c) => nicheOf(c) === n.id);
      this.renderNiche(n.id, inside, s.runs[n.id], s.frant && ['umbla', 'asculta', 'descanta'].includes(n.id));
    }
    this.renderSill(s.cards.filter((c) => c.at === 'sill'));
    this.renderCandle(s);
    this.dayTag.textContent = DAYS[Math.min(s.day, DAYS.length) - 1].ro;
    this.renderMarks(s);
    this.wreath.hidden = !(s.phase === 'ended' && s.ending === 'cununie');
  }

  /** The pre-cue made visible: the candle's flame gutters once before the day closes (Telegraph Law). */
  gutter(ms: number): void {
    this.candle.classList.add('gutter');
    window.setTimeout(() => this.candle.classList.remove('gutter'), ms);
  }

  /** The drop target under a point of the reference frame, if any. The dark door never is one. */
  targetAt(x: number, y: number): Target | null {
    for (let i = 0; i < NICHES.length; i++) {
      const nx = nicheX(i);
      if (x >= nx && x <= nx + NICHE.w && y >= NICHE.top && y <= NICHE.top + NICHE.h) return { niche: NICHES[i].id };
    }
    const b = CANDLE_BOX;
    if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) return 'candle';
    if (x >= PLANK.x && x <= PLANK.x + PLANK.w && y >= PLANK.y && y <= PLANK.y + PLANK.h) return 'nenuntit';
    return null;
  }

  /** The element that answers for a target by contour weight while a card hovers over it. */
  targetEl(t: Target): HTMLElement {
    if (t === 'candle') return this.dish;
    if (t === 'nenuntit') return this.marks;
    return this.niches.get(t.niche)!.el;
  }

  private renderStacks(s: State): void {
    const groups = new Map<string, Group>();
    for (const c of s.cards) {
      if (c.at !== 'table' && c.at !== 'plank') continue;
      const key = keyOf(c);
      const g = groups.get(key) ?? { key, kind: c.kind, grains: c.grains, ids: [] };
      g.ids.push(c.id);
      groups.set(key, g);
    }
    const pos = new Map<string, { x: number; y: number }>();
    for (const g of groups.values()) {
      if (g.kind === 'cel_nenuntit') pos.set(g.key, ON_PLANK);
      if (g.kind === 'jale') pos.set(g.key, JALE);
    }
    for (const row of [ROW_KIT, ROW_CLOTH]) {
      const inRow = [...groups.values()]
        .filter((g) => row.order.includes(g.kind))
        .sort((a, b) => row.order.indexOf(a.kind) - row.order.indexOf(b.kind) || a.grains - b.grains);
      rowSlots(row, inRow.length).forEach((x, i) => pos.set(inRow[i].key, { x, y: row.y }));
    }
    for (const g of groups.values()) {
      const p = pos.get(g.key);
      if (!p) throw new Error(`no place on the table for ${g.key}`);
      const stack = this.stacks.get(g.key) ?? this.addStack(g);
      this.updateStack(stack, g, p);
    }
    for (const [key, stack] of this.stacks) {
      if (!groups.has(key)) {
        stack.remove();
        this.stacks.delete(key);
      }
    }
  }

  private addStack(g: Group): HTMLElement {
    const stack = el('stack');
    stack.dataset.key = g.key;
    stack.dataset.kind = g.kind;
    stack.setAttribute('role', 'button');
    stack.tabIndex = 0;
    stack.dataset.tap = 'card';
    if (g.kind !== 'cel_nenuntit') stack.dataset.drag = 'table';
    stack.innerHTML = `<div class="under u2"></div><div class="under u1"></div><div class="face">${face(`s-${uidOf(g.key)}`, g.kind)}</div><div class="count"></div>`;
    if (g.kind === 'fir_de_dor') stack.querySelector('.face')!.append(el('grains'));
    this.layer.append(stack);
    this.stacks.set(g.key, stack);
    return stack;
  }

  private updateStack(stack: HTMLElement, g: Group, p: { x: number; y: number }): void {
    const n = g.ids.length;
    this.settle(stack, p);
    stack.classList.toggle('n2', n === 2);
    stack.classList.toggle('n3', n >= 3);
    stack.querySelector('.count')!.textContent = n > 1 ? `×${n}` : '';
    stack.dataset.ids = g.ids.join(' ');
    stack.setAttribute('aria-label', n > 1 ? `${NAMES[g.kind].ro}, ${n}` : NAMES[g.kind].ro);
    const grains = stack.querySelector('.grains');
    if (grains) grains.innerHTML = grainRowSVG(g.grains, 3, C.soot);
    const sh = shadowFor(p.x, p.y);
    stack.style.setProperty('--sx', `${sh.sx.toFixed(2)}px`);
    stack.style.setProperty('--sy', `${sh.sy.toFixed(2)}px`);
    stack.style.filter = `brightness(${sh.warm.toFixed(3)})`;
  }

  /** A moving card settles one pixel short, then takes the last pixel (brief §8): no spring, no bounce. */
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

  private renderNiche(id: Niche, inside: Card[], run: Run | undefined, locked: boolean): void {
    const v = this.niches.get(id)!;
    v.el.classList.toggle('locked', locked);
    const sig = JSON.stringify([inside.map((c) => `${c.id}:${c.kind}`), run?.days_left, run?.days]);
    if (sig === v.sig) return;
    v.sig = sig;
    const heartKinds = HEART[id] ?? [];
    const heart = inside.find((c) => heartKinds.includes(c.kind)) ?? inside[0];
    const rest = inside.filter((c) => c !== heart);
    v.heart.innerHTML = heart ? face(`n-${id}-h`, heart.kind) : '';
    v.side.innerHTML = rest.length
      ? `<div class="face">${face(`n-${id}-s`, rest[0].kind)}</div>` + (rest.length > 1 ? `<div class="count">×${rest.length}</div>` : '')
      : '';
    // cards placed today can be taken back; a working niche keeps them sealed
    for (const [part, cards] of [[v.heart, heart ? [heart] : []], [v.side, rest]] as const) {
      part.dataset.ids = cards.map((c) => c.id).join(' ');
      part.dataset.kind = cards[0]?.kind ?? '';
      if (cards.length) part.dataset.tap = 'card';
      else delete part.dataset.tap;
      if (cards.length && !run) part.dataset.drag = 'niche';
      else delete part.dataset.drag;
    }
    v.taper.innerHTML = run ? candleSVG(run.days_left / run.days) : '';
    v.el.classList.toggle('working', Boolean(run));
    v.el.dataset.cards = inside.map((c) => c.id).join(' ');
  }

  /** Cel Nenuntit's days: a dish per soroc, waiting, kept or missed. */
  private renderMarks(s: State): void {
    const sig = JSON.stringify(s.marks);
    if (this.marks.dataset.sig === sig) return;
    this.marks.dataset.sig = sig;
    this.marks.innerHTML = s.config.soroace
      .filter((d) => d <= s.config.zile)
      .map((d) => {
        const m = s.marks.find((x) => x.day === d);
        const state = m ? (m.held ? 'held' : 'missed') : 'waiting';
        return `<div class="mark" data-soroc="${d}" data-state="${state}" style="width:${MARKS.w}px">${markSVG(state)}</div>`;
      })
      .join('');
  }

  private renderSill(tied: Card[]): void {
    this.sill.forEach((slot, i) => {
      const c = tied[i];
      const sig = c ? String(c.id) : '';
      if (slot.dataset.sig === sig) return;
      slot.dataset.sig = sig;
      slot.innerHTML = c ? face(`tied-${i}`, c.kind) : '';
      slot.dataset.ids = sig;
      slot.dataset.kind = c?.kind ?? '';
      if (c) {
        slot.dataset.drag = 'sill';
        slot.dataset.tap = 'card';
      } else {
        delete slot.dataset.drag;
        delete slot.dataset.tap;
      }
    });
  }

  /** Height is wax; the light pool shrinks with it to a floor of 40 %, then darkens a step each dark close. */
  private renderCandle(s: State): void {
    const sig = `${s.wax}/${s.config.kit_wax}/${s.dark}/${s.vigoare}`;
    if (sig === this.candleSig) return;
    this.candleSig = sig;
    const frac = s.wax / s.config.kit_wax;
    this.candle.innerHTML = candleSVG(frac, { out: s.wax === 0 });
    this.candle.classList.toggle('out', s.wax === 0);
    const f = flameAt(frac);
    at(this.flame, f.x - 45, f.y - 45);
    const p = s.wax > 0 ? Math.max(0.4, frac) : Math.max(0.1, 0.4 - 0.1 * s.dark);
    const r = (n: number) => Math.round(n * p);
    this.pool.style.background = `radial-gradient(circle at ${f.x}px ${f.y}px, rgba(233,220,181,.16) 0, rgba(233,220,181,.07) ${r(110)}px, rgba(233,220,181,.025) ${r(220)}px, transparent ${r(420)}px)`;
    this.pips.innerHTML = pipsSVG(s.vigoare, s.config.vigoare);
  }
}

