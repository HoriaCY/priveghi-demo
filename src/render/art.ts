// Card hearts in the icon grammar: frontal, flat fills, the bold soot contour (icoane pe sticla).
// Drawn in the card's 120x168 frame; the art lives above the hem band (y < 117).
// Lifted from priveghi_prototype_v4.html: rada, plosca, dor, leagan, negustor, bocet, nume,
// codrii, grau, cununie, sare. Drawn for the demo in the same grammar: nenuntit, lumanare, fier,
// coliva, jale, binecuvantare.
import { C } from './palette';
import { rosette } from './motifs';

export type ArtId =
  | 'rada' | 'plosca' | 'dor' | 'leagan' | 'negustor' | 'bocet' | 'nume' | 'codrii' | 'grau' | 'cununie' | 'sare'
  | 'nenuntit' | 'lumanare' | 'fier' | 'coliva' | 'jale' | 'binecuvantare';

const ring = (a: number) => {
  const r = (a * Math.PI) / 180;
  return `<circle cx="${(60 + 30 * Math.cos(r)).toFixed(1)}" cy="${(72 + 30 * Math.sin(r)).toFixed(1)}" r="4.5" fill="${C.lime}" stroke="${C.soot}" stroke-width="1.4"/>`;
};

export const ART: Record<ArtId, () => string> = {
  rada: () => `<path d="M38 118 L46 44 L74 44 L82 118 Z" fill="${C.soot}"/><ellipse cx="60" cy="38" rx="11" ry="13" fill="${C.wax}" stroke="${C.soot}" stroke-width="2"/>
    <path d="M48 36 Q60 18 72 36 L72 44 L48 44 Z" fill="${C.soot}"/><circle cx="56" cy="38" r="1.3" fill="${C.soot}"/><circle cx="64" cy="38" r="1.3" fill="${C.soot}"/><path d="M57 45 Q60 47 63 45" fill="none" stroke="${C.soot}" stroke-width="1"/>
    <path d="M50 86 Q60 80 70 86 L70 92 Q60 86 50 92 Z" fill="${C.wax}" stroke="${C.soot}" stroke-width="1.2"/><path d="M34 60 Q24 90 36 118" fill="none" stroke="${C.soot}" stroke-width="2"/>`,
  plosca: () => `<circle cx="60" cy="78" r="30" fill="${C.woodMid}" stroke="${C.soot}" stroke-width="2.4"/><circle cx="60" cy="78" r="21" fill="${C.wax}" stroke="${C.soot}" stroke-width="1.6"/>
    <rect x="53" y="30" width="14" height="22" fill="${C.woodMid}" stroke="${C.soot}" stroke-width="2"/><rect x="50" y="26" width="20" height="6" fill="${C.earth}" stroke="${C.soot}" stroke-width="1.6"/>
    <path d="M60 64 Q52 76 60 90 Q68 76 60 64 Z" fill="${C.gold}" opacity=".9"/><path d="M34 60 Q60 50 86 60" fill="none" stroke="${C.clot}" stroke-width="2"/>`,
  dor: () => `<path d="M30 100 C40 60 56 60 60 80 S74 112 84 70 S96 30 70 40" fill="none" stroke="${C.soot}" stroke-width="5" stroke-linecap="round"/><path d="M30 100 C40 60 56 60 60 80 S74 112 84 70 S96 30 70 40" fill="none" stroke="${C.lime}" stroke-width="2.4" stroke-linecap="round"/><path d="M30 100 l-4 8 M70 40 l-3 -5" stroke="${C.lime}" stroke-width="1.2"/>`,
  leagan: () => `<path d="M30 70 Q60 100 90 70 L90 86 Q60 116 30 86 Z" fill="${C.woodMid}" stroke="${C.soot}" stroke-width="2"/><path d="M26 92 Q60 124 94 92" fill="none" stroke="${C.soot}" stroke-width="2"/>
    <rect x="40" y="62" width="40" height="12" fill="${C.lime}" stroke="${C.soot}" stroke-width="1.4"/><path d="M36 40 h48 M40 46 h36 M44 52 h28" stroke="${C.soot}" stroke-width="1.4" stroke-dasharray="3 2"/>`,
  // the one wrong thing on the table: count the ox's legs twice
  negustor: () => `<rect x="44" y="60" width="52" height="30" fill="${C.woodMid}" stroke="${C.soot}" stroke-width="2"/><circle cx="56" cy="100" r="9" fill="${C.earth}" stroke="${C.soot}" stroke-width="2"/><circle cx="86" cy="100" r="9" fill="${C.earth}" stroke="${C.soot}" stroke-width="2"/>
    <path d="M44 66 L22 70 L26 86" fill="none" stroke="${C.soot}" stroke-width="2"/><ellipse cx="26" cy="86" rx="12" ry="8" fill="${C.wax}" stroke="${C.soot}" stroke-width="2"/>
    <path d="M18 94 v14 M24 94 v14 M30 94 v14 M35 93 v14 M27 94 v14" stroke="${C.soot}" stroke-width="2"/><path d="M16 80 l-4 -5 M36 80 l4 -5" stroke="${C.soot}" stroke-width="1.6"/>`,
  bocet: () => `<path d="M30 92 Q45 60 60 92 Q75 124 90 92" fill="none" stroke="${C.soot}" stroke-width="2.4"/><path d="M30 60 h60 M34 68 h52 M40 76 h40" stroke="${C.soot}" stroke-width="1.4" stroke-dasharray="4 2"/><circle cx="60" cy="44" r="4" fill="${C.soot}"/>`,
  nume: () => `<ellipse cx="60" cy="70" rx="24" ry="34" fill="${C.gold}" stroke="${C.soot}" stroke-width="2"/><ellipse cx="60" cy="70" rx="15" ry="24" fill="${C.soot}"/><path d="M40 110 h40" stroke="${C.soot}" stroke-width="1.4" stroke-dasharray="2 2"/>`,
  codrii: () => `<path d="M20 112 H100" stroke="${C.soot}" stroke-width="2"/><path d="M26 112 L26 60 M40 112 L40 48 M58 112 L58 64 M76 112 L76 44 M94 112 L94 58" stroke="${C.soot}" stroke-width="3"/><path d="M14 70 L26 40 L38 70 Z M30 62 L40 30 L50 62 Z M48 74 L58 46 L68 74 Z M64 60 L76 22 L88 60 Z M84 70 L94 42 L104 70 Z" fill="${C.wax}" stroke="${C.soot}" stroke-width="2"/>`,
  grau: () => `<path d="M48 112 L58 40 M60 112 L62 36 M72 112 L66 42" stroke="${C.soot}" stroke-width="2.2"/><path d="M58 40 l-6 -4 M58 40 l6 -4 M57 48 l-6 -4 M57 48 l6 -4 M56 56 l-6 -4 M56 56 l6 -4 M62 36 l-5 -5 M62 36 l5 -5 M62 44 l-5 -5 M62 44 l5 -5 M66 42 l-6 -4 M66 42 l6 -4 M67 50 l-6 -4 M67 50 l6 -4" stroke="${C.soot}" stroke-width="1.8" stroke-linecap="round"/><path d="M44 96 Q60 90 76 96" fill="none" stroke="${C.clot}" stroke-width="3"/>`,
  // the only blue in the demo: one Voronet thread, day nine
  cununie: () => `<circle cx="60" cy="72" r="30" fill="none" stroke="${C.gold}" stroke-width="7"/><circle cx="60" cy="72" r="30" fill="none" stroke="${C.soot}" stroke-width="1.2"/><circle cx="60" cy="72" r="23" fill="none" stroke="${C.soot}" stroke-width="1.2"/>${[0, 45, 90, 135, 180, 225, 270, 315].map(ring).join('')}<path d="M60 102 l-3 14 M60 102 l3 14" stroke="${C.voronet}" stroke-width="2.4"/><path d="M57 116 q3 3 6 0" fill="none" stroke="${C.voronet}" stroke-width="2"/>`,
  sare: () => `<path d="M40 110 L46 70 L74 70 L80 110 Z" fill="${C.woodMid}" stroke="${C.soot}" stroke-width="2"/><path d="M46 70 Q60 56 74 70" fill="${C.lime}" stroke="${C.soot}" stroke-width="1.6"/><path d="M28 118 H92" stroke="${C.lime}" stroke-width="2.6" stroke-dasharray="1 2"/>`,

  // Cel Nenuntit: the shroud from the waist down; the upper body stays undrawn (chapter §1)
  nenuntit: () => `<path d="M45 64 H75 L84 111 H36 Z" fill="${C.lime}" stroke="${C.soot}" stroke-width="2"/>
    <path d="M53 70 L49 109 M60 68 V110 M67 70 L71 109" stroke="${C.soot}" stroke-width="1" opacity=".6"/>
    <path d="M46 111 h12 v5 h-12 Z M62 111 h12 v5 h-12 Z" fill="${C.earth}" stroke="${C.soot}" stroke-width="1.2"/>`,
  // a beeswax taper from the kit, unlit
  lumanare: () => `<rect x="53" y="30" width="14" height="80" fill="${C.wax}" stroke="${C.soot}" stroke-width="2"/><rect x="54.5" y="31" width="11" height="2" fill="${C.lime}"/>
    <path d="M60 30 V21" stroke="${C.soot}" stroke-width="1.6"/><path d="M54 52 H66 M54 74 H66 M54 96 H66" stroke="${C.soot}" stroke-width="1" opacity=".35"/>
    <path d="M57 34 v10 M64 34 v6" stroke="${C.lime}" stroke-width="1.8"/>`,
  // bog iron: a rusted lump among the reeds, above the water line
  fier: () => `<path d="M30 106 L33 50 M33 66 l-6 -6 M33 80 l6 -5 M90 106 L86 44 M87 60 l6 -6 M87 76 l-6 -5" fill="none" stroke="${C.soot}" stroke-width="1.8"/>
    <path d="M40 100 L45 78 L58 67 L74 70 L84 86 L80 101 L62 106 Z" fill="${C.earth}" stroke="${C.soot}" stroke-width="2.2"/>
    <path d="M50 84 l6 -5 M64 77 l7 3 M58 96 l8 -2" stroke="${C.woodLight}" stroke-width="1.4"/>
    <circle cx="70" cy="90" r="2.4" fill="${C.clot}"/><circle cx="52" cy="92" r="1.8" fill="${C.clot}"/><circle cx="62" cy="80" r="1.4" fill="${C.clot}"/>
    <path d="M24 110 Q60 104 96 110" fill="none" stroke="${C.soot}" stroke-width="1.4"/>`,
  // coliva: boiled wheat heaped under sugar, a cross on it, a small candle stuck in, on a wooden dish
  coliva: () => `<path d="M28 96 Q60 50 92 96 Z" fill="${C.lime}" stroke="${C.soot}" stroke-width="2"/>
    <path d="M60 79 V94 M51 86 H69" stroke="${C.soot}" stroke-width="2.4"/>
    <rect x="57" y="54" width="6" height="20" fill="${C.wax}" stroke="${C.soot}" stroke-width="1.4"/><path d="M60 54 V47" stroke="${C.soot}" stroke-width="1.3"/>
    <path d="M34 92 h4 M44 94 h3 M76 94 h3 M84 92 h3" stroke="${C.waxDim}" stroke-width="2" stroke-linecap="round"/>
    <path d="M22 96 H98 L92 106 H28 Z" fill="${C.woodMid}" stroke="${C.soot}" stroke-width="2"/>`,
  // jale: the wheat nobody mourned, a bare stalk bent head-down, its grains on the ground
  jale: () => `<path d="M58 112 V62 Q58 40 74 50 L76 61" fill="none" stroke="${C.waxDim}" stroke-width="2.4"/>
    <path d="M58 92 L50 84 M58 78 L66 70" stroke="${C.waxDim}" stroke-width="1.8"/>
    <ellipse cx="44" cy="113" rx="2.6" ry="1.6" fill="${C.waxDim}"/><ellipse cx="70" cy="114" rx="2.6" ry="1.6" fill="${C.waxDim}"/><ellipse cx="80" cy="112" rx="2.6" ry="1.6" fill="${C.waxDim}"/>`,
  // binecuvantare: the solar rosette of the holy on flat smoked gold
  binecuvantare: () => `<circle cx="60" cy="68" r="28" fill="${C.gold}" stroke="${C.soot}" stroke-width="2"/>${rosette(60, 68, 20, C.soot)}<path d="M40 108 h40" stroke="${C.soot}" stroke-width="1.4" stroke-dasharray="2 2"/>`,
};
