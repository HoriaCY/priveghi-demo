// Card hearts in the icon grammar: frontal, flat fills, the bold soot contour (icoane pe sticla).
// Drawn in the card's 120x168 frame; the art lives above the hem band (y < 117), never a word.
// Ported from prototype v5 (design/proto5/v5_art.js): mort, cruce, cana, broboada, oglinda, icoana,
// mama, draguta, pisica. Kept from v4: dor, rada, cununie. Drawn for the dead's table in the same
// grammar: frantura, semn, inel, cutit, fluier, arc, pomana, frate, dusman, preot, casa, tinda, curte,
// sat, biserica, masca.
import { C } from './palette';
import { rosette, thread } from './motifs';

export type ArtId =
  | 'mort' | 'cruce' | 'dor' | 'frantura' | 'semn'
  | 'cana' | 'broboada' | 'inel' | 'icoana' | 'oglinda' | 'cutit' | 'fluier' | 'arc' | 'pomana'
  | 'mama' | 'draguta' | 'frate' | 'dusman' | 'preot' | 'rada'
  | 'casa' | 'tinda' | 'curte' | 'sat' | 'biserica'
  | 'pisica' | 'masca' | 'cununie';

const ring = (a: number) => {
  const r = (a * Math.PI) / 180;
  return `<circle cx="${(60 + 30 * Math.cos(r)).toFixed(1)}" cy="${(72 + 30 * Math.sin(r)).toFixed(1)}" r="4.5" fill="${C.lime}" stroke="${C.soot}" stroke-width="1.4"/>`;
};

