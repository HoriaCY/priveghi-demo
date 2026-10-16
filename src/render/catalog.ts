// How each card looks and what it is called, read off the engine's card alone (brief §2.7 grounds;
// the charter §3 hems by kind; R63 Uitare's grammar on your card). Nothing here decides a rule:
// Uitare, owners, kinds and places are read, never computed.
import type { Card, Fel, Om } from '../engine';
import { CRUCE, DOR, FIR_DE_DOR, FRANTURA, PERSON, PLACE, SEMN, THING, YOU } from '../strings';
import type { ArtId } from './art';
import { cardSVG, type Hem } from './card';
import { C } from './palette';

export interface Look {
  art: ArtId;
  hem: Hem;
  ground: string;
  hemInk?: string;
  ownerChip?: Hem;
  thin?: number;
}

/** The five kinds on the hem: kin the tree of life, love the knot, the bond the cord, enmity the tooth, prayer the cross. */
export function hemOfFel(fel: Fel): Hem {
  switch (fel) {
    case 'neam': return 'pom';
    case 'dragoste': return 'romb';
    case 'frate': return 'funia';
    case 'vrajba': return 'colt';
    case 'rugaciune': return 'cruce';
  }
}

/** Each sender's own kind, their first affinity (the engine's model.rs); Rada keens and has none. */
const OWN_FEL: Record<Exclude<Om, 'rada'>, Fel> = { mama: 'neam', draguta: 'dragoste', frate: 'frate', dusman: 'vrajba', preot: 'rugaciune' };

/** A person's own motif: the hem of their first affinity; Rada's the wheat-ear (`spic`, R75). */
export function hemOfOm(om: Om): Hem {
  return om === 'rada' ? 'spic' : hemOfFel(OWN_FEL[om]);
}

/** The same, read off the person's card in the state when it is there (the engine's affinities rule). */
export function hemOfPerson(cards: Card[], om: Om): Hem {
  const card = cards.find((c) => c.kind === 'om' && c.om === om);
  const first = card?.kind === 'om' ? card.fel[0] : undefined;
  return first ? hemOfFel(first) : hemOfOm(om);
}

/** R63: the knot of the wedding you did not have, breaking as Uitare climbs. */
function hemOfUitare(uitare: number): Hem {
  if (uitare >= 8) return 'funia-frayed';
  if (uitare >= 6) return 'ochiul-deschis';
  if (uitare >= 4) return 'romb-frant';
  return 'romb';
}

export function lookOf(card: Card, uitare: number): Look {
  switch (card.kind) {
    case 'cel_nenuntit':
      return {
        art: card.at === 'cimitir' ? 'cruce' : 'mort',
        hem: hemOfUitare(uitare),
        ground: C.wax,
        thin: (uitare >= 2 ? 1 : 0) + (uitare >= 4 ? 1 : 0) + (uitare >= 6 ? 1 : 0) + (uitare >= 8 ? 1 : 0),
      };
    case 'dor':
      return { art: 'dor', hem: hemOfFel(card.fel), ground: C.paperSoot };
    case 'lucru': {
      // a thing's hem is its first affinity's (a pomana carries the dream's kind); a thing with none (none
      // today: the bow is vrajba's, as the simulator has it) wears the star, which no kind owns
      const first = card.fel[0];
      return {
        art: card.lucru,
        hem: first ? hemOfFel(first) : 'stea',
        ground: C.lime,
        ownerChip: card.owner ? hemOfOm(card.owner) : undefined,
      };
    }
    case 'om': {
      const first = card.fel[0];
      return { art: card.om, hem: first ? hemOfFel(first) : hemOfOm(card.om), ground: C.wax };
    }
    case 'loc':
      return { art: card.loc, hem: hemOfFel(card.fel), ground: C.earth, hemInk: C.waxDim };
    case 'frantura':
      return { art: 'frantura', hem: 'meandru', ground: C.paperSoot };
    case 'semn':
      return { art: 'semn', hem: 'stea', ground: C.paperSoot };
  }
}

/** The name on the band, from src/strings.ts alone. */
export function nameOf(card: Card): string {
  switch (card.kind) {
    case 'cel_nenuntit': return (card.at === 'cimitir' ? CRUCE : YOU).ro;
    // the engine sends no Dor from Rada; the class name stands in should one ever come
    case 'dor': return card.from === 'rada' ? FIR_DE_DOR.ro : DOR[card.from].ro;
    case 'lucru': return THING[card.lucru].ro;
    case 'om': return PERSON[card.om].ro;
    case 'loc': return PLACE[card.loc].ro;
    case 'frantura': return FRANTURA.ro;
    case 'semn': return SEMN.ro;
  }
}

/** Whose a card is, as the engine counts the match's second point: a thing's owner, a person their own. */
export function ownerOf(card: Card): Om | null {
  switch (card.kind) {
    case 'lucru': return card.owner;
    case 'om': return card.om;
    default: return null;
  }
}

export function ownerName(card: Card): string {
  const om = ownerOf(card);
  return om ? PERSON[om].ro : '';
}

/** The card's face: look and name from the card, Uitare's grammar on your own. */
export function faceSVG(uid: string, card: Card, uitare: number): string {
  return cardSVG({ uid, name: nameOf(card), ...lookOf(card, uitare) });
}
