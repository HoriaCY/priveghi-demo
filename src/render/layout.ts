// One 1280x720 reference frame (brief §2.2). The prototype's bands are kept: far dark 0-96, the
// screen of verbs 118-354, the cloth 352-690. Inside the cloth: the plank at the far left, the
// kit and road row nearer the niches, the cloth row nearer the hand, Jale in the corner, the candle.
import type { Kind } from '../engine';

export const STAGE = { w: 1280, h: 720 };
export const CARD = { w: 108, h: 151 };
/** The one large light. */
export const FLAME = { x: 1030, y: 420 };

export const NICHE = { w: 150, h: 236, gap: 18, top: 118 };
const DOOR_W = 60;
const ROW_W = 6 * NICHE.w + DOOR_W + 6 * NICHE.gap;
export const nicheX = (i: number) => (STAGE.w - ROW_W) / 2 + i * (NICHE.w + NICHE.gap);
export const DOOR_X = nicheX(6);

export const PLANK = { x: 76, y: 372, w: 124, h: 296 };
export const ON_PLANK = { x: PLANK.x + 8, y: PLANK.y + 50 };
export const JALE = { x: 1096, y: 520 };

interface Row { x: number; y: number; right: number; order: Kind[] }

/** Objects and places: the kit and the road (chapter §2's rows, folded onto the cloth). */
export const ROW_KIT: Row = { x: 214, y: 376, right: 1000, order: ['codrii_vlasiei', 'plosca', 'lumanare', 'grau', 'fier', 'sare'] };
/** People, longing, knowledge and food. Coliva sits nearest the plank it is carried to. */
export const ROW_CLOTH: Row = {
  x: 214,
  y: 530,
  right: 850,
  order: ['coliva', 'rada', 'negustor', 'fir_de_dor', 'cantec_de_leagan', 'nume', 'bocet', 'binecuvantare'],
};

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