export const ART: Record<ArtId, () => string> = {
  // you: the sheet from the waist down, the upper body undrawn (chapter §1), a candle at the head, the thread
  mort: () => `<ellipse cx="60" cy="92" rx="40" ry="14" fill="${C.earth}"/><path d="M22 92 Q30 62 60 58 Q90 62 98 92 Z" fill="${C.lime}" stroke="${C.soot}" stroke-width="2"/><path d="M34 84 Q60 74 86 84" fill="none" stroke="${C.soot}" stroke-width="1.2"/><path d="M40 70 Q60 64 80 70" fill="none" stroke="${C.soot}" stroke-width="1"/>
    <rect x="24" y="36" width="5" height="28" fill="${C.wax}" stroke="${C.soot}" stroke-width="1.2"/><g class="flame" style="transform-box:fill-box"><ellipse cx="26.5" cy="32" rx="2.2" ry="3.4" fill="${C.gold}"/><ellipse cx="26.5" cy="33" rx="1" ry="2" fill="${C.wax}"/></g>
    <path d="M46 100 h28" stroke="${C.red}" stroke-width="2"/><path d="M46 100 h14" stroke="${C.lime}" stroke-width="2" stroke-dasharray="3 3"/>`,
  // the grave's wooden cross; the grass line raised from v5's 118 to stay above the hem
  cruce: () => `<ellipse cx="60" cy="110" rx="30" ry="6" fill="${C.earth}"/><rect x="55" y="30" width="10" height="84" fill="${C.woodMid}" stroke="${C.soot}" stroke-width="2"/><rect x="36" y="48" width="48" height="10" fill="${C.woodMid}" stroke="${C.soot}" stroke-width="2"/><rect x="40" y="36" width="40" height="7" fill="${C.woodMid}" stroke="${C.soot}" stroke-width="1.6"/><path d="M46 100 h28" stroke="${C.red}" stroke-width="2"/><path d="M46 100 h14" stroke="${C.lime}" stroke-width="2" stroke-dasharray="3 3"/><path d="M30 114 q8 -5 16 0 q8 5 16 0 q8 -5 16 0" fill="none" stroke="${C.soot}" stroke-width="1.2"/>`,
  dor: () => `<path d="M30 100 C40 60 56 60 60 80 S74 112 84 70 S96 30 70 40" fill="none" stroke="${C.soot}" stroke-width="5" stroke-linecap="round"/><path d="M30 100 C40 60 56 60 60 80 S74 112 84 70 S96 30 70 40" fill="none" stroke="${C.lime}" stroke-width="2.4" stroke-linecap="round"/><path d="M30 100 l-4 8 M70 40 l-3 -5" stroke="${C.lime}" stroke-width="1.2"/>`,
  // a torn strip of paper with a line of writing you cannot read
  frantura: () => `<g transform="rotate(-6 60 78)"><path d="M32 50 L88 50 L84 60 L90 72 L86 84 L90 96 L86 106 L32 106 L36 94 L30 82 L36 68 Z" fill="${C.paper}" stroke="${C.soot}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M42 66 Q50 62 58 66 T74 66" fill="none" stroke="${C.soot}" stroke-width="1.6" stroke-dasharray="5 2"/><path d="M42 78 Q52 74 62 78 T80 78" fill="none" stroke="${C.soot}" stroke-width="1.6" stroke-dasharray="4 2"/><path d="M42 90 Q48 87 54 90 T66 90" fill="none" stroke="${C.soot}" stroke-width="1.6" stroke-dasharray="3 2"/></g>`,
  // the sign: a cup that moved by itself, in the icon's corner on flat gold; the ring where it stood
  semn: () => `<rect x="30" y="34" width="60" height="80" fill="${C.gold}" stroke="${C.soot}" stroke-width="2.2"/><path d="M36 40 H84 V108 H36 Z" fill="none" stroke="${C.soot}" stroke-width="1" opacity=".5"/>${rosette(45, 50, 6, C.soot)}
    <ellipse cx="48" cy="102" rx="10" ry="3" fill="none" stroke="${C.soot}" stroke-width="1.2" stroke-dasharray="2 2"/>
    <g transform="rotate(-14 66 90)"><path d="M58 74 L60 100 L74 100 L76 74 Z" fill="${C.woodMid}" stroke="${C.soot}" stroke-width="2"/><ellipse cx="67" cy="74" rx="9" ry="2.8" fill="${C.woodLight}" stroke="${C.soot}" stroke-width="1.4"/><path d="M76 80 Q86 82 84 90 Q82 95 75 94" fill="none" stroke="${C.soot}" stroke-width="1.8"/></g>`,

  cana: () => `<path d="M38 56 L42 108 L78 108 L82 56 Z" fill="${C.woodMid}" stroke="${C.soot}" stroke-width="2.2"/><ellipse cx="60" cy="56" rx="22" ry="6" fill="${C.woodLight}" stroke="${C.soot}" stroke-width="1.6"/><path d="M82 66 Q100 70 96 86 Q92 98 80 96" fill="none" stroke="${C.soot}" stroke-width="2.2"/><path d="M46 76 h28 M47 86 h26" stroke="${C.soot}" stroke-width="1"/><path d="M50 66 q5 -3 10 0 q5 3 10 0" fill="none" stroke="${C.clot}" stroke-width="1.4"/>`,
  broboada: () => `<path d="M22 50 L60 110 L98 50 Z" fill="${C.clot}" stroke="${C.soot}" stroke-width="2.2"/><path d="M30 54 L60 100 L90 54" fill="none" stroke="${C.wax}" stroke-width="1" stroke-dasharray="2 3"/><path d="M26 56 l-3 7 M34 68 l-3 7 M42 80 l-3 7 M50 92 l-3 7 M94 56 l3 7 M86 68 l3 7 M78 80 l3 7 M70 92 l3 7" stroke="${C.soot}" stroke-width="1.2"/><path d="M48 64 q6 -5 12 0 q6 5 12 0" fill="none" stroke="${C.wax}" stroke-width="1.2"/>`,
  // a ring on a folded cloth, its stone of old red
  inel: () => `<path d="M24 68 L96 62 L98 108 L26 112 Z" fill="${C.linen}" stroke="${C.soot}" stroke-width="2"/><path d="M24 68 Q60 86 96 62" fill="none" stroke="${C.soot}" stroke-width="1" opacity=".5"/>
    <circle cx="60" cy="88" r="13" fill="none" stroke="${C.gold}" stroke-width="5"/><circle cx="60" cy="88" r="15.5" fill="none" stroke="${C.soot}" stroke-width="1.3"/><circle cx="60" cy="88" r="10.5" fill="none" stroke="${C.soot}" stroke-width="1.3"/>
    <path d="M56 73 L60 68 L64 73 L60 78 Z" fill="${C.clot}" stroke="${C.soot}" stroke-width="1.2"/>`,
  icoana: () => `<rect x="32" y="32" width="56" height="84" fill="${C.gold}" stroke="${C.soot}" stroke-width="2.2"/><circle cx="60" cy="58" r="13" fill="none" stroke="${C.soot}" stroke-width="1.6"/><ellipse cx="60" cy="60" rx="8" ry="10" fill="${C.wax}" stroke="${C.soot}" stroke-width="1.4"/><path d="M48 76 L60 72 L72 76 L72 110 L48 110 Z" fill="${C.clot}" stroke="${C.soot}" stroke-width="1.4"/><path d="M60 80 V100 M54 86 H66" stroke="${C.gold}" stroke-width="1.6"/>`,
  // covered for the vigil
  oglinda: () => `<rect x="34" y="34" width="52" height="78" rx="6" fill="${C.woodMid}" stroke="${C.soot}" stroke-width="2.2"/><rect x="40" y="40" width="40" height="66" rx="4" fill="${C.linen}" stroke="${C.soot}" stroke-width="1.4"/><path d="M44 100 L76 44" stroke="${C.lime}" stroke-width="3" opacity=".8"/><circle cx="60" cy="30" r="3" fill="${C.gold}" stroke="${C.soot}" stroke-width="1.2"/>`,
  // a knife, handle to the left, laid across
  cutit: () => `<g transform="rotate(-32 60 84)"><path d="M18 80 L48 78 L48 92 L18 90 Z" fill="${C.woodMid}" stroke="${C.soot}" stroke-width="2"/><circle cx="28" cy="85" r="1.5" fill="${C.soot}"/><circle cx="38" cy="85" r="1.5" fill="${C.soot}"/>
    <rect x="48" y="76" width="6" height="18" fill="${C.earth}" stroke="${C.soot}" stroke-width="1.6"/>
    <path d="M54 78 L96 80 Q104 84 94 91 L54 92 Z" fill="${C.lime}" stroke="${C.soot}" stroke-width="2"/><path d="M58 85 H90" stroke="${C.soot}" stroke-width="1" opacity=".45"/></g>`,
  // a shepherd's flute, six holes
  fluier: () => `<g transform="rotate(-56 60 78)"><rect x="18" y="73" width="84" height="10" rx="2" fill="${C.woodLight}" stroke="${C.soot}" stroke-width="2"/><rect x="18" y="73" width="12" height="10" rx="2" fill="${C.woodMid}" stroke="${C.soot}" stroke-width="1.6"/>
    <path d="M30 76 H100" stroke="${C.soot}" stroke-width="1" opacity=".35"/>
    <circle cx="48" cy="78" r="1.8" fill="${C.soot}"/><circle cx="57" cy="78" r="1.8" fill="${C.soot}"/><circle cx="66" cy="78" r="1.8" fill="${C.soot}"/><circle cx="75" cy="78" r="1.8" fill="${C.soot}"/><circle cx="84" cy="78" r="1.8" fill="${C.soot}"/><circle cx="93" cy="78" r="1.8" fill="${C.soot}"/></g>`,
  // your bow, unstrung: the string hangs loose from the upper nock
  arc: () => `<path d="M42 112 Q18 72 56 34" fill="none" stroke="${C.soot}" stroke-width="7" stroke-linecap="round"/><path d="M42 112 Q18 72 56 34" fill="none" stroke="${C.woodMid}" stroke-width="4" stroke-linecap="round"/>
    <path d="M29 70 l9 2 M29 76 l9 2" stroke="${C.soot}" stroke-width="1.4"/>
    <path d="M56 34 Q74 46 70 70 Q66 92 78 108 Q82 112 88 110" fill="none" stroke="${C.woodLight}" stroke-width="1.8"/><path d="M56 34 Q74 46 70 70 Q66 92 78 108 Q82 112 88 110" fill="none" stroke="${C.soot}" stroke-width=".6" opacity=".6"/>`,
  // a colac, the round bread, with a candle stuck in it, unlit
  pomana: () => `<ellipse cx="60" cy="90" rx="34" ry="17" fill="${C.bread}" stroke="${C.soot}" stroke-width="2"/><ellipse cx="60" cy="90" rx="11" ry="5" fill="${C.earth}" stroke="${C.soot}" stroke-width="1.4"/>
    <path d="M30 86 l5 -5 M38 80 l5 -4 M48 76 l5 -3 M72 76 l-5 -3 M82 80 l-5 -4 M90 86 l-5 -5 M34 98 l5 4 M44 104 l6 2 M76 104 l-6 2 M86 98 l-5 4" stroke="${C.soot}" stroke-width="1.3" stroke-linecap="round"/>
    <rect x="57" y="56" width="6" height="32" fill="${C.wax}" stroke="${C.soot}" stroke-width="1.4"/><path d="M60 56 V50" stroke="${C.soot}" stroke-width="1.2"/>`,

  mama: () => `<path d="M40 118 L46 60 L74 60 L80 118 Z" fill="${C.soot}"/><ellipse cx="60" cy="44" rx="11" ry="13" fill="${C.wax}" stroke="${C.soot}" stroke-width="2"/><path d="M46 46 Q46 26 60 26 Q74 26 74 46 L74 60 L46 60 Z" fill="${C.clot}" stroke="${C.soot}" stroke-width="1.6"/><path d="M48 44 Q60 36 72 44" fill="none" stroke="${C.soot}" stroke-width="1"/><circle cx="56" cy="46" r="1.2" fill="${C.soot}"/><circle cx="64" cy="46" r="1.2" fill="${C.soot}"/><path d="M50 90 Q60 96 70 90" fill="none" stroke="${C.wax}" stroke-width="1.6"/>`,
  draguta: () => `<path d="M40 118 L46 60 L74 60 L80 118 Z" fill="${C.lime}" stroke="${C.soot}" stroke-width="2"/><ellipse cx="60" cy="44" rx="11" ry="13" fill="${C.wax}" stroke="${C.soot}" stroke-width="2"/><path d="M49 40 Q60 28 71 40 L72 60 L48 60 Z" fill="${C.soot}"/><circle cx="56" cy="46" r="1.2" fill="${C.soot}"/><circle cx="64" cy="46" r="1.2" fill="${C.soot}"/><path d="M44 70 h32 M46 80 h28" stroke="${C.red}" stroke-width="1.6"/><path d="M58 96 l2 -4 l2 4 l-2 4 Z" fill="${C.gold}" stroke="${C.soot}" stroke-width=".8"/>`,
  // the sworn brother: a young man, the sash of the thread, his cup in hand
  frate: () => `<path d="M40 118 L46 60 L74 60 L80 118 Z" fill="${C.lime}" stroke="${C.soot}" stroke-width="2"/><ellipse cx="60" cy="44" rx="11" ry="13" fill="${C.wax}" stroke="${C.soot}" stroke-width="2"/><path d="M48 40 Q60 26 72 40 L72 46 Q60 38 48 46 Z" fill="${C.soot}"/><circle cx="56" cy="46" r="1.2" fill="${C.soot}"/><circle cx="64" cy="46" r="1.2" fill="${C.soot}"/>
    ${thread(47, 64, 77, 108, 4)}
    <path d="M74 68 Q86 74 88 86" fill="none" stroke="${C.soot}" stroke-width="2"/><path d="M80 86 L82 102 L94 102 L96 86 Z" fill="${C.woodMid}" stroke="${C.soot}" stroke-width="1.6"/><ellipse cx="88" cy="86" rx="8" ry="2.6" fill="${C.woodLight}" stroke="${C.soot}" stroke-width="1.2"/>`,
  // the enemy: turned half away, the hat low, no eyes to meet
  dusman: () => `<path d="M44 118 L50 62 L74 60 L86 118 Z" fill="${C.earth}" stroke="${C.soot}" stroke-width="2"/><path d="M74 60 Q84 72 84 96" fill="none" stroke="${C.soot}" stroke-width="1.2" opacity=".6"/>
    <ellipse cx="65" cy="46" rx="10" ry="12" fill="${C.wax}" stroke="${C.soot}" stroke-width="2"/><path d="M62 54 Q67 56 70 53" fill="none" stroke="${C.soot}" stroke-width="1"/>
    <path d="M50 40 L84 36 L83 42 L51 46 Z" fill="${C.soot}"/><path d="M55 40 Q57 24 71 24 Q79 26 79 36 L55 40 Z" fill="${C.soot}"/>`,
  // the priest in black, the cross on his chest, the book in his hand
  preot: () => `<path d="M36 118 L44 58 L76 58 L84 118 Z" fill="${C.soot}"/><ellipse cx="60" cy="44" rx="11" ry="13" fill="${C.wax}" stroke="${C.soot}" stroke-width="2"/>
    <path d="M49 46 Q52 72 60 74 Q68 72 71 46 Q60 52 49 46 Z" fill="${C.lime}" stroke="${C.soot}" stroke-width="1.2"/>
    <rect x="48" y="20" width="24" height="16" fill="${C.soot}"/><path d="M48 36 H72" stroke="${C.waxDim}" stroke-width=".8"/><circle cx="56" cy="42" r="1.2" fill="${C.soot}"/><circle cx="64" cy="42" r="1.2" fill="${C.soot}"/>
    <path d="M60 78 V100 M52 86 H68" stroke="${C.gold}" stroke-width="2.6"/>
    <rect x="74" y="86" width="16" height="22" fill="${C.clot}" stroke="${C.soot}" stroke-width="1.4"/><path d="M82 88 V106" stroke="${C.gold}" stroke-width="1"/>`,
  rada: () => `<path d="M38 118 L46 44 L74 44 L82 118 Z" fill="${C.soot}"/><ellipse cx="60" cy="38" rx="11" ry="13" fill="${C.wax}" stroke="${C.soot}" stroke-width="2"/>
    <path d="M48 36 Q60 18 72 36 L72 44 L48 44 Z" fill="${C.soot}"/><circle cx="56" cy="38" r="1.3" fill="${C.soot}"/><circle cx="64" cy="38" r="1.3" fill="${C.soot}"/><path d="M57 45 Q60 47 63 45" fill="none" stroke="${C.soot}" stroke-width="1"/>
    <path d="M50 86 Q60 80 70 86 L70 92 Q60 86 50 92 Z" fill="${C.wax}" stroke="${C.soot}" stroke-width="1.2"/><path d="M34 60 Q24 90 36 118" fill="none" stroke="${C.soot}" stroke-width="2"/>`,

  // the house: a shingled gable, a wall of limewash, one window
  casa: () => `<path d="M20 74 L60 32 L100 74 Z" fill="${C.woodMid}" stroke="${C.soot}" stroke-width="2.2"/><path d="M32 62 H88 M40 54 H80 M48 46 H72 M56 38 H64" stroke="${C.soot}" stroke-width="1"/>
    <rect x="30" y="74" width="60" height="40" fill="${C.lime}" stroke="${C.soot}" stroke-width="2.2"/>
    <rect x="50" y="84" width="20" height="22" fill="${C.soot}"/><path d="M60 84 V106 M50 95 H70" stroke="${C.wax}" stroke-width="1.4"/><rect x="50" y="84" width="20" height="22" fill="none" stroke="${C.woodMid}" stroke-width="1.6"/>`,
  // the porch: three turned posts under the eave, the door in the first bay, a rail in the second
  tinda: () => `<rect x="24" y="50" width="72" height="60" fill="${C.lime}" stroke="${C.soot}" stroke-width="1.6"/><rect x="38" y="60" width="16" height="50" fill="${C.soot}"/>
    <rect x="16" y="110" width="88" height="5" fill="${C.woodMid}" stroke="${C.soot}" stroke-width="1.4"/>
    <rect x="28" y="52" width="7" height="58" fill="${C.woodLight}" stroke="${C.soot}" stroke-width="1.6"/><rect x="56" y="52" width="7" height="58" fill="${C.woodLight}" stroke="${C.soot}" stroke-width="1.6"/><rect x="84" y="52" width="7" height="58" fill="${C.woodLight}" stroke="${C.soot}" stroke-width="1.6"/>
    <ellipse cx="31.5" cy="68" rx="5" ry="3" fill="${C.woodLight}" stroke="${C.soot}" stroke-width="1.2"/><ellipse cx="59.5" cy="68" rx="5" ry="3" fill="${C.woodLight}" stroke="${C.soot}" stroke-width="1.2"/><ellipse cx="87.5" cy="68" rx="5" ry="3" fill="${C.woodLight}" stroke="${C.soot}" stroke-width="1.2"/>
    <rect x="62" y="90" width="23" height="4" fill="${C.woodMid}" stroke="${C.soot}" stroke-width="1.2"/>
    <path d="M14 52 L60 34 L106 52 Z" fill="${C.woodMid}" stroke="${C.soot}" stroke-width="2"/><rect x="16" y="50" width="88" height="6" fill="${C.woodMid}" stroke="${C.soot}" stroke-width="1.6"/>`,
  // the yard: the gate with its little roof and rosette, the well with its sweep
  curte: () => `<path d="M12 58 L36 44 L60 58 Z" fill="${C.woodMid}" stroke="${C.soot}" stroke-width="2"/>${rosette(36, 52, 5, C.soot, C.woodMid)}
    <rect x="16" y="58" width="7" height="56" fill="${C.woodLight}" stroke="${C.soot}" stroke-width="1.6"/><rect x="49" y="58" width="7" height="56" fill="${C.woodLight}" stroke="${C.soot}" stroke-width="1.6"/>
    <rect x="23" y="64" width="26" height="4" fill="${C.woodMid}" stroke="${C.soot}" stroke-width="1.2"/><path d="M28 70 V110 M36 70 V110 M44 70 V110" stroke="${C.woodLight}" stroke-width="2.4"/><path d="M24 90 H48" stroke="${C.woodMid}" stroke-width="2.4"/>
    <path d="M80 92 V40" stroke="${C.soot}" stroke-width="2.6"/><path d="M62 30 L104 50" stroke="${C.soot}" stroke-width="2.2"/><path d="M66 32 V62" stroke="${C.woodLight}" stroke-width="1.4"/><rect x="62" y="62" width="8" height="8" fill="${C.woodMid}" stroke="${C.soot}" stroke-width="1.2"/>
    <rect x="68" y="88" width="30" height="26" fill="${C.woodMid}" stroke="${C.soot}" stroke-width="2"/><path d="M72 96 H94 M72 104 H94" stroke="${C.soot}" stroke-width=".8" opacity=".5"/>`,
  // the village: a row of roofs, back to front
  sat: () => `<path d="M86 92 L98 72 L110 92 Z" fill="${C.woodMid}" stroke="${C.soot}" stroke-width="2"/><rect x="89" y="92" width="18" height="22" fill="${C.lime}" stroke="${C.soot}" stroke-width="2"/>
    <path d="M10 98 L24 78 L38 98 Z" fill="${C.woodMid}" stroke="${C.soot}" stroke-width="2"/><rect x="13" y="98" width="22" height="16" fill="${C.lime}" stroke="${C.soot}" stroke-width="2"/>
    <path d="M30 90 L50 60 L70 90 Z" fill="${C.woodMid}" stroke="${C.soot}" stroke-width="2"/><rect x="34" y="90" width="32" height="24" fill="${C.lime}" stroke="${C.soot}" stroke-width="2"/><rect x="46" y="98" width="8" height="8" fill="${C.soot}"/>
    <path d="M62 100 L80 78 L98 100 Z" fill="${C.woodMid}" stroke="${C.soot}" stroke-width="2"/><rect x="66" y="100" width="28" height="14" fill="${C.lime}" stroke="${C.soot}" stroke-width="2"/>`,
  // the church: the nave, the tower with its spire and cross, the arched door
  biserica: () => `<path d="M38 80 L70 60 L102 80 Z" fill="${C.woodMid}" stroke="${C.soot}" stroke-width="2"/><rect x="42" y="80" width="56" height="34" fill="${C.lime}" stroke="${C.soot}" stroke-width="2"/>
    <path d="M78 114 V100 Q85 90 92 100 V114 Z" fill="${C.soot}"/><rect x="54" y="92" width="6" height="12" fill="${C.soot}"/>
    <rect x="26" y="66" width="20" height="48" fill="${C.lime}" stroke="${C.soot}" stroke-width="2"/><path d="M22 66 L36 26 L50 66 Z" fill="${C.woodMid}" stroke="${C.soot}" stroke-width="2"/><path d="M36 26 V16 M31 20 H41" stroke="${C.soot}" stroke-width="2"/>
    <rect x="33" y="78" width="6" height="12" fill="${C.soot}"/>`,

  pisica: () => `<ellipse cx="60" cy="88" rx="30" ry="14" fill="${C.soot}"/><circle cx="34" cy="78" r="11" fill="${C.soot}"/><path d="M26 70 l-2 -10 l8 6 M40 68 l2 -10 l-8 6" fill="${C.soot}"/><path d="M88 86 q14 -10 6 -24" fill="none" stroke="${C.soot}" stroke-width="5" stroke-linecap="round"/><circle cx="30" cy="77" r="1.5" fill="${C.gold}"/><circle cx="37" cy="77" r="1.5" fill="${C.gold}"/>`,
  // the wake game's mask: a bearded face of cloth, eye holes, a stitched mouth, a patch of old red
  masca: () => `<path d="M34 40 Q60 26 86 40 L90 82 Q60 100 30 82 Z" fill="${C.linen}" stroke="${C.soot}" stroke-width="2.2"/><path d="M60 30 V40 M44 36 l-2 8 M76 36 l2 8" stroke="${C.soot}" stroke-width="1" opacity=".6"/>
    <ellipse cx="49" cy="58" rx="5" ry="4" fill="${C.soot}"/><ellipse cx="71" cy="58" rx="5" ry="4" fill="${C.soot}"/><path d="M60 60 L57 70 H63" fill="none" stroke="${C.soot}" stroke-width="1.2"/><path d="M48 78 Q60 84 72 78" fill="none" stroke="${C.soot}" stroke-width="1.4" stroke-dasharray="3 2"/>
    <rect x="74" y="44" width="10" height="8" fill="${C.clot}" stroke="${C.soot}" stroke-width="1"/>
    <path d="M40 88 L36 112 M48 91 L46 114 M56 93 L56 115 M64 93 L66 114 M72 91 L76 112 M80 88 L84 108" stroke="${C.woodMid}" stroke-width="2.4" stroke-linecap="round"/>`,
  // the only blue in the demo: one Voronet thread, the Bride's wreath
  cununie: () => `<circle cx="60" cy="72" r="30" fill="none" stroke="${C.gold}" stroke-width="7"/><circle cx="60" cy="72" r="30" fill="none" stroke="${C.soot}" stroke-width="1.2"/><circle cx="60" cy="72" r="23" fill="none" stroke="${C.soot}" stroke-width="1.2"/>${[0, 45, 90, 135, 180, 225, 270, 315].map(ring).join('')}<path d="M60 102 l-3 14 M60 102 l3 14" stroke="${C.voronet}" stroke-width="2.4"/><path d="M57 116 q3 3 6 0" fill="none" stroke="${C.voronet}" stroke-width="2"/>`,
};
