// Hands at the table (charter section 4, RULINGS R68). A press that does not move is a tap; a hold
// of long_press_ms or more is a long tap (the page). A press on anything carrying data-drag that
// moves past the slop lifts it: a Dor (from the cloth or the sill) onto a thing, a fragment, a
// person or a place; a place into BANTUIE; a person into ASCULTA; a Dor onto the troita's sill; a
// tied Dor back to the cloth; your card onto the dark door. The renderer never decides a rule: the
// target answers by contour weight only when the engine's probe says yes, and the engine's answer
// to the drop is final; a refused drop returns the card with the lower tick and no words. Tap the
// flame: STINGE. Keyboard: Enter picks a card up, Enter on a target puts it down, Escape drops it.
import type { Verb } from '../engine';
import { STAGE } from '../render/layout';
import type { Table, Target } from '../render/table';
import { TUNING } from '../tuning';

export interface Hands {
  /** Would the engine take this card on this target (a target answers by contour weight only then)? */
  probe(ids: number[], target: Target): boolean;
  /** The drop: the act the target implies. False when the engine refused. */
  place(ids: number[], target: Target): boolean;
  /** A tied Dor let go over the bare cloth: untie. */
  unplace(ids: number[]): boolean;
  tapFlame(): void;
  lifted(): void;
  refused(): void;
  /** A tap (or a hold, `long`) on anything carrying data-tap. */
  tap(el: HTMLElement, long: boolean): void;
  /** Escape, or a press on the bare table: the Dor in hand is put down. */
  clear(): void;
}

interface Press {
  el: HTMLElement;
  /** 'table' or 'sill' for a card that can be carried; 'tap' for anything else. */
  from: string;
  ids: number[];
  x0: number;
  y0: number;
  base: string;
  moved: boolean;
  over: Target | null;
  t0: number;
}

/** A stack carries one card: the top of a Dor stack is its first id. */
const idsOf = (el: HTMLElement) => (el.dataset.ids ?? '').split(' ').filter(Boolean).map(Number).slice(0, 1);
const same = (a: Target | null, b: Target | null) => JSON.stringify(a) === JSON.stringify(b);

/** What an element stands for as a drop target: a stack its card, the troita the sill, a verb its niche, the door. */
function targetOf(el: HTMLElement): Target | null {
  if (el.classList.contains('stack')) {
    const [id] = idsOf(el);
    return id === undefined ? null : { card: id };
  }
  const niche = el.dataset.niche as Verb | undefined;
  if (el.classList.contains('verb') && niche) return niche === 'odihneste' ? 'sill' : { niche };
  if (el.classList.contains('darkdoor')) return 'door';
  return null;
}

export function attachInput(stage: HTMLElement, table: Table, hands: Hands): void {
  let press: Press | null = null;
  let picked: HTMLElement | null = null;

  const toStage = (e: PointerEvent) => {
    const r = stage.getBoundingClientRect();
    const k = r.width / STAGE.w;
    return { x: (e.clientX - r.left) / k, y: (e.clientY - r.top) / k, k };
  };
  /** The target under the carried card answers only when the engine would take the drop. */
  const hover = (t: Target | null) => {
    if (!press || same(t, press.over)) return;
    if (press.over) table.targetEl(press.over)?.classList.remove('accept');
    press.over = t;
    if (t && hands.probe(press.ids, t)) table.targetEl(t)?.classList.add('accept');
  };

  stage.addEventListener('pointerdown', (e) => {
    const hit = e.target as Element;
    const el = hit.closest<HTMLElement>('[data-drag]') ?? hit.closest<HTMLElement>('[data-tap]');
    if (!el) {
      hands.clear();
      return;
    }
    if (press) return;
    e.preventDefault();
    el.setPointerCapture(e.pointerId);
    const p = toStage(e);
    press = { el, from: el.dataset.drag ?? 'tap', ids: idsOf(el), x0: p.x, y0: p.y, base: el.style.transform, moved: false, over: null, t0: performance.now() };
  });

  stage.addEventListener('pointermove', (e) => {
    if (!press) return;
    const p = toStage(e);
    const dx = p.x - press.x0;
    const dy = p.y - press.y0;
    if (!press.moved) {
      if (Math.hypot(dx, dy) * p.k < TUNING.drag_slop_px) return;
      press.moved = true;
      if (press.from === 'tap') return;
      press.el.classList.add('lifted');
      hands.lifted();
    }
    if (press.from === 'tap') return;
    press.el.style.transform = `${press.base} translate(${dx}px, ${dy}px)`;
    hover(table.targetAt(p.x, p.y));
  });

  const release = () => {
    if (!press) return;
    const p = press;
    const over = p.over;
    hover(null);
    press = null;
    if (!p.moved) return hands.tap(p.el, performance.now() - p.t0 >= TUNING.long_press_ms);
    if (p.from === 'tap') return;
    // the card returns on its own transition; the engine's answer, when it takes the drop, redraws it
    p.el.classList.remove('lifted');
    p.el.style.transform = p.base;
    if (over) {
      if (!hands.place(p.ids, over)) hands.refused();
    } else if (p.from === 'sill') {
      if (!hands.unplace(p.ids)) hands.refused();
    }
  };
  stage.addEventListener('pointerup', release);
  stage.addEventListener('pointercancel', release);

  table.flame.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    hands.tapFlame();
  });

  // the keyboard path: Enter picks a card up, Enter on a target puts it down, Escape drops it;
  // Space (or Enter with nothing picked, on what cannot be carried) is a tap
  const unpick = () => {
    picked?.classList.remove('picked');
    picked = null;
  };
  stage.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      unpick();
      return hands.clear();
    }
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const el = e.target as HTMLElement;
    if (el === table.flame) {
      e.preventDefault();
      return hands.tapFlame();
    }
    if (e.key === 'Enter' && picked && picked !== el) {
      const t = targetOf(el);
      if (t && hands.probe(idsOf(picked), t)) {
        e.preventDefault();
        const ids = idsOf(picked);
        unpick();
        if (!hands.place(ids, t)) hands.refused();
        return;
      }
    }
    if (e.key === 'Enter' && el.dataset.drag && !el.isSameNode(picked)) {
      e.preventDefault();
      unpick();
      picked = el;
      el.classList.add('picked');
      hands.lifted();
      hands.tap(el, false);
      return;
    }
    const target = el.closest<HTMLElement>('[data-tap]');
    if (!target) return;
    e.preventDefault();
    hands.tap(target, false);
  });
}
