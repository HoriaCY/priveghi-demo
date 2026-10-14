// Every Romanian string the demo may show, and nothing else Romanian: the list is the demo brief's
// §9, closed. All are [RO-draft] for the director's review. Names take no definite article; a line
// that carries the article is marked [register: ceremony] (DECISIONS 2026-10-12, second ruling).
// Verb labels are second-person imperatives, shown in capitals on the niches (DECISIONS 2026-10-13).
// scripts/check-strings.mjs fails the build if a Romanian string appears anywhere else in src/.

import type { Kind, Niche } from './engine';

export interface Ro {
  ro: string;
  gloss: string;
  /** Every string is a draft until the director marks it. */
  draft: '[RO-draft]';
  register?: '[register: ceremony]';
  note?: string;
}

const d = (ro: string, gloss: string, extra: Partial<Ro> = {}): Ro => ({ ro, gloss, draft: '[RO-draft]', ...extra });

export const TITLE = d('Priveghi', 'the wake (the vigil kept beside the dead)');

/** Niche labels with the short English gloss the prototype shows under each. */
export const NICHE: Record<Niche, Ro> = {
  troita: d('Închină-te', 'pray · rest'),
  umbla: d('Umblă', 'wander'),
  asculta: d('Ascultă', 'listen'),
  descanta: d('Descântă', 'speak a charm'),
  boci: d('Bocește', 'mourn'),
  gazdui: d('Găzduiește', 'host'),
};

export const CANDLE = d('Lumânare', 'candle (the table candle, a verb)');
export const TROITA = d('Troiță', 'wayside cross (the roofed niche)');

export const CARD: Record<Kind, Ro> = {
  rada: d('Rada', 'Rada, the village mourner'),
  negustor: d('Negustor', 'peddler'),
  cel_nenuntit: d('Cel Nenuntit', 'the one who died unwed'),
  codrii_vlasiei: d('Codrii Vlăsiei', 'the Vlăsia woods (toponym, standard form)'),
  plosca: d('Ploscă cu apă vie', 'flask of living water'),
  lumanare: d('Lumânare de ceară', 'beeswax candle'),
  sare: d('Sare', 'salt'),
  fier: d('Fier de baltă', 'bog iron'),
  grau: d('Grâu', 'wheat'),
  coliva: d('Colivă', 'memorial wheat'),
  fir_de_dor: d('Fir de dor', 'a thread of longing'),
  cantec_de_leagan: d('Cântec de leagăn', 'lullaby'),
  nume: d('Nume', 'a name'),
  bocet: d('Bocet', 'a lament'),
  jale: d('Jale', 'grief'),
  binecuvantare: d('Binecuvântare', 'blessing (one day)'),
};

/** Rada's role, from "Rada (bocitoare)": the lore line calls her so. */
export const BOCITOARE = d('bocitoare', 'a woman who keens for the dead');
export const FRANT = d('Frânt', 'broken (the lock at three Jale)');
export const POMELNIC = d('Pomelnic', 'the list of names remembered');
export const CUNUNIE = d('Cununie', 'the wedding wreath (the Bride\'s)');

/** The day counter on the page. Ordinals need the articulated noun: grammar, not a title. */
export const DAYS: Ro[] = [
  'Ziua întâi', 'Ziua a doua', 'Ziua a treia', 'Ziua a patra', 'Ziua a cincea',
  'Ziua a șasea', 'Ziua a șaptea', 'Ziua a opta', 'Ziua a noua',
].map((ro, i) => d(ro, `day ${i + 1}`, { register: '[register: ceremony]', note: 'the ordinal construction requires the article' }));

export const LINES = {
  deadLeave: d('Se spune că morții nu lasă bani. Lasă ce n-au apucat să ducă.', 'They say the dead leave no money. They leave what they did not get to carry.', { register: '[register: ceremony]' }),
  nothingLies: d('Aici nu minte nimic.', 'Nothing lies here.'),
  unmourned: d('Dorul nebocit se face jale.', 'Longing left unmourned turns to grief.', { register: '[register: ceremony]', note: 'article on a sentence subject' }),
  countAgain: d('Numără din nou.', 'Count again.'),
  wakeKept: d('S-a ținut priveghiul.', 'The wake was kept.', { register: '[register: ceremony]' }),
  sheComes: d('Vine la cel ce priveghează.', 'She comes to the one who keeps the vigil.'),
  notYet: d('Nu încă.', 'Not yet.'),
  sabbathWater: d('S-a dus pe Apa Sâmbetei.', 'It went down the Sabbath Water (it is lost).'),
  doesNotFit: d('Nu se potrivește aici.', 'It does not fit here.'),
};

/**
 * The diacritics test string (ASSET_GUIDE §1.3), required by the brief in a hidden element.
 * Never shown to the player.
 */
export const TYPE_TEST = '„Osândă, șchiopătând prin țară: Ăă Ââ Îî Șș Țț”';
