// One 1280x720 reference frame (brief §2.2) on the v3 layout (RULINGS R61): far dark 0-96, the
// screen of verbs 118-354, the cloth 352-690. Inside the cloth: the plank at the far left with your
// card, the five tally bands and the forecast tag under it; the cloth row (Dor, fragments, the Semn,
// the living); the kit row (the things, then the road); the candle at the cloth's head.
export const STAGE = { w: 1280, h: 720 };
export const CARD = { w: 108, h: 151 };

export const NICHE = { w: 150, h: 236, gap: 18, top: 118 };
const DOOR_W = 60;
const ROW_W = 6 * NICHE.w + DOOR_W + 6 * NICHE.gap;
export const nicheX = (i: number) => (STAGE.w - ROW_W) / 2 + i * (NICHE.w + NICHE.gap);
export const DOOR_X = nicheX(6);
/** Where a niche seats the open commit: the Dor in the heart seat, its target in the side seat (prototype R10). */
export const SEAT = { x: 21, y: 40 };
export const SIDE = { x: 83, y: 45, w: 45, h: 63 };
/** The troita's sill: three tied Dor stand on its ledge. */
export const SILL = { x: 30, y: 146, w: 30, h: 42, gap: 4 };

export const PLANK = { x: 76, y: 372, w: 124, h: 296 };
/** Your card on the plank (the cross, after the burial). */
export const YOU_AT = { x: 84, y: 392 };
/** Five tally bands under your card, one per source in order mama, draguta, frate, dusman, preot. */
export const TALLY = { x: 84, y: 552, w: 108, h: 12, gap: 16 };
/** The forecast tag: now, then Uitare at the next three dawns. */
export const FORECAST = { x: 80, y: 636, w: 116, h: 28 };

/** The table candle's box at the cloth's right edge (R92); its SVG (24x80) is fitted to the width and centred. */
export const CANDLE = { x: 1156, y: 410, w: 40, h: 150 };
/** STINGE, under the candle, inside the linen (its ink is the cloth border's colour). */
export const CANDLE_LABEL = { x: 1136, y: 563, w: 80 };
/** The flame's tap target: a 90 px disc, 44 CSS px or more at the phone's scale. */
export const FLAME_HIT = 90;
/** Putere as wax drops under the candle's label. */
export const PUTERE = { x: 1144, y: 584, w: 64, h: 14 };
/** Bread and salt (R13), in the corner by the candle. */
export const STILL_LIFE = { x: 1040, y: 575, w: 180, h: 120 };
/** The soroc dishes, one per memorial day, on the far side band's left: the living set the meal on their side of the table (step 4), right of the day tag's thumb area. */
export const SOROACE = { x: 196, y: 36, w: 44, h: 36, gap: 10 };

/** The one large light: the candle's flame, lower as the wax burns (candleSVG's geometry). */
export function flameAt(frac: number): { x: number; y: number } {
  const k = CANDLE.w / 24;
  const dy = (CANDLE.h - 80 * k) / 2;
  const top = 70 - Math.max(4, 60 * frac);
  return { x: CANDLE.x + 12 * k, y: CANDLE.y + dy + (top - 7) * k };
}
export const FLAME = flameAt(1);

export interface Row { x: number; y: number; right: number }

/** The cloth row: the Dor stacks, the fragments, the Semn, then the living present at the right end. */
export const ROW_CLOTH: Row = { x: 214, y: 376, right: 1020 };
/** The kit row: the things ready, the pile of resting things, then the places on the road (R91). */
export const ROW_KIT: Row = { x: 214, y: 530, right: 955 };

/** Left edges for n stacks in a row: full spacing while they fit, then they overlap like a spread hand. */
export function rowSlots(row: Row, n: number): number[] {
  const pitch = n <= 1 ? 0 : Math.min(CARD.w + 4, (row.right - row.x - CARD.w) / (n - 1));
  return Array.from({ length: n }, (_, i) => row.x + i * pitch);
}

/** Shadows fall away from the flame; cards nearer it are warmer (prototype's shadowFor). */
export function shadowFor(x: number, y: number): { sx: number; sy: number; warm: number } {
  const dx = x + CARD.w / 2 - FLAME.x;
  const dy = y + CARD.h / 2 - FLAME.y;
  const d = Math.hypot(dx, dy) || 1;
  return { sx: (dx / d) * 4, sy: (dy / d) * 5 + 2, warm: Math.max(0.78, Math.min(1.08, 1.1 - d / 900)) };
}
