// The table as a function of the engine's state. Built once; render(state) moves, adds and
// removes stacks and updates the niches. Nothing here decides a rule.
import type { Card, Kind, Niche, Run, State } from '../engine';
import { CANDLE, CARD as NAMES, NICHE as LABELS } from '../strings';
import { cardBackSVG, cardSVG } from './card';
import { LOOK } from './catalog';
import { candleSVG, darkDoorSVG, dishSVG, grainRowSVG, nicheSVG, plankSVG, stillLifeSVG, type Mark } from './furniture';
import { DOOR_X, FLAME, JALE, NICHE, ON_PLANK, PLANK, ROW_CLOTH, ROW_KIT, nicheX, rowSlots, shadowFor } from './layout';
import { M } from './motifs';
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
const HEART: Partial<Record<Niche, Kind[]>> = { boci: ['rada'], umbla: ['codrii_vlasiei'] };

interface Group { key: string; kind: Kind; grains: number; ids: number[] }
interface NicheView { el: HTMLElement; heart: HTMLElement; side: HTMLElement; taper: HTMLElement; sig: string }

/** Where a niche seats its cards: the heart in the cardseat, the rest beside it. */
const SEAT = { x: 21, y: 40 };
const SIDE = { x: 83, y: 45 };

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

export class Table {
  private readonly stacks = new Map<string, HTMLElement>();
  private readonly niches = new Map<Niche, NicheView>();
  private readonly layer: HTMLElement;
  private readonly pool: HTMLElement;

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
    stage.append(plank);

    NICHES.forEach((n, i) => {
      const v = el('verb');
      v.dataset.niche = n.id;
      v.setAttribute('role', 'group');
      v.setAttribute('aria-label', `${LABELS[n.id].ro}, ${LABELS[n.id].gloss}`);
      v.innerHTML = nicheSVG(n.id, n);
      const taper = el('taper');
      v.append(taper, el('vname', `${LABELS[n.id].ro}<small>${LABELS[n.id].gloss}</small>`));
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
    at(door, DOOR_X, NICHE.top);
    stage.append(door);

    stage.append(el('stilllife', stillLifeSVG()));
    const candle = el('maincandle', candleSVG(1));
    candle.setAttribute('role', 'img');
    candle.setAttribute('aria-label', CANDLE.ro);
    stage.append(candle, el('dish', dishSVG()), el('candle-label', CANDLE.ro));

    this.pool = el('pool');
    this.pool.style.background = `radial-gradient(circle at ${FLAME.x}px ${FLAME.y}px, rgba(233,220,181,.16) 0, rgba(233,220,181,.07) 110px, rgba(233,220,181,.025) 220px, transparent 420px)`;
    stage.append(this.pool, el('vignette'));
    this.layer = el('cards');
    for (const v of this.niches.values()) this.layer.append(v.heart, v.side);
    stage.append(this.layer);
  }

  render(s: State): void {
    this.renderStacks(s);
    for (const n of NICHES) {
      this.renderNiche(n.id, s.cards.filter((c) => nicheOf(c) === n.id), s.runs[n.id]);
    }
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
    stack.setAttribute('role', 'img');
    const face = cardSVG({ uid: `s-${uidOf(g.key)}`, name: NAMES[g.kind].ro, ...LOOK[g.kind] });
    stack.innerHTML = `<div class="under u2"></div><div class="under u1"></div><div class="face">${face}</div><div class="count"></div>`;
    if (g.kind === 'fir_de_dor') stack.querySelector('.face')!.append(el('grains'));
    this.layer.append(stack);
    this.stacks.set(g.key, stack);
    return stack;
  }

  private updateStack(stack: HTMLElement, g: Group, p: { x: number; y: number }): void {
    const n = g.ids.length;
    stack.style.transform = `translate(${p.x}px, ${p.y}px)`;
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

  private renderNiche(id: Niche, inside: Card[], run: Run | undefined): void {
    const v = this.niches.get(id)!;
    const sig = JSON.stringify([inside.map((c) => `${c.id}:${c.kind}`), run?.days_left, run?.days]);
    if (sig === v.sig) return;
    v.sig = sig;
    const heartKinds = HEART[id] ?? [];
    const heart = inside.find((c) => heartKinds.includes(c.kind)) ?? inside[0];
    const rest = inside.filter((c) => c !== heart);
    v.heart.innerHTML = heart ? cardSVG({ uid: `n-${id}-h`, name: NAMES[heart.kind].ro, ...LOOK[heart.kind] }) : '';
    v.side.innerHTML = rest.length
      ? `<div class="face">${cardSVG({ uid: `n-${id}-s`, name: NAMES[rest[0].kind].ro, ...LOOK[rest[0].kind] })}</div>` +
        (rest.length > 1 ? `<div class="count">×${rest.length}</div>` : '')
      : '';
    v.taper.innerHTML = run ? candleSVG(run.days_left / run.days) : '';
    v.el.classList.toggle('working', Boolean(run));
    v.el.dataset.cards = inside.map((c) => c.id).join(' ');
  }
}

