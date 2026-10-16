// Hands at the table. Step 2: taps only. A press that does not move is a tap; a hold of
// long_press_ms or more is a long tap (the page). Tap the flame: STINGE (a no-op until step 3).
// The drags of charter section 4 (a Dor onto a card, a place into BANTUIE, a person into ASCULTA,
// a Dor onto the sill, your card onto the door) come in step 3; the Hands shape already holds them.
// The renderer never decides a rule: step 3's probe asks the engine before a target answers.
import { STAGE } from '../render/layout';
import type { Table, Target } from '../render/table';
import { TUNING } from '../tuning';

export interface Hands {
  /** Would the engine take these cards on this target (a niche answers by contour weight only then)? */
  probe(ids: number[], target: Target): boolean;
  place(ids: number[], target: Target): boolean;
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
  x0: number;
  y0: number;
  moved: boolean;
  t0: number;
}

export function attachInput(stage: HTMLElement, table: Table, hands: Hands): void {
  let press: Press | null = null;

  const toStage = (e: PointerEvent) => {
    const r = stage.getBoundingClientRect();
    const k = r.width / STAGE.w;
    return { x: (e.clientX - r.left) / k, y: (e.clientY - r.top) / k, k };
  };

  stage.addEventListener('pointerdown', (e) => {
    const hit = e.target as Element;
    const el = hit.closest<HTMLElement>('[data-tap]') ?? hit.closest<HTMLElement>('[data-drag]');
    if (!el) {
      hands.clear();
      return;
    }
    if (press) return;
    e.preventDefault();
    el.setPointerCapture(e.pointerId);
    const p = toStage(e);
    press = { el, x0: p.x, y0: p.y, moved: false, t0: performance.now() };
  });

  stage.addEventListener('pointermove', (e) => {
    if (!press || press.moved) return;
    const p = toStage(e);
    if (Math.hypot(p.x - press.x0, p.y - press.y0) * p.k >= TUNING.drag_slop_px) press.moved = true;
  });

  const release = () => {
    if (!press) return;
    const p = press;
    press = null;
    if (!p.moved) hands.tap(p.el, performance.now() - p.t0 >= TUNING.long_press_ms);
  };
  stage.addEventListener('pointerup', release);
  stage.addEventListener('pointercancel', release);

  table.flame.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    hands.tapFlame();
  });

  // the keyboard path: Enter or Space on a card, a niche, the tally or the day tag is a tap
  stage.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') return hands.clear();
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const el = e.target as HTMLElement;
    if (el === table.flame) {
      e.preventDefault();
      return hands.tapFlame();
    }
    const target = el.closest<HTMLElement>('[data-tap]');
    if (!target) return;
    e.preventDefault();
    hands.tap(target, false);
  });
}
