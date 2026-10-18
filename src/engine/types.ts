// Mirrors crates/priveghi-engine/src/v3/model.rs (serde's JSON shapes) for the dead's wake. The
// engine owns every rule; these types only let the renderer read what it is given.

/** The five kinds of longing, each a bond with one of the living (chapter §4). */
export type Fel = 'neam' | 'dragoste' | 'frate' | 'vrajba' | 'rugaciune';
export const FELS: Fel[] = ['neam', 'dragoste', 'frate', 'vrajba', 'rugaciune'];

/** The living at the table. The first five send Dor; Rada keens and is listened to. */
export type Om = 'mama' | 'draguta' | 'frate' | 'dusman' | 'preot' | 'rada';
export const OAMENI: Om[] = ['mama', 'draguta', 'frate', 'dusman', 'preot', 'rada'];
export const SOURCES: Om[] = ['mama', 'draguta', 'frate', 'dusman', 'preot'];

/** The house's things and the finds; a pomana is the thing a Minunat dream leaves. */
export type Lucru = 'cana' | 'broboada' | 'inel' | 'icoana' | 'oglinda' | 'cutit' | 'fluier' | 'arc' | 'pomana';

/** Where the dead can go: the house by day, the village by night from the burial on. */
export type Loc = 'casa' | 'tinda' | 'curte' | 'sat' | 'biserica';

/** The screen of verbs: the troita niche and the five, in slot order. */
export type Verb = 'odihneste' | 'bantuie' | 'asculta' | 'urneste' | 'sopteste' | 'arata';
export const VERBS: Verb[] = ['odihneste', 'bantuie', 'asculta', 'urneste', 'sopteste', 'arata'];

export type Where = 'plank' | 'cloth' | 'kit' | 'road' | 'sill' | { niche: Verb } | 'cimitir' | 'away';

export type Kind =
  /** Your own card: your body under the sheet; Uitare is drawn on it. */
  | { kind: 'cel_nenuntit' }
  /** A living person's longing for you: its kind on the hem, its sender in its name, its stub in days. */
  | { kind: 'dor'; fel: Fel; from: Om; left: number; tied_at: number }
  /** A thing of the house: its affinities, its owner; it rests after use (`rests_until` is a day) and is never spent. */
  | { kind: 'lucru'; lucru: Lucru; fel: Fel[]; owner: Om | null; rests_until: number; leaves_at: number }
  | { kind: 'om'; om: Om; fel: Fel[] }
  | { kind: 'loc'; loc: Loc; fel: Fel }
  /** A fragment of what they say of you: of every kind and nobody's. */
  | { kind: 'frantura' }
  /** A Minune stays on the cloth as a card. Its one use is M0b T5. */
  | { kind: 'semn'; fel: Fel };

export type Card = Kind & { id: number; at: Where; born: number };

export type Grade = 'slab' | 'bun' | 'minunat' | 'skipped';

/** An act committed: the Dor, the card it was dropped on, the verb that implies, and which half of the day. */
export interface Commit { dor: number; on: number; verb: Verb; night: boolean }

/** A memory made, kept on its person's tally card: strength 0 faded, 1, 2 living, 3 a Minune. */
export interface Amintire { fel: Fel; strength: number; day: number }

export interface Clock { day_ends_at: number; dusk_at: number; paused_at: number | null; precued: boolean; closing: boolean }

export type Phase = 'boot' | 'wake' | 'door' | 'ended';

export type Ending = 'nunta' | 'ratacire' | 'uitare' | 'tarus' | 'dezlegare';

export type Event =
  | { event: 'brought_home' }
  | { event: 'day_began' }
  | { event: 'dusk' }
  | { event: 'precue' }
  | { event: 'day_closed'; early: boolean }
  | { event: 'paused' }
  | { event: 'resumed' }
  | { event: 'arrived'; card: number; fel: Fel; from: Om; afterglow: boolean }
  | { event: 'guttered'; card: number; fel: Fel; tied: boolean; uitare: number }
  | { event: 'committed'; dor: number; on: number; verb: Verb }
  | { event: 'resolved'; dor: number; verb: Verb; grade: Grade; strength: number; minune: boolean; spaima: number }
  | { event: 'pomenire'; n: number; uitare: number }
  | { event: 'pomana'; card: number; from: Om }
  | { event: 'walked'; loc: Loc; finds: number[] }
  | { event: 'listened'; om: Om; card: number }
  | { event: 'tied'; dor: number }
  | { event: 'untied'; dor: number }
  | { event: 'stinge'; spaima: number }
  | { event: 'rested' }
  | { event: 'soroc_held'; soroc: number }
  | { event: 'soroc_missed'; soroc: number; uitare: number }
  | { event: 'dark_dawn'; uitare: number }
  | { event: 'candle'; lit: boolean }
  | { event: 'buried' }
  | { event: 'priest'; service: number; until: number }
  | { event: 'bride_stands' }
  | { event: 'treci' }
  /** You would not go: the Bride stood in the door and you remained. */
  | { event: 'ramai' }
  | { event: 'ended'; ending: Ending };

export type Entry = Event & { day: number };

