// The card: a wood frame with chip-carved facets, a painted-glass ground, the icon heart, one motif
// at the hem, the name on a limewash band. Lifted from priveghi_prototype_v4.html (cardSVG). The
// dead's table adds the owner's chip (the owner's motif, top left: the edge a spread hand shows) and
// Uitare's thinning (a soot-paper veil over the art, deeper with each of four steps, R87). The hem
// band is 13 units tall with its tile scaled up, so the kind reads at the phone's scale (R93).
import { ART, type ArtId } from './art';
import { M, band, ochiulDeschis, rosette } from './motifs';
import { C } from './palette';

export type Hem =
  | 'romb' | 'brad' | 'ochi' | 'ochiul-deschis' | 'colt' | 'meandru' | 'spic' | 'pom' | 'sarpe' | 'stea' | 'cruce'
  | 'funia' | 'romb-frant' | 'funia-frayed';

export interface CardSpec {
  /** Unique within the document: pattern ids derive from it. */
  uid: string;
  name: string;
  art: ArtId;
  hem: Hem;
  ground: string;
  /** Hem stitch colour for dark grounds; soot otherwise. */
  hemInk?: string;
  /** The owner's hem motif as a 12x12 chip in the top-left corner; none for nobody's. */
  ownerChip?: Hem;
  /** Uitare's thinning, 0..4: a translucent soot-paper veil over the art, 0.15 per step (R87). */
  thin?: number;
}

export function esc(s: string): string {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}

/** Names longer than one band line break before their preposition (Frate / de cruce; pomana / de vis). */
export function splitName(n: string): string[] {
  if (n.length <= 13) return [n];
  const at = n.search(/ (de|cu) /);
  if (at > 0) return [n.slice(0, at), n.slice(at + 1)];
  const words = n.split(' ');
  let a = '';
  let b = '';
  for (const w of words) {
    if ((a + ' ' + w).trim().length <= 13 && !b) a = (a + ' ' + w).trim();
    else b = (b + ' ' + w).trim();
  }
  return b ? [a, b] : [a];
}

/** The motif's pattern definition; null for the one hem that is drawn, not tiled (ochiul deschis). */
export function hemPattern(hem: Hem, id: string, ink: string): string | null {
  switch (hem) {
    case 'ochiul-deschis': return null;
    case 'funia': return M.funia(id, ink, C.woodLight);
    case 'funia-frayed': return M.funiaFrayed(id, ink, C.woodLight);
    case 'romb-frant': return M.rombFrant(id, ink);
    default: return M[hem](id, ink);
  }
}

/** The hem band: y 117 to the name band at 130, 13 units tall; each tile scaled so one row fills it (R93). */
const HEM_BOX = { y: 117, h: 13 };
const HEM_SCALE: Record<Hem, number> = {
  romb: 1.6, brad: 1.6, ochi: 1.6, 'ochiul-deschis': 1.6, colt: 2.1, meandru: 1.6, spic: 1.3, pom: 0.93, sarpe: 1.6,
  stea: 1.08, cruce: 1.3, funia: 1.6, 'romb-frant': 1.6, 'funia-frayed': 1.6,
};

function hemBand(hem: Hem, id: string, ink: string): { defs: string; hem: string } {
  const defs = hemPattern(hem, id, ink);
  const k = HEM_SCALE[hem];
  if (defs === null) {
    return { defs: '', hem: `<g transform="translate(10 ${HEM_BOX.y}) scale(${k})">${ochiulDeschis(0, 0, 100 / k, ink)}</g>` };
  }
  return { defs: defs.replace('<pattern ', `<pattern patternTransform="scale(${k})" `), hem: band(id, 10, HEM_BOX.y, 100, HEM_BOX.h) };
}

/** The owner's chip: one tile of their motif on limewash, inside the ground's top-left corner (R93). */
function chipSVG(hem: Hem, id: string): { defs: string; chip: string } {
  const defs = hemPattern(hem, id, C.soot);
  const fill = defs === null ? ochiulDeschis(0, 2, 12, C.soot) : `<rect x="1" y="1" width="10" height="10" fill="url(#${id})"/>`;
  return {
    defs: defs ?? '',
    chip: `<g class="owner-chip" transform="translate(14 16)"><rect x="0" y="0" width="12" height="12" fill="${C.lime}" stroke="${C.soot}" stroke-width="1"/>${fill}</g>`,
  };
}

export function cardSVG(spec: CardSpec): string {
  const id = 'c-' + spec.uid;
  const { defs, hem } = hemBand(spec.hem, 'hem-' + id, spec.hemInk ?? C.soot);
  const chip = spec.ownerChip ? chipSVG(spec.ownerChip, 'chip-' + id) : { defs: '', chip: '' };
  const thin = Math.max(0, Math.min(4, spec.thin ?? 0));
  const veil = thin > 0 ? `<rect x="8" y="12" width="104" height="118" fill="${C.paperSoot}" opacity="${(0.15 * thin).toFixed(2)}"/>` : '';
  const lines = spec.name ? splitName(spec.name) : [];
  const y0 = lines.length > 1 ? 142 : 150;
  const size = lines.length > 1 ? 12.5 : 15;
  const name = lines
    .map((l, i) => `<text x="60" y="${y0 + i * 13}" text-anchor="middle" font-family="Cormorant Unicase, Cormorant Garamond, Georgia, serif" font-weight="600" font-size="${size}" fill="${C.soot}">${esc(l)}</text>`)
    .join('');
  return `<svg viewBox="0 0 120 168" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs>${defs}${chip.defs}</defs>
    <rect x="0" y="0" width="120" height="168" fill="${C.earth}"/>
    <rect x="2.5" y="2.5" width="115" height="163" fill="none" stroke="${C.woodLight}" stroke-width="1.5" stroke-dasharray="4 4"/>
    <rect x="2.5" y="2.5" width="115" height="163" fill="none" stroke="${C.soot}" stroke-width="1.5" stroke-dasharray="4 4" stroke-dashoffset="4"/>
    <rect x="8" y="12" width="104" height="150" fill="${spec.ground}"/>
    ${ART[spec.art]()}${chip.chip}${veil}
    <rect x="10" y="130" width="100" height="32" fill="${C.lime}"/><path d="M10 130 H110" stroke="${C.soot}" stroke-width="1.2"/>
    ${hem}${name}
    <rect class="face-contour" x="8" y="12" width="104" height="150" fill="none" stroke="${C.soot}" stroke-width="2.4"/></svg>`;
}

/** A written egg: divide the field first (quarters, diagonals, a belt), then fill. */
export function cardBackSVG(uid: string): string {
  const mid = 'bk-m-' + uid;
  return `<svg viewBox="0 0 120 168" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs>${M.meandru(mid, C.wax)}</defs>
    <rect width="120" height="168" fill="${C.earth}"/><rect x="2.5" y="2.5" width="115" height="163" fill="none" stroke="${C.woodLight}" stroke-width="1.5" stroke-dasharray="4 4"/>
    <rect x="8" y="12" width="104" height="150" fill="${C.clot}" stroke="${C.soot}" stroke-width="2.4"/>
    <path d="M60 12 V162 M8 87 H112 M8 12 L112 162 M112 12 L8 162" stroke="${C.wax}" stroke-width="1"/>
    <rect x="14" y="80" width="92" height="14" fill="url(#${mid})"/><ellipse cx="60" cy="87" rx="22" ry="28" fill="${C.clot}" stroke="${C.wax}" stroke-width="1"/>${rosette(60, 87, 10, C.wax, C.clot)}</svg>`;
}
