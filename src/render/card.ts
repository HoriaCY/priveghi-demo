// The card: a wood frame with chip-carved facets, a painted-glass ground, the icon heart, one motif
// at the hem, the name on a limewash band. Lifted from priveghi_prototype_v4.html (cardSVG).
import { ART, type ArtId } from './art';
import { M, band, ochiulDeschis, rosette } from './motifs';
import { C } from './palette';

export type Hem = 'romb' | 'brad' | 'ochi' | 'ochiul-deschis' | 'colt' | 'meandru' | 'spic' | 'pom' | 'sarpe' | 'stea' | 'cruce';

export interface CardSpec {
  /** Unique within the document: pattern ids derive from it. */
  uid: string;
  name: string;
  art: ArtId;
  hem: Hem;
  ground: string;
  /** Hem stitch colour for dark grounds; soot otherwise. */
  hemInk?: string;
}

export function esc(s: string): string {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}

/** Names longer than one band line break before their preposition ("Plosca / cu apa vie"). */
export function splitName(n: string): string[] {
  if (n.length <= 15) return [n];
  const at = n.search(/ (de|cu) /);
  if (at > 0) return [n.slice(0, at), n.slice(at + 1)];
  const words = n.split(' ');
  let a = '';
  let b = '';
  for (const w of words) {
    if ((a + ' ' + w).trim().length <= 15 && !b) a = (a + ' ' + w).trim();
    else b = (b + ' ' + w).trim();
  }
  return b ? [a, b] : [a];
}

function hemBand(hem: Hem, id: string, ink: string): { defs: string; hem: string } {
  switch (hem) {
    case 'romb': return { defs: M.romb(id, ink), hem: band(id, 10, 120, 100, 8) };
    case 'brad': return { defs: M.brad(id, ink), hem: band(id, 10, 120, 100, 8) };
    case 'ochi': return { defs: M.ochi(id, ink), hem: band(id, 10, 120, 100, 8) };
    case 'ochiul-deschis': return { defs: '', hem: ochiulDeschis(10, 120, 100, ink) };
    case 'colt': return { defs: M.colt(id, ink), hem: band(id, 10, 121, 100, 6) };
    case 'meandru': return { defs: M.meandru(id, ink), hem: band(id, 10, 120, 100, 8) };
    case 'spic': return { defs: M.spic(id, ink), hem: band(id, 10, 119, 100, 10) };
    case 'pom': return { defs: M.pom(id, ink), hem: band(id, 10, 117, 100, 14) };
    case 'sarpe': return { defs: M.sarpe(id, ink), hem: band(id, 10, 120, 100, 8) };
    case 'stea': return { defs: M.stea(id, ink), hem: band(id, 10, 118, 100, 12) };
    case 'cruce': return { defs: M.cruce(id, ink), hem: band(id, 10, 119, 100, 10) };
  }
}

export function cardSVG(spec: CardSpec): string {
  const id = 'c-' + spec.uid;
  const { defs, hem } = hemBand(spec.hem, 'hem-' + id, spec.hemInk ?? C.soot);
  const lines = splitName(spec.name);
  const y0 = lines.length > 1 ? 143 : 149;
  const size = lines.length > 1 ? 11 : 12.5;
  const name = lines
    .map((l, i) => `<text x="60" y="${y0 + i * 13}" text-anchor="middle" font-family="Cormorant Unicase, Cormorant Garamond, Georgia, serif" font-weight="600" font-size="${size}" fill="${C.soot}">${esc(l)}</text>`)
    .join('');
  return `<svg viewBox="0 0 120 168" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs>${defs}</defs>
    <rect x="0" y="0" width="120" height="168" fill="${C.earth}"/>
    <rect x="2.5" y="2.5" width="115" height="163" fill="none" stroke="${C.woodLight}" stroke-width="1.5" stroke-dasharray="4 4"/>
    <rect x="2.5" y="2.5" width="115" height="163" fill="none" stroke="${C.soot}" stroke-width="1.5" stroke-dasharray="4 4" stroke-dashoffset="4"/>
    <rect x="8" y="12" width="104" height="150" fill="${spec.ground}"/>
    ${ART[spec.art]()}
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
