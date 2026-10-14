// The table's fixed pieces: the verb niches, the dark door, the candle, the plank, bread and salt.
// Niche, door, candle, grain row and still life are lifted from priveghi_prototype_v4.html.
import { M, rosette, thread } from './motifs';
import { C } from './palette';

export type Mark = 'meandru' | 'pom' | 'ochi' | 'spic' | 'sarpe';

/** A craft frame sheltering an icon heart. Only the troita niche has a roof. */
export function nicheSVG(id: string, opts: { roof?: boolean; thread?: boolean; mark?: Mark; icon?: boolean }): string {
  const fid = 'fun-' + id;
  const mid = 'mark-' + id;
  const markDef = opts.mark ? M[opts.mark](mid, C.wax) : '';
  const roof = opts.roof
    ? `<path d="M8 40 L75 6 L142 40 Z" fill="${C.woodMid}" stroke="${C.soot}" stroke-width="2"/><path d="M22 34 H128 M34 28 H116 M46 22 H104 M58 16 H92" stroke="${C.soot}" stroke-width="1"/>${rosette(75, 24, 7, C.soot, C.woodMid)}`
    : '';
  const lintelY = opts.roof ? 38 : 26;
  const lintel = opts.roof ? '' : `<rect x="12" y="${lintelY}" width="126" height="20" fill="${C.woodMid}" stroke="${C.soot}" stroke-width="2"/>`;
  const mark = markDef ? `<rect x="51" y="${lintelY + 5}" width="48" height="10" fill="url(#${mid})"/>` : '';
  return `<svg class="niche" viewBox="0 0 150 210" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs>${M.funia(fid, C.woodLight, C.soot)}${markDef}</defs>
    ${roof}
    <rect x="12" y="${lintelY}" width="126" height="${204 - lintelY}" fill="${C.earth}" stroke="${C.soot}" stroke-width="2"/>
    ${lintel}
    <rect x="14" y="${lintelY + 2}" width="7" height="${200 - lintelY}" fill="url(#${fid})"/><rect x="129" y="${lintelY + 2}" width="7" height="${200 - lintelY}" fill="url(#${fid})"/>
    <rect x="21" y="${opts.roof ? 40 : 46}" width="108" height="${opts.roof ? 150 : 144}" fill="${C.soot}"/>
    <ellipse cx="75" cy="${opts.roof ? 44 : 50}" rx="40" ry="9" fill="${C.nicheDark}" opacity=".7"/>
    ${opts.icon ? troitaIcon() : ''}
    ${mark}
    <rect x="21" y="190" width="108" height="12" fill="${C.woodMid}" stroke="${C.soot}" stroke-width="1.5"/>
    ${opts.thread ? thread(56, 38, 94, 38, 2.4) + `<path d="M56 38 l-2 9 M94 38 l2 9" stroke="${C.red}" stroke-width="1.4"/><path d="M56 38 l-3 9 M94 38 l3 9" stroke="${C.lime}" stroke-width="1" opacity=".8"/>` : ''}
    <rect class="nicheframe" x="12" y="${lintelY}" width="126" height="${204 - lintelY}" fill="none" stroke="${C.soot}" stroke-width="2"/>
    <rect class="rim" x="10" y="${lintelY - 2}" width="130" height="${208 - lintelY}" fill="none" stroke="${C.gold}" stroke-width="1"/></svg>`;
}

/** The troita's heart: an icon on flat gold, a figure you cannot read, one flame that never goes out. */
function troitaIcon(): string {
  return `<rect x="45" y="58" width="60" height="92" fill="${C.gold}" stroke="${C.soot}" stroke-width="2"/>
    <ellipse cx="75" cy="78" rx="7.5" ry="9" fill="${C.soot}"/><path d="M64 92 H86 L91 146 H59 Z" fill="${C.soot}"/>
    <rect x="72" y="166" width="6" height="22" fill="${C.wax}" stroke="${C.soot}" stroke-width="1.2"/><line x1="75" y1="166" x2="75" y2="162" stroke="${C.soot}" stroke-width="1"/>
    <g class="flame" style="transform-box:fill-box"><ellipse cx="75" cy="156" rx="2.8" ry="5" fill="${C.gold}"/><ellipse cx="75" cy="157" rx="1.4" ry="3" fill="${C.wax}"/></g>`;
}

