// The cleared motif rack (motif_sourcebook §8) and the corruption grammar (§6), lifted from
// priveghi_prototype_v4.html. Each returns SVG markup; tiles are small so a band reads as embroidery.
import { C } from './palette';

export const M = {
  romb: (id: string, c: string) =>
    `<pattern id="${id}" width="8" height="8" patternUnits="userSpaceOnUse"><path d="M4 1 L7 4 L4 7 L1 4 Z M7 4 L8 4 M0 4 L1 4" fill="none" stroke="${c}" stroke-width="1.3" stroke-linejoin="miter"/><circle cx="4" cy="4" r=".9" fill="${c}"/></pattern>`,
  funia: (id: string, l: string, d: string) =>
    `<pattern id="${id}" width="6" height="8" patternUnits="userSpaceOnUse"><path d="M0 8 L6 0" stroke="${l}" stroke-width="1.6"/><path d="M3 8 L9 0 M-3 8 L3 0" stroke="${d}" stroke-width="1.6"/></pattern>`,
  brad: (id: string, c: string) =>
    `<pattern id="${id}" width="8" height="8" patternUnits="userSpaceOnUse"><path d="M0 1.5 L4 6.5 L8 1.5" fill="none" stroke="${c}" stroke-width="1.3"/></pattern>`,
  ochi: (id: string, c: string, pupil?: string) =>
    `<pattern id="${id}" width="12" height="8" patternUnits="userSpaceOnUse"><path d="M1 4 Q6 0.3 11 4 Q6 7.7 1 4 Z" fill="none" stroke="${c}" stroke-width="1.1"/><circle cx="6" cy="4" r="1.3" fill="${pupil ?? c}"/></pattern>`,
  colt: (id: string, c: string) =>
    `<pattern id="${id}" width="6" height="6" patternUnits="userSpaceOnUse"><path d="M0 5 L3 1 L6 5" fill="none" stroke="${c}" stroke-width="1"/></pattern>`,
  meandru: (id: string, c: string) =>
    `<pattern id="${id}" width="12" height="8" patternUnits="userSpaceOnUse"><path d="M0 6 L0 2 L4 2 L4 6 L8 6 L8 2 L12 2" fill="none" stroke="${c}" stroke-width="1.1"/></pattern>`,
  sarpe: (id: string, c: string) =>
    `<pattern id="${id}" width="12" height="8" patternUnits="userSpaceOnUse"><path d="M0 4 C3 0.5 5 0.5 6 4 C7 7.5 9 7.5 12 4" fill="none" stroke="${c}" stroke-width="1.2"/></pattern>`,
  spic: (id: string, c: string) =>
    `<pattern id="${id}" width="8" height="10" patternUnits="userSpaceOnUse"><path d="M4 0 V10 M4 3 L1.5 1 M4 3 L6.5 1 M4 7 L1.5 5 M4 7 L6.5 5" fill="none" stroke="${c}" stroke-width="1.1"/></pattern>`,
  cruce: (id: string, c: string) =>
    `<pattern id="${id}" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M5 1.5 V8.5 M1.5 5 H8.5" stroke="${c}" stroke-width="1.3"/></pattern>`,
  stea: (id: string, c: string) =>
    `<pattern id="${id}" width="12" height="12" patternUnits="userSpaceOnUse"><path d="M6 1 L7.2 4.8 L11 6 L7.2 7.2 L6 11 L4.8 7.2 L1 6 L4.8 4.8 Z" fill="none" stroke="${c}" stroke-width="1"/></pattern>`,
  pom: (id: string, c: string) =>
    `<pattern id="${id}" width="10" height="14" patternUnits="userSpaceOnUse"><path d="M5 13 V2 M5 5 L2 3 M5 5 L8 3 M5 8 L2 6 M5 8 L8 6 M5 11 L2.5 9.5 M5 11 L7.5 9.5 M5 2 L4 0.8 M5 2 L6 0.8" fill="none" stroke="${c}" stroke-width="1.1"/></pattern>`,
};

export const band = (pid: string, x: number, y: number, w: number, h: number) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#${pid})"/>`;

/** Six-petal daisy wheel, never a bent-arm whirl; at least 5 px by law. */
export function rosette(cx: number, cy: number, r: number, c: string, fill?: string): string {
  let s = `<g><circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill ?? 'none'}" stroke="${c}" stroke-width="1.1"/>`;
  for (let i = 0; i < 6; i++) {
    s += `<ellipse cx="${cx}" cy="${cy - r * 0.5}" rx="${r * 0.27}" ry="${r * 0.48}" fill="none" stroke="${c}" stroke-width="1" transform="rotate(${i * 60} ${cx} ${cy})"/>`;
  }
  return s + `<circle cx="${cx}" cy="${cy}" r="${Math.max(1, r * 0.12)}" fill="${c}"/></g>`;
}

/** The martisor thread: red travels with white or not at all. */
export function thread(x1: number, y1: number, x2: number, y2: number, w = 2): string {
  return `<g><line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${C.lime}" stroke-width="${w}"/><line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${C.red}" stroke-width="${w}" stroke-dasharray="3 3"/></g>`;
}

/** Ochiul deschis: the eye row goes dark except one; at most one per entity. */
export function ochiulDeschis(x: number, y: number, w: number, c: string): string {
  let s = '<g>';
  const n = Math.floor(w / 12);
  const open = Math.floor(n * 0.7);
  for (let i = 0; i < n; i++) {
    const ox = x + i * 12;
    s += `<path d="M${ox + 1} ${y + 4} Q${ox + 6} ${y + 0.3} ${ox + 11} ${y + 4} Q${ox + 6} ${y + 7.7} ${ox + 1} ${y + 4} Z" fill="${i === open ? 'none' : c}" stroke="${c}" stroke-width="1.1"/>`;
    if (i === open) s += `<circle cx="${ox + 6}" cy="${y + 4}" r="1.4" fill="${c}"/>`;
  }
  return s + '</g>';
}

/** Spicul secerat: grains drop until a bare stalk bends head-down. */
export function spiculSecerat(x: number, y: number, h: number, c: string, w = 1.1): string {
  return `<g fill="none" stroke="${c}" stroke-width="${w}"><path d="M${x} ${y + h} V${y + h * 0.45} Q${x} ${y + h * 0.1} ${x + 6} ${y + h * 0.2}"/><path d="M${x} ${y + h * 0.8} L${x - 2.5} ${y + h * 0.72}"/><circle cx="${x + 4}" cy="${y + h + 2}" r=".8" fill="${c}"/><circle cx="${x + 7}" cy="${y + h + 1}" r=".8" fill="${c}"/></g>`;
}