export interface Stats {
  arrived: number; guttered: number; guttered_by_fel: number[]; pomeniri: number; pomeniri_noop: number;
  soroace: number[]; missed: number[]; acts: number; plays: number; skipped: number; rested: number;
  uitare_peak: number; spaima_peak: number; putere_spent: number; arata: number; walks: number; franturi_used: number;
  cloth_peak: number; kit_peak: number; uitare_ge4: number; dark_dawns: number; pomane: number;
  /** Amintiri made by strength: faded, one-point, living, Minune. */
  amintiri: number[];
}

export interface Config {
  zi_ms: number; zi_noapte_ms: number; precue_ms: number; zile: number; soroace: number[]; burial_day: number;
  rada_zile: number; rada_mult_m: number; draguta_from: number; dor_zile: number; sill: number; sill_zile: number;
  base_m: number[]; forget_m: number; forget_dusman_m: number; acc_start_m: number; dor_max_src: number; dor_max_day: number;
  amintire_rate_m: number; standing_cap_m: number; amintire_fade_m: number; pomenire_standing_m: number;
  fear_dor_m: number; fear_from: number; lucru_odihna: number; pomana_zile: number; franturi_max: number;
  putere: number; putere_regen: number; cost_urneste: number; cost_sopteste: number; cost_arata: number; cost_bantuie: number; cost_asculta: number;
  vis_max: number; vis_repeat_cap: number; arata_zi_mult: number; masti_zile: number;
  uitare_cap: number; candle_uitare: number; candle_relight_zile: number; soroc_uitare_max: number; nunta_uitare: number;
  uitare_guttered: number; uitare_soroc_sarit: number; uitare_dark_dawn: number;
  pomenire_soroc: number; pomenire_minune: number; pomenire_minunat: number; pomenire_bun: number; pomenire_vie: number; pomenire_vis_minunat: number; pomenire_dezlegare: number;
  spaima_urneste: number[]; spaima_sopteste: number[]; spaima_arata: number[]; spaima_repeat_sleeper: number; spaima_minunat_arata: number; spaima_stinge: number;
  spaima_vrajba_calm: number; spaima_cap: number; spaima_decay: number; rest_spaima: number;
  spaima_preot: number; preot_zile: number; preot_spaima: number; preot_services_max: number; spaima_vanator: number;
}

export interface State {
  config: Config;
  phase: Phase;
  day: number;
  /** The night half: the candle is out, or was never lit today. */
  night: boolean;
  clock: Clock;
  cards: Card[];
  /** The act whose play is open. */
  commit: Commit | null;
  uitare: number;
  spaima: number;
  putere: number;
  /** The house lit the candle for this day. */
  candle: boolean;
  under: number;
  /** Per source (Mama, Draguta, Frate, Dusman, Preot), thousandths. */
  standing_m: number[];
  acc_m: number[];
  last_sent: number[];
  afterglow: Om[];
  /** The tally cards: each person's memories of you, by source. */
  amintiri: Amintire[][];
  minuni: Fel[];
  minune_promise: boolean;
  walked: Loc[];
  biserica_known: boolean;
  night_at: Loc | null;
  last_dream: Om | null;
  dreamed_tonight: Om | null;
  dreams_tonight: number;
  night_acted: boolean;
  rest_pending: boolean;
  preot_until: number;
  preot_services: number;
  buried: boolean;
  ending: Ending | null;
  treci: boolean;
  stats: Stats;
  next_id: number;
  rev: number;
  log: Entry[];
}

/** What the engine hands the renderer: the state, and the projections only the rules can make. */
export interface View extends State {
  /** Uitare at the next three dawns if nothing is done (chapter §7). */
  forecast: [number, number, number];
}

export type Action =
  | { type: 'begin' }
  | { type: 'place'; dor: number; on: number }
  | { type: 'resolve'; dor: number; grade: Grade }
  | { type: 'bantuie'; loc: number }
  | { type: 'asculta'; om: number }
  | { type: 'tie'; dor: number }
  | { type: 'untie'; dor: number }
  | { type: 'stinge' }
  | { type: 'rest' }
  | { type: 'tick' }
  | { type: 'close_day' }
  | { type: 'pause' }
  | { type: 'resume' }
  | { type: 'treci' }
  /** You would not go: Ratacire. */
  | { type: 'ramai' }
  /** After an ending: another wake, a new dead, from the dark. */
  | { type: 'again' };

export type Refusal =
  | 'not_now' | 'no_such_card' | 'does_not_fit' | 'busy' | 'locked' | 'tired' | 'only_at_night' | 'spent' | 'full' | 'corded';

export type Answer = { ok: true; changed: boolean } | { ok: false; refusal: Refusal };

/** The seat of the solo hand: every move in M0–M2. The rules ignore it (docs/ENGINE_API.md, RULINGS R142). */
export const SOLO = 0;

/** One move as the journal keeps it: who (the seat), when (the renderer's clock), what. */
export interface Move { seat: number; at: number; action: Action }

/** Why a save did not load: a newer build wrote it, or it is no save this build can read. */
export type SaveRefusal = 'newer' | 'unreadable';
