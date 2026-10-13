// Mirrors crates/priveghi-engine/src/model.rs (serde's JSON shapes). The engine owns every rule;
// these types only let the renderer read what it is given.

export type Kind =
  | 'rada' | 'negustor' | 'cel_nenuntit'
  | 'codrii_vlasiei'
  | 'plosca' | 'lumanare' | 'sare' | 'fier' | 'grau' | 'coliva'
  | 'fir_de_dor' | 'cantec_de_leagan' | 'nume' | 'bocet' | 'jale' | 'binecuvantare';

export type Niche = 'troita' | 'umbla' | 'asculta' | 'descanta' | 'boci' | 'gazdui';

export type Loc = 'table' | 'plank' | { niche: Niche };

export interface Card { id: number; kind: Kind; at: Loc; grains: number; born: number }

export type Target = { niche: Niche };

export type Recipe =
  | { recipe: 'wander'; place: Kind; lit: boolean }
  | { recipe: 'mourn_dor'; n: number }
  | { recipe: 'mourn_jale' };

export interface Run { recipe: Recipe; days: number; days_left: number; started: number }

export interface Clock { day_ends_at: number; paused_left: number | null; precued: boolean; closing: boolean }

export type Phase = 'wake' | 'ended';

export type Event =
  | { event: 'day_began' }
  | { event: 'precue' }
  | { event: 'day_closed'; early: boolean }
  | { event: 'placed'; cards: number[]; target: Target }
  | { event: 'unplaced'; cards: number[] }
  | { event: 'started'; niche: Niche; recipe: Recipe }
  | { event: 'returned'; niche: Niche; cards: number[] }
  | { event: 'decayed'; card: number; grains: number }
  | { event: 'rotted'; card: number; jale: number }
  | { event: 'resolved'; niche: Niche }
  | { event: 'arrived'; card: number; kind: Kind }
  | { event: 'consumed'; card: number; kind: Kind }
  | { event: 'pip'; bocete: number }
  | { event: 'jale_mourned'; n: number }
  | { event: 'ended' };

export type Entry = Event & { day: number };

export interface Config {
  zi_ms: number; precue_ms: number; zile: number; dor_zile: number;
  boci_min: number; boci_max: number; boci_dor_zile: number; boci_jale_zile: number;
  umbla_zile: number; dor_per_bocet: number;
}

export interface State {
  config: Config;
  phase: Phase;
  day: number;
  clock: Clock;
  cards: Card[];
  runs: Partial<Record<Niche, Run>>;
  wanders: Partial<Record<Kind, number>>;
  sung: number;
  bocete: number;
  next_id: number;
  rev: number;
  log: Entry[];
}

export type Action =
  | { type: 'place'; cards: number[]; target: Target }
  | { type: 'unplace'; cards: number[] }
  | { type: 'tick' }
  | { type: 'close_day' }
  | { type: 'tap'; on: 'flame' }
  | { type: 'pause' }
  | { type: 'resume' };

export type Refusal = 'not_now' | 'no_such_card' | 'fixed' | 'busy' | 'does_not_fit' | 'nothing';

export type Answer = { ok: true; changed: boolean } | { ok: false; refusal: Refusal };
