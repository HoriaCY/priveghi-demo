// Every Romanian string the demo may show, and nothing else Romanian: the list is the demo addendum
// v3's §4 (which replaced the brief's §9), closed, plus three kept by ruling (RULINGS R62: the day
// ordinals, Sat, Dezlegare) and the line of a save kept aside (R145). All are [RO-draft] for the
// director's review. Names take no definite article; a line that carries the article is marked
// [register: ceremony] (DECISIONS 2026-10-12); a genitive head keeps its article because the grammar
// requires it (Dorul mamei). Verb labels are second-person imperatives, shown in capitals on the
// niches (DECISIONS 2026-10-13).
// scripts/check-strings.mjs fails the build if a Romanian string appears anywhere else in src/.

import type { Ending, Fel, Grade, Loc, Lucru, Om, Verb } from './engine';

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

/** The boot line: the candle is lit at your head. */
export const BROUGHT_HOME = d('Te-au adus acasă.', 'They brought you home.');

export const YOU = d('Cel Nenuntit', 'the one who died unwed: you');

/** Niche labels, the second person singular imperative (ruled 2026-10-13); BANTUIE over UMBLA (ruled 2026-10-14). */
export const NICHE: Record<Verb, Ro> = {
  odihneste: d('Odihnește-te', 'lie back: the night passes, dawn comes'),
  bantuie: d('Bântuie', 'haunt: go about a place (the dead do not walk)'),
  asculta: d('Ascultă', 'listen: a fragment of what they say of you'),
  urneste: d('Urnește', 'shift a thing: the knock'),
  sopteste: d('Șoptește', 'whisper into a sleep: the dream'),
  arata: d('Arată-te', 'show yourself: the apparition'),
};

/** The card-borne verbs: the candle's flame, the dark door. */
export const STINGE = d('Stinge', 'blow it out: the night begins now');
export const TRECI = d('Treci', 'pass: your card on the door, when the Bride stands in it');

export const PERSON: Record<Om, Ro> = {
  mama: d('Mama', 'the mother (the form of address, ruled 2026-10-14)'),
  draguta: d('Drăguță', 'the betrothed (ruled over Logodnică, 2026-10-14)'),
  frate: d('Frate de cruce', "the sworn brother (never Fârtatul, the Maker's name)"),
  dusman: d('Dușman', 'the enemy (never Vrăjmașul, the church-register Enemy)'),
  preot: d('Preot', 'the priest'),
  rada: d('Rada', 'Rada, the village mourner'),
};

/** A Dor is named by its sender; the genitive head keeps its article (DECISIONS 2026-10-12). */
export const DOR: Record<Exclude<Om, 'rada'>, Ro> = {
  mama: d('Dorul mamei', "the mother's longing", { note: 'genitive head: the article is grammar' }),
  draguta: d('Dorul drăguței', "the betrothed's longing", { note: 'genitive head' }),
  frate: d('Dorul fratelui', "the sworn brother's longing", { note: 'genitive head' }),
  dusman: d('Dorul dușmanului', "the enemy's longing", { note: 'genitive head' }),
  preot: d('Dorul preotului', "the priest's longing", { note: 'genitive head' }),
};
export const FIR_DE_DOR = d('Fir de dor', 'a thread of longing (the card class)');

/** The five kinds, on the hem. */
export const FEL: Record<Fel, Ro> = {
  neam: d('neam', 'kin'),
  dragoste: d('dragoste', 'love'),
  frate: d('frate', "the sworn brother's bond"),
  vrajba: d('vrajbă', 'enmity'),
  rugaciune: d('rugăciune', 'prayer'),
};

export const THING: Record<Lucru, Ro> = {
  cana: d('Cană', 'his cup'),
  broboada: d('Broboadă', 'the mourning kerchief'),
  inel: d('Inel', 'the ring'),
  icoana: d('Icoană', 'the icon'),
  oglinda: d('Oglindă', 'the mirror, covered for the vigil'),
  cutit: d('Cuțit', 'the knife'),
  fluier: d('Fluier', 'the flute'),
  arc: d('Arc', "your bow, nobody's now"),
  pomana: d('pomană de vis', 'the thing a dream left at dawn'),
};

export const PLACE: Record<Loc, Ro> = {
  casa: d('Casă', 'the house'),
  tinda: d('Tindă', 'the porch'),
  curte: d('Curte', 'the yard'),
  sat: d('Sat', 'the village (a name since DECISIONS 2026-10-12; kept by R62)'),
  biserica: d('Biserică', 'the church'),
};

