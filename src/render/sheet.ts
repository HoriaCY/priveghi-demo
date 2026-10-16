// All card faces on one page, for review and for briefing an artist. Not part of the game: the cards
// are built by hand with plausible fields (the engine's catalogue of owners and affinities), your
// card four times along Uitare's grammar, the cat and the mask nameless (they are no card in play),
// the Bride through her door.
import type { Card, Fel, Loc, Lucru, Om } from '../engine';
import { cardSVG } from './card';
import { faceSVG } from './catalog';
import { brideSVG } from './furniture';
import { C } from './palette';

const base = (id: number, at: Card['at']) => ({ id, at, born: 1 });
const you = (at: 'plank' | 'cimitir'): Card => ({ ...base(0, at), kind: 'cel_nenuntit' });
const dor = (from: Exclude<Om, 'rada'>, fel: Fel): Card => ({ ...base(10, 'cloth'), kind: 'dor', fel, from, left: 3, tied_at: 0 });
const lucru = (lucru: Lucru, fel: Fel[], owner: Om | null): Card => ({ ...base(20, 'kit'), kind: 'lucru', lucru, fel, owner, rests_until: 0, leaves_at: 0 });
const om = (om: Om, fel: Fel[]): Card => ({ ...base(30, 'cloth'), kind: 'om', om, fel });
const loc = (loc: Loc, fel: Fel): Card => ({ ...base(40, 'road'), kind: 'loc', loc, fel });

/** [sheet id, the card, Uitare]. One of every ArtId; your card at Uitare 0, 4, 6, 8. */
const SAMPLES: Array<[string, Card, number]> = [
  ['you-0', you('plank'), 0], ['you-4', you('plank'), 4], ['you-6', you('plank'), 6], ['you-8', you('plank'), 8],
  ['cruce', you('cimitir'), 0],
  ['dor', dor('mama', 'neam'), 0],
  ['frantura', { ...base(11, 'cloth'), kind: 'frantura' }, 0],
  ['semn', { ...base(12, 'cloth'), kind: 'semn', fel: 'dragoste' }, 0],
  ['cana', lucru('cana', ['frate', 'neam'], 'frate'), 0],
  ['broboada', lucru('broboada', ['neam'], 'mama'), 0],
  ['inel', lucru('inel', ['dragoste'], 'draguta'), 0],
  ['icoana', lucru('icoana', ['rugaciune', 'neam'], 'mama'), 0],
  ['oglinda', lucru('oglinda', ['dragoste', 'vrajba'], 'draguta'), 0],
  ['cutit', lucru('cutit', ['vrajba', 'frate'], 'dusman'), 0],
  ['fluier', lucru('fluier', ['frate', 'dragoste'], 'frate'), 0],
  ['arc', lucru('arc', ['vrajba'], null), 0],
  ['pomana', lucru('pomana', ['dragoste'], 'draguta'), 0],
  ['mama', om('mama', ['neam', 'rugaciune']), 0],
  ['draguta', om('draguta', ['dragoste', 'frate']), 0],
  ['frate', om('frate', ['frate', 'dragoste']), 0],
  ['dusman', om('dusman', ['vrajba', 'neam']), 0],
  ['preot', om('preot', ['rugaciune', 'neam']), 0],
  ['rada', om('rada', []), 0],
  ['casa', loc('casa', 'neam'), 0],
  ['tinda', loc('tinda', 'frate'), 0],
  ['curte', loc('curte', 'vrajba'), 0],
  ['sat', loc('sat', 'vrajba'), 0],
  ['biserica', loc('biserica', 'rugaciune'), 0],
];

export function cardSheet(): HTMLElement {
  const sheet = document.createElement('div');
  sheet.className = 'sheet';
  const faces = SAMPLES.map(([id, card, uitare]) => faceSVG(`sheet-${id}`, card, uitare));
  // the cat and the mask play no card: faces without a name
  faces.push(cardSVG({ uid: 'sheet-pisica', name: '', art: 'pisica', hem: 'sarpe', ground: C.lime }));
  faces.push(cardSVG({ uid: 'sheet-masca', name: '', art: 'masca', hem: 'meandru', ground: C.paperSoot }));
  faces.push(brideSVG());
  sheet.innerHTML = faces.map((f) => `<div class="sheet-card">${f}</div>`).join('');
  return sheet;
}
