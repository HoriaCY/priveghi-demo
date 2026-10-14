// One reference frame scaled by one unit (brief §2.2, §4). Phones: the table alone, scaled by
// min(width/1280, height/720), the page an overlay over its right side. From 1024 CSS px wide: the
// table and the page together, the page beside the table or below it, whichever lets the table be
// larger (RULINGS R37). Portrait shows the quiet rotate card instead.
import { STAGE } from './layout';

export type Composition = 'phone' | 'side' | 'below';

/** The page's size in reference pixels: a column beside the table, or a band below it. */
export const PAGE = { side: { w: 300, h: 720 }, below: { w: 1280, h: 220 }, phone: { w: 320, h: 720 } };
const DESK_MIN = 1024;

let probe: HTMLElement | null = null;

function insets(): { t: number; r: number; b: number; l: number } {
  if (!probe) {
    probe = document.createElement('div');
    probe.style.cssText =
      'position:fixed;visibility:hidden;pointer-events:none;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)';
    document.body.append(probe);
  }
  const cs = getComputedStyle(probe);
  return { t: parseFloat(cs.paddingTop) || 0, r: parseFloat(cs.paddingRight) || 0, b: parseFloat(cs.paddingBottom) || 0, l: parseFloat(cs.paddingLeft) || 0 };
}

const place = (el: HTMLElement, x: number, y: number, k: number) => {
  el.style.transform = `translate(${x}px, ${y}px) scale(${k})`;
};

export function fitStage(stage: HTMLElement, page: HTMLElement, rotate: HTMLElement): { k: number; composition: Composition } {
  const w = window.visualViewport?.width ?? window.innerWidth;
  const h = window.visualViewport?.height ?? window.innerHeight;
  const portrait = h > w;
  rotate.hidden = !portrait;
  stage.style.visibility = portrait ? 'hidden' : 'visible';
  page.style.visibility = portrait ? 'hidden' : 'visible';
  const i = insets();
  const aw = w - i.l - i.r;
  const ah = h - i.t - i.b;

  let composition: Composition = 'phone';
  let k = Math.min(aw / STAGE.w, ah / STAGE.h);
  let sx = i.l + (aw - STAGE.w * k) / 2;
  let sy = i.t + (ah - STAGE.h * k) / 2;
  let px = sx + (STAGE.w - PAGE.phone.w) * k;
  let py = sy;
  if (aw >= DESK_MIN) {
    const kSide = Math.min(aw / (STAGE.w + PAGE.side.w), ah / STAGE.h);
    const kBelow = Math.min(aw / STAGE.w, ah / (STAGE.h + PAGE.below.h));
    if (kSide >= kBelow) {
      composition = 'side';
      k = kSide;
      sx = i.l + (aw - (STAGE.w + PAGE.side.w) * k) / 2;
      sy = i.t + (ah - STAGE.h * k) / 2;
      px = sx + STAGE.w * k;
      py = sy;
    } else {
      composition = 'below';
      k = kBelow;
      sx = i.l + (aw - STAGE.w * k) / 2;
      sy = i.t + (ah - (STAGE.h + PAGE.below.h) * k) / 2;
      px = sx;
      py = sy + STAGE.h * k;
    }
  }
  place(stage, sx, sy, k);
  const size = PAGE[composition];
  page.style.width = `${size.w}px`;
  page.style.height = `${size.h}px`;
  page.classList.remove('phone', 'side', 'below');
  page.classList.add(composition);
  place(page, px, py, k);
  document.documentElement.style.setProperty('--k', String(k));
  document.body.dataset.composition = composition;
  return { k, composition };
}
