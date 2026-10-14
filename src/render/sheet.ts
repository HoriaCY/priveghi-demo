// All card faces on one sheet, for review and for briefing an artist. Not part of the game.
import type { Kind } from '../engine';
import { CARD, CUNUNIE } from '../strings';
import { cardSVG } from './card';
import { LOOK } from './catalog';
import { C } from './palette';

const ORDER: Kind[] = [
  'rada', 'negustor', 'cel_nenuntit', 'codrii_vlasiei', 'plosca', 'lumanare', 'sare', 'fier', 'grau', 'coliva',
  'fir_de_dor', 'cantec_de_leagan', 'nume', 'bocet', 'jale', 'binecuvantare',
];

export function cardSheet(): HTMLElement {
  const sheet = document.createElement('div');
  sheet.className = 'sheet';
  const faces = ORDER.map((k) => cardSVG({ uid: `sheet-${k}`, name: CARD[k].ro, ...LOOK[k] }));
  faces.push(cardSVG({ uid: 'sheet-cununie', name: CUNUNIE.ro, art: 'cununie', hem: 'brad', ground: C.lime }));
  sheet.innerHTML = faces.map((f) => `<div class="sheet-card">${f}</div>`).join('');
  return sheet;
}