/** A lintel and nothing: the far dark reaches the cloth through it. Never a drop target. */
export function darkDoorSVG(): string {
  return `<svg viewBox="0 0 60 210" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect x="4" y="26" width="52" height="20" fill="${C.woodMid}" stroke="${C.soot}" stroke-width="2"/><rect x="4" y="46" width="6" height="158" fill="${C.earth}" stroke="${C.soot}" stroke-width="1.5"/><rect x="50" y="46" width="6" height="158" fill="${C.earth}" stroke="${C.soot}" stroke-width="1.5"/><rect x="10" y="46" width="40" height="158" fill="${C.nicheDark}"/></svg>`;
}

/** Beeswax burning down; `frac` is what remains, 0..1. */
export function candleSVG(frac: number, opts: { out?: boolean; slow?: boolean } = {}): string {
  const H = 60;
  const h = Math.max(4, H * frac);
  const top = 70 - h;
  const drips = frac < 0.85 ? `<rect x="6" y="${top + 4}" width="2" height="${Math.min(14, (1 - frac) * 30)}" fill="${C.lime}"/>` : '';
  const flame = opts.out
    ? ''
    : `<g class="flame ${opts.slow ? 'slow' : ''}" style="transform-box:fill-box"><ellipse cx="12" cy="${top - 7}" rx="3.2" ry="6" fill="${C.gold}"/><ellipse cx="12" cy="${top - 6}" rx="1.6" ry="3.6" fill="${C.wax}"/></g>`;
  return `<svg viewBox="0 0 24 80" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect x="2" y="70" width="20" height="6" fill="${C.woodMid}" stroke="${C.soot}" stroke-width="1"/>
    <rect x="5" y="${top}" width="14" height="${h}" fill="${C.wax}" stroke="${C.soot}" stroke-width="1.2"/><rect x="6" y="${top}" width="12" height="1.5" fill="${C.lime}"/>${drips}
    <line x1="12" y1="${top}" x2="12" y2="${top - 3}" stroke="${C.soot}" stroke-width="1"/>${flame}</svg>`;
}

/** The candle's clay dish: the one wax slot (chapter §2). */
export function dishSVG(): string {
  return `<svg viewBox="0 0 80 22" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M4 7 Q40 -1 76 7 L70 16 Q40 22 10 16 Z" fill="${C.earth}" stroke="${C.soot}" stroke-width="1.6"/><path d="M12 9 Q40 4 68 9" fill="none" stroke="${C.woodLight}" stroke-width="1" opacity=".7"/></svg>`;
}

/** Wheat grains on a Fir de dor's edge: one falls at each close, silently. */
export function grainRowSVG(left: number, total = 3, color: string = C.soot): string {
  let s = '';
  for (let i = 0; i < total; i++) {
    const x = 20 + i * 24;
    s += `<path d="M${x} 10 V2 M${x} 6 l-4 -3 M${x} 6 l4 -3" fill="none" stroke="${color}" stroke-width="1.6" opacity="${i < left ? 1 : 0.15}"/>`;
  }
  return `<svg viewBox="0 0 108 12" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${s}</svg>`;
}

/** The plank at the cloth's far left: an oak board with battens, where Cel Nenuntit lies. */
export function plankSVG(): string {
  return `<svg viewBox="0 0 124 296" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect x="4" y="4" width="116" height="288" fill="${C.woodMid}" stroke="${C.soot}" stroke-width="2"/>
    <rect x="9" y="9" width="106" height="278" fill="none" stroke="${C.woodLight}" stroke-width="1.5" stroke-dasharray="4 4"/>
    <rect x="9" y="9" width="106" height="278" fill="none" stroke="${C.soot}" stroke-width="1.5" stroke-dasharray="4 4" stroke-dashoffset="4"/>
    <path d="M30 14 V282 M62 14 V282 M94 14 V282" stroke="${C.soot}" stroke-width="1" opacity=".35"/>
    <rect x="4" y="24" width="116" height="12" fill="${C.earth}" stroke="${C.soot}" stroke-width="1.5"/>
    <rect x="4" y="262" width="116" height="12" fill="${C.earth}" stroke="${C.soot}" stroke-width="1.5"/></svg>`;
}

