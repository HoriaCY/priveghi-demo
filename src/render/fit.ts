// The reference frame scaled by one unit: min(width/1280, height/720) of the visible viewport inside
// the safe-area insets, centred (brief §4). Portrait shows the quiet rotate card instead.
import { STAGE } from './layout';

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

export function fitStage(stage: HTMLElement, rotate: HTMLElement): number {
  const w = window.visualViewport?.width ?? window.innerWidth;
  const h = window.visualViewport?.height ?? window.innerHeight;
  const portrait = h > w;
  rotate.hidden = !portrait;
  stage.style.visibility = portrait ? 'hidden' : 'visible';
  const i = insets();
  const aw = w - i.l - i.r;
  const ah = h - i.t - i.b;
  const k = Math.min(aw / STAGE.w, ah / STAGE.h);
  const x = i.l + (aw - STAGE.w * k) / 2;
  const y = i.t + (ah - STAGE.h * k) / 2;
  stage.style.transform = `translate(${x}px, ${y}px) scale(${k})`;
  document.documentElement.style.setProperty('--k', String(k));
  return k;
}
