// How each card kind looks. Class by ground value (brief §2.7); one motif at the hem. Hems the
// brief names are used as named (§3.4); the rest come from the rack's meanings (RULINGS.md R11).
import type { Kind } from '../engine';
import type { ArtId } from './art';
import type { Hem } from './card';
import { C } from './palette';

export interface Look {
  art: ArtId;
  hem: Hem;
  ground: string;
  hemInk?: string;
}

const PERSON = C.wax;
const PLACE = C.earth;
const OBJECT = C.lime;
const KNOWLEDGE = C.paperSoot;

export const LOOK: Record<Kind, Look> = {
  rada: { art: 'rada', hem: 'spic', ground: PERSON },
  negustor: { art: 'negustor', hem: 'colt', ground: PERSON },
  cel_nenuntit: { art: 'nenuntit', hem: 'brad', ground: PERSON },
  codrii_vlasiei: { art: 'codrii', hem: 'colt', ground: PLACE },
  plosca: { art: 'plosca', hem: 'romb', ground: OBJECT },
  lumanare: { art: 'lumanare', hem: 'cruce', ground: OBJECT },
  sare: { art: 'sare', hem: 'stea', ground: OBJECT },
  fier: { art: 'fier', hem: 'colt', ground: OBJECT },
  grau: { art: 'grau', hem: 'spic', ground: OBJECT },
  coliva: { art: 'coliva', hem: 'spic', ground: OBJECT },
  fir_de_dor: { art: 'dor', hem: 'meandru', ground: KNOWLEDGE },
  cantec_de_leagan: { art: 'leagan', hem: 'pom', ground: KNOWLEDGE },
  nume: { art: 'nume', hem: 'ochiul-deschis', ground: KNOWLEDGE },
  bocet: { art: 'bocet', hem: 'spic', ground: KNOWLEDGE },
  // the dark card: grief on soot, its stitches in dimmed wax
  jale: { art: 'jale', hem: 'meandru', ground: C.soot, hemInk: C.waxDim },
  binecuvantare: { art: 'binecuvantare', hem: 'cruce', ground: KNOWLEDGE },
};
