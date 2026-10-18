# The engine's contract

Changes to this page are rulings, not refactors.

Any renderer (this DOM table, a native one, a server) is written against what is named here and
nothing else. The code is `crates/priveghi-engine/src/v3/` (the rules), `src/wasm.rs` (the browser
bridge) and `src/engine/` (its TypeScript twin, whose `types.ts` mirrors every JSON shape below).

## Entry points

**Rust, `priveghi_engine::v3`.** `Wake` holds one wake; its fields are public: `version`, `origin`,
`journal`, `state`.

| Call | What it does |
|---|---|
| `Wake::new(now_ms)`, `Wake::with_config(config, now_ms)` | A new wake in the dark (phase `boot`): `version` = `SAVE_VERSION`, `origin` = that state, an empty journal. |
| `play(&mut self, Move) -> Result<bool, Refusal>` | The one door that changes a wake. `Ok(changed)`; an accepted move is journaled; a refusal records and changes nothing. |
| `ask(&self, &Move) -> Result<bool, Refusal>` | What `play` would answer, recording nothing. |
| `apply(action, now_ms)`, `probe(action, now_ms)` | `play` and `ask` from the seat `SOLO`. |
| `replay(&self) -> Result<State, (usize, Refusal)>` | The journal folded over `origin` with `step`; the error names the index of a move refused on replay. |
| `to_save(&self) -> String`, `Wake::from_save(&str) -> Result<Wake, SaveError>` | The save (below). `SaveError` is `newer` or `unreadable`. |

Free functions the bridge needs: `forecast(&State) -> [u8; 3]` (Uitare at the next three dawns if
nothing is done) and `match_points(fel, from, &Card) -> u8` (what a Dor makes on a card, 0..2).
Also public: `step(&State, Action, now_ms) -> Result<State, Refusal>`, `new_state(config, now_ms)`,
`tick_due(&State, now_ms)`, `sleepers`, `legal_act_exists`, `forget_pow_m`; the constants
`SAVE_VERSION` (1) and `SOLO` (0).

**WebAssembly, `Engine`** (JSON strings across the boundary):

| Method | Answers |
|---|---|
| `new Engine(now_ms)` | A new wake in the dark. |
| `Engine.load(save)` | A wake from a save; throws an `Error` whose message is `newer` or `unreadable`. |
| `save()` | The save, version 1. |
| `state()` | The View (below). |
| `apply(action, now_ms, seat)`, `probe(action, now_ms, seat)` | `{"ok":true,"changed":bool}` or `{"ok":false,"refusal":"…"}`. |
| `matches(dor, on, now_ms, seat)` | The points this Dor makes on this card, or -1 if the drop would be refused now. |
| `replays()` | Whether the journal replays from its origin to exactly the state. |

The seat has no default anywhere at the boundary: every call names it.

## The move and the seat

`Move { seat: u8, at: u64, action: Action }`: who, when (the renderer's clock in milliseconds,
injected), what. JSON: `{"seat":0,"at":123,"action":{"type":"place","dor":4,"on":9}}`.

The seat is reserved. In M0–M2 it is always `SOLO` (0) and the rules ignore it (a test plays the
reference run from another seat and reaches the same state). Its meaning arrives with the seated
rules after M3. Several hands sharing one co-op seat is the transport's business, not the rules'.

## Actions

JSON `{"type": …}` with the fields shown.

- `begin`: the boot; they bring you home, day 1 runs.
- `place {dor, on}`: a Dor dropped on a thing (URNEȘTE), a sleeper by night (ȘOPTEȘTE), a person by day or a place (ARATĂ-TE); the act is committed, its Putere spent, its play opens.
- `resolve {dor, grade}`: the play's grade (`slab`, `bun`, `minunat`, `skipped`); the act resolves.
- `bantuie {loc}`: you are at a place on the road at once; its finds come to the kit.
- `asculta {om}`: a fragment of what this person says of you.
- `tie {dor}`, `untie {dor}`: a Dor onto the troiță's sill, or back to the cloth.
- `stinge`: the night begins now.
- `rest`: lie back; the day closes after the pre-cue.
- `tick`: moves the clock to `at`: the dusk, the pre-cue and the close when they are due.
- `close_day`: the close, now.
- `pause`, `resume`: the clock stops while nobody is at the table.
- `treci`: your card on the dark door, while the Bride stands in it.
- `ramai`: you would not go (Rătăcire).
- `again`: after an ending, or in her door: another wake from the dark.