/** Your card after the burial, and what the church holds. */
export const CRUCE = d('Cruce', 'the wooden cross at the grave');
export const POMELNIC = d('Pomelnic', 'the list of names the priest reads');

/** What a Dor becomes, by strength; the fragment; the Minune's card; the name. */
export const AMINTIRE: Record<0 | 1 | 2 | 3, Ro> = {
  0: d('Amintire ștearsă', 'a faded memory'),
  1: d('Amintire', 'a memory'),
  2: d('Amintire vie', 'a living memory'),
  3: d('Minune', 'a small wonder'),
};
export const FRANTURA = d('Frântură', 'a fragment of what they say of you');
export const SEMN = d('Semn', "the sign the village tells (a Minune's card)");
export const NUME = d('Nume', 'a name (three fragments braided; not in the demo)');

/** The counters, named on the page and the strip; never a bar. */
export const UITARE = d('Uitare', 'oblivion: the count on your own card');
export const SPAIMA = d('Spaimă', "fright: the village's fear of the house");
export const PUTERE = d('Putere', "strength: the dead's one stat");
export const POMENIRE = d('Pomenire', 'being named by the living');
export const PREVESTIRE = d('prevestire', 'the forecast: Uitare at the next three dawns');

/** The plays and the skip. */
export const PLAY = {
  bocanit: d('Bocănit', 'the knock'),
  vis: d('Vis', 'the dream'),
  umbra: d('Umbră', 'the shadow (not shipped: ARATĂ-TE resolves as the skip, R64)'),
};
export const SKIP = d('Sari peste', 'skip (the cat takes the blame)');
export const CAT = d('Pisica.', 'The cat.');
export const GRADE: Record<Exclude<Grade, 'skipped'>, Ro> = {
  slab: d('Slab', 'weak'),
  bun: d('Bun', 'good'),
  minunat: d('Minunat', 'wonderful'),
};

export const SOROC = d('Soroc', 'a memorial day: the 3rd, the 9th');

export const LINES = {
  noColiva: d('Nimeni n-a făcut colivă.', 'Nobody made colivă (the memorial was skipped).'),
  candleOut: d('S-a stins lumânarea.', 'The candle went out (the night begins).'),
  darkDawn: d('Azi nu a aprins nimeni lumânarea.', 'Today nobody lit the candle.'),
  hunter: d('Vânătorul.', 'The Hunter.', { register: '[register: ceremony]', note: 'a sentence pronounced: the one who comes for you, named' }),
  priest: d('Preotul a venit cu apă sfințită.', 'The priest came with holy water.', { register: '[register: ceremony]', note: 'the rite begins: the subject of a sentence' }),
  /** Said once, after the boot's line, when the save on this device could not be read and was kept aside (R145). */
  keptAside: d('Priveghiul acela e din altă vreme.', 'That wake is from another time: a save this build cannot read, kept aside; a new wake begins.', { note: 'the demonstrative after the noun requires the article: grammar, not a title' }),
};

/** The five endings, as the page titles them; the Uitare ending says nothing. */
export const ENDING: Record<Ending, Ro> = {
  nunta: d('Nuntă', 'the wedding: you were remembered enough to be let go'),
  ratacire: d('Rătăcire', 'wandering: the door did not take you, or you would not go'),
  uitare: d('Uitare', 'gone (the page says nothing; the table fades)'),
  tarus: d('Țăruș', 'the stake: the Hunter'),
  dezlegare: d('Dezlegare', "the priest's third service (chapter §15; kept by R62)"),
};

/** The day counter on the tag and the page (kept by R62). Ordinals need the articulated noun: grammar, not a title. */
export const DAYS: Ro[] = [
  'Ziua întâi', 'Ziua a doua', 'Ziua a treia', 'Ziua a patra', 'Ziua a cincea',
  'Ziua a șasea', 'Ziua a șaptea', 'Ziua a opta', 'Ziua a noua',
].map((ro, i) => d(ro, `day ${i + 1}`, { register: '[register: ceremony]', note: 'the ordinal construction requires the article' }));

/**
 * The diacritics test string (ASSET_GUIDE §1.3), required by the brief in a hidden element.
 * Never shown to the player.
 */
export const TYPE_TEST = '„Osândă, șchiopătând prin țară: Ăă Ââ Îî Șș Țț”';
