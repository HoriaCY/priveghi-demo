// Hands at the table. Drag a card or a stack onto a niche or the candle's dish; drag a card a niche
// still holds back onto the cloth; tap the flame to close the day. The renderer never decides a rule:
// it asks the engine (probe) before a niche answers by contour weight, and the engine's answer to the
// drop is final. Keyboard: Enter on a card picks it up, Enter on a niche or the dish puts it down.
import type { Target } from '../engine';
import { STAGE } from '../render/layout';
import type { Table } from '../render/table';
import { TUNING } from '../tuning';

export interface Hands {
  probe(ids: number[], target: Target): boolean;
  place(ids: number[], target: Target): boolean;
  unplace(ids: number[]): boolean;
  tapFlame(): void;
  lifted(): void;
  refused(): void;
}

interface Drag {
  el: HTMLElement;
  ids: number[];
  from: string;
  x0: number;
  y0: number;
  base: string;
  moved: boolean;
  over: Target | null;
}

const idsOf = (el: HTMLElement) => (el.dataset.ids ?? '').split(' ').filter(Boolean).map(Number);
const same = (a: Target | null, b: Target | null) => JSON.stringify(a) === JSON.stringify(b);

export function attachInput(stage: HTMLElement, table: Table, hands: Hands): void {
  let drag: Drag | null = null;
  let picked: HTMLElement | null = null;

  const toStage = (e: PointerEvent) => {
    const r = stage.getBoundingClientRect();
    const k = r.width / STAGE.w;
    return { x: (e.clientX - r.left) / k, y: (e.clientY - r.top) / k, k };
  };
  const hover = (t: Target | null) => {
    if (!drag || same(t, drag.over)) return;
    if (drag.over) table.targetEl(drag.over).classList.remove('accept');
    drag.over = t;
    if (t && hands.probe(drag.ids, t)) table.targetEl(t).classList.add('accept');
  };

  stage.addEventListener('pointerdown', (e) => {
    const el = (e.target as Element).closest<HTMLElement>('[data-drag]');
    if (!el || drag) return;
    e.preventDefault();
    el.setPointerCapture(e.pointerId);
    const p = toStage(e);
    drag = { el, ids: idsOf(el), from: el.dataset.drag ?? 'table', x0: p.x, y0: p.y, base: el.style.transform, moved: false, over: null };
  });

  stage.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const p = toStage(e);
    const dx = p.x - drag.x0;
    const dy = p.y - drag.y0;
    if (!drag.moved) {
      if (Math.hypot(dx, dy) * p.k < TUNING.drag_slop_px) return;
      drag.moved = true;
      drag.el.classList.add('lifted');
      hands.lifted();
    }
    drag.el.style.transform = `${drag.base} translate(${dx}px, ${dy}px)`;
    hover(table.targetAt(p.x, p.y));
  });

  const drop = () => {
    if (!drag) return;
    const d = drag;
    const over = d.over;
    hover(null);
    drag = null;
    d.el.classList.remove('lifted');
    d.el.style.transform = d.base;
    if (!d.moved) return; // a tap: the paper strip with the card's name arrives in step 5
    if (over) {
      if (!hands.place(d.ids, over)) hands.refused();
    } else if (d.from !== 'table') {
      hands.unplace(d.ids);
    }
  };
  stage.addEventListener('pointerup', drop);
  stage.addEventListener('pointercancel', drop);

  table.flame.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    hands.tapFlame();
  });

  const unpick = () => {
    picked?.classList.remove('selected');
    picked = null;
  };
  stage.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') return unpick();
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const el = e.target as HTMLElement;
    e.preventDefault();
    if (el === table.flame) return hands.tapFlame();
    if (el.dataset.drag) {
      unpick();
      picked = el;
      el.classList.add('selected');
      return hands.lifted();
    }
    const target: Target | null = el.dataset.niche ? { niche: el.dataset.niche as never } : el.classList.contains('dish') ? 'candle' : null;
    if (target && picked) {
      if (!hands.place(idsOf(picked), target)) hands.refused();
      unpick();
    }
  });
}