## Refusals

`not_now` (not the moment: the wrong phase, a closing day, a paused clock), `no_such_card`,
`does_not_fit` (nothing here takes this card), `busy` (a play is open), `locked` (the priest's cord),
`tired` (no Putere for this act), `only_at_night`, `spent` (the thing rests, or you dreamed tonight),
`full` (the sill, or the fragments held), `corded` (a night act was committed: no rest until dawn).

## The View

`state()` is the whole `State` as JSON, with `forecast: [u8; 3]` beside it. The renderer reads it and
never writes it; every rule and every projection (the forecast, a match) is asked of the engine.
`State`: `config` (every rules number), `phase` (`boot`, `wake`, `door`, `ended`), `day`, `night`,
`clock` (`day_ends_at`, `dusk_at`, `paused_at`, `precued`, `closing`), `cards`, `commit`, `uitare`,
`spaima`, `putere`, `candle`, `under`, `standing_m`, `acc_m`, `last_sent`, `afterglow`, `amintiri`,
`minuni`, `minune_promise`, `walked`, `biserica_known`, `night_at`, `last_dream`, `dreamed_tonight`,
`dreams_tonight`, `night_acted`, `rest_pending`, `preot_until`, `preot_services`, `buried`, `ending`
(`nunta`, `ratacire`, `uitare`, `tarus`, `dezlegare`), `treci`, `stats`, `next_id`, `rev` (bumped on
every change), `log`. A card is `{id, at, born, kind, …}`: `cel_nenuntit`; `dor {fel, from, left,
tied_at}`; `lucru {lucru, fel, owner, rests_until, leaves_at}`; `om {om, fel}`; `loc {loc, fel}`;
`frantura`; `semn {fel}`. `at` is `plank`, `cloth`, `kit`, `road`, `sill`, `{"niche": verb}`, `cimitir`
or `away`.

## The event log

`log` is a list of `{day, event, …}`, appended by the rules, never rewritten: `brought_home`,
`day_began`, `dusk`, `precue`, `day_closed {early}`, `paused`, `resumed`, `arrived {card, fel, from,
afterglow}`, `guttered {card, fel, tied, uitare}`, `committed {dor, on, verb}`, `resolved {dor, verb,
grade, strength, minune, spaima}`, `pomenire {n, uitare}`, `pomana {card, from}`, `walked {loc, finds}`,
`listened {om, card}`, `tied {dor}`, `untied {dor}`, `stinge {spaima}`, `rested`, `soroc_held {soroc}`,
`soroc_missed {soroc, uitare}`, `dark_dawn {uitare}`, `candle {lit}`, `buried`, `priest {service,
until}`, `bride_stands`, `treci`, `ramai`, `ended {ending}`. The log says what happened; the journal
(below) says what was played.

## The save, version 1

`{"version":1,"origin":State,"journal":[Move],"state":State}`. `origin` is a full state: a new wake's
dark, or the state a save was carried over in. The journal holds every accepted move except a tick
with nothing due; it holds no refusal and nothing asked (`ask`, `probe`, `matches`). An accepted
`again` begins it anew: `origin` becomes the new wake's dark and the journal empties, so a journal
never carries the wake before it.

Loading (`from_save`): no `version` field is version 0, the saves written before the version
(`{"state": …}`): migrated to version 1 with `origin` = that state and an empty journal, and the wake
goes on. Version 1 loads. A higher version (a newer build's save) is refused as `newer`. Anything
that does not parse into the shape is `unreadable`. Every bump of `SAVE_VERSION` either writes a
migration from the version before or states its refusal. The demo keeps a refused save aside in
`localStorage['priveghi.v3.refused']` and begins a new wake (README, Saves).

## Invariants

- One pure `step(state, action, now_ms)`: no I/O, no clock of its own (time is the injected
  `now_ms`), no random numbers.
- Integers only: the economy is carried in thousandths (`_m`); a test walks the save and fails on any
  float.
- The journal replays from `origin` to exactly `state`: checked natively (`cargo test`) and in the
  WebAssembly build in the browser (`replays()`); the reference run's final state is pinned as an
  FNV-1a digest that CI re-checks on another machine.
- A `Wake` never reaches outside itself (no globals, no shared state), so a future `Village` can hold
  several without the `Wake` changing.