/** Bread and salt by the flame. Their shadow falls away from it: shelter carries no wrong thing. */
export function stillLifeSVG(): string {
  return `<svg viewBox="0 0 180 120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <ellipse cx="78" cy="78" rx="46" ry="14" fill="${C.soot}" opacity=".45" transform="translate(-16 10)"/>
    <ellipse cx="70" cy="70" rx="42" ry="20" fill="${C.bread}" stroke="${C.soot}" stroke-width="2"/><path d="M36 66 Q70 54 104 66" fill="none" stroke="${C.soot}" stroke-width="1.5"/><path d="M50 74 l8 -6 M70 76 l8 -6 M88 74 l6 -5" stroke="${C.soot}" stroke-width="1.2"/>
    <ellipse cx="133" cy="94" rx="18" ry="5" fill="${C.soot}" opacity=".45" transform="translate(-8 4)"/>
    <path d="M118 90 L124 62 L146 62 L152 90 Z" fill="${C.woodMid}" stroke="${C.soot}" stroke-width="2"/><ellipse cx="135" cy="62" rx="11" ry="4" fill="${C.lime}" stroke="${C.soot}" stroke-width="1.4"/></svg>`;
}

/** Portrait on a phone: the table's frame, turned. No words. */
export function rotateSVG(): string {
  return `<svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect x="58" y="36" width="44" height="78" fill="none" stroke="${C.waxDim}" stroke-width="1.5" stroke-dasharray="3 3"/>
    <rect x="41" y="53" width="78" height="44" fill="${C.soot}" stroke="${C.wax}" stroke-width="2"/>
    <rect x="47" y="59" width="66" height="32" fill="none" stroke="${C.earth}" stroke-width="1.5"/>
    <path d="M110 30 Q132 40 130 66" fill="none" stroke="${C.wax}" stroke-width="1.6"/><path d="M125 60 L130 67 L135 60" fill="none" stroke="${C.wax}" stroke-width="1.6"/></svg>`;
}

/** Frant: hemp cords across a niche's opening, as across a bound card (prototype's Legat state). */
export function cordSVG(): string {
  const cords = [72, 102, 132, 162]
    .map((y) => `<path d="M14 ${y} L136 ${y + 22}" stroke="${C.woodLight}" stroke-width="4.5"/><path d="M14 ${y} L136 ${y + 22}" stroke="${C.soot}" stroke-width="4.5" stroke-dasharray="3 3"/>`)
    .join('');
  return `<svg viewBox="0 0 150 210" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${cords}</svg>`;
}

/** Vigoare: three wax drops by the dish; a lost one goes dark. */
export function pipsSVG(left: number, total: number): string {
  let s = '';
  for (let i = 0; i < total; i++) {
    const x = 10 + i * 20;
    s += `<path d="M${x} 2 Q${x + 5} 9 ${x} 12 Q${x - 5} 9 ${x} 2 Z" fill="${i < left ? C.wax : C.soot}" stroke="${C.soot}" stroke-width="1.2"/>`;
  }
  return `<svg viewBox="0 0 ${total * 20} 14" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${s}</svg>`;
}

/** A memorial dish on the plank: empty while the day waits, coliva with a cross when kept, dark when missed. */
export function markSVG(state: 'waiting' | 'held' | 'missed'): string {
  const dish = `<path d="M3 22 Q22 30 41 22 L37 30 Q22 35 7 30 Z" fill="${state === 'missed' ? C.soot : C.earth}" stroke="${C.soot}" stroke-width="1.4"/>`;
  const heap = state === 'held'
    ? `<path d="M6 22 Q22 4 38 22 Z" fill="${C.lime}" stroke="${C.soot}" stroke-width="1.4"/><path d="M22 11 V20 M18 15.5 H26" stroke="${C.soot}" stroke-width="1.6"/>`
    : '';
  return `<svg viewBox="0 0 44 36" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${heap}${dish}</svg>`;
}
