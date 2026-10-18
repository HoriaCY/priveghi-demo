//! The save gets a version, a journal and a seat (RULINGS R141–R147, R160–R163). The journal replays
//! from its origin to the state, and only under the rules that wrote it; a save from before the
//! version goes on; a newer build's save is refused; the save holds integers only; the nine days'
//! state is pinned as a digest that three targets check (R163).

mod v3;

use priveghi_engine::v3::*;
use serde_json::{json, Value};
use v3::*;

const FIXTURE: &str = include_str!("fixtures/v3_chibzuit_9.txt");

/// The considered dead's nine days from the dark: the boot is the journal's first move.
fn nine_days() -> Wake {
    let mut w = wake();
    Chibzuit::new().play(&mut w);
    w
}

/// Whole-state equality, without printing two states on a failure.
fn replays(w: &Wake) {
    let back = w.replay().unwrap_or_else(|(i, r)| panic!("move {i} refused on replay: {r:?}"));
    assert!(back == w.state, "the journal replays from its origin to another state");
}

#[test]
fn the_considered_deads_nine_days_replay_from_the_dark_to_the_same_state() {
    let w = nine_days();
    assert_eq!(summary(&w, "chibzuit"), FIXTURE);
    assert!(w.origin == new_state(Config::default(), T0), "the origin is the dark before the boot");
    assert_eq!(w.journal[0], Move { seat: SOLO, at: T0, action: Action::Begin });
    replays(&w);
    let back = Wake { state: w.replay().unwrap(), ..w.clone() };
    assert_eq!(summary(&back, "chibzuit"), FIXTURE);
}

#[test]
fn again_begins_the_journal_anew_and_the_replay_holds_on_both_sides() {
    let mut w = nine_days();
    assert_eq!(w.state.phase, Phase::Door);
    assert_eq!(w.apply(Action::Ramai, 1), Ok(true));
    assert_eq!(w.state.ending, Some(Ending::Ratacire));
    replays(&w);
    assert!(w.journal.len() > 9, "nine days of moves ({})", w.journal.len());
    assert_eq!(w.apply(Action::Again, 7), Ok(true));
    assert_eq!(w.state.phase, Phase::Boot);
    assert!(w.origin == w.state, "the new wake's dark is its origin");
    assert!(w.journal.is_empty(), "a wake's journal never carries the wake before it");
    replays(&w);
    w.apply(Action::Begin, 8).unwrap();
    assert_eq!(w.journal, vec![Move { seat: SOLO, at: 8, action: Action::Begin }]);
    replays(&w);
}

#[test]
fn a_save_from_before_the_version_goes_on_as_version_one_and_ends_on_the_fixture() {
    let mut w = wake();
    let mut policy = Chibzuit::new();
    for _ in 0..4 {
        policy.play_day(&mut w);
    }
    // the live saves before the version were the wake's one field
    let v0 = format!("{{\"state\":{}}}", serde_json::to_string(&w.state).unwrap());
    let mut back = Wake::from_save(&v0).unwrap();
    assert_eq!(back.version, SAVE_VERSION);
    assert!(back.state == w.state && back.origin == w.state, "the wake carried over is its own origin");
    assert!(back.journal.is_empty(), "its journal begins at the migration");
    policy.play(&mut back);
    assert_eq!(summary(&back, "chibzuit"), FIXTURE);
    replays(&back);
}

#[test]
fn a_journal_that_replays_is_loaded_as_it_was() {
    let w = nine_days();
    let mut back = Wake::from_save(&w.to_save()).unwrap();
    assert!(back.origin == w.origin, "the origin is kept");
    assert_eq!(back.journal, w.journal, "the journal is kept");
    assert!(back.state == w.state);
    assert!(!back.rebase(), "a journal that replays is never begun again");
    assert!(back == w);
}

#[test]
fn a_journal_these_rules_no_longer_replay_keeps_its_state_and_begins_again_at_the_load() {
    let w = nine_days();
    // what a build with other rules would see: the state went on and the journal no longer reaches it
    let drifted = Wake { journal: Vec::new(), ..w.clone() };
    assert!(drifted.replay().is_ok_and(|s| s != w.state), "the empty journal replays to the dark");
    let mut back = Wake::from_save(&drifted.to_save()).unwrap();
    assert!(back.state == w.state, "the state is kept");
    assert!(back.origin == w.state, "the journal begins again at the load");
    assert!(back.journal.is_empty());
    replays(&back);
    // a journal with a move these rules refuse on replay: the same
    let mut refused = w.clone();
    refused.journal.insert(0, Move { seat: SOLO, at: T0, action: Action::Treci });
    assert_eq!(refused.replay().map(|_| ()), Err((0, Refusal::NotNow)));
    let again = Wake::from_save(&refused.to_save()).unwrap();
    assert!(again == back, "rebased the same way");
    // and the wake goes on from there, journaled again
    assert_eq!(back.apply(Action::Ramai, 1), Ok(true));
    assert_eq!(back.journal, vec![Move { seat: SOLO, at: 1, action: Action::Ramai }]);
    replays(&back);
}

#[test]
fn a_newer_builds_save_is_refused_and_what_is_no_save_is_unreadable() {
    let w = wake();
    let mut newer: Value = serde_json::from_str(&w.to_save()).unwrap();
    newer["version"] = json!(SAVE_VERSION + 1);
    assert_eq!(Wake::from_save(&newer.to_string()), Err(SaveError::Newer));
    assert_eq!(
        Wake::from_save(r#"{"version":99}"#),
        Err(SaveError::Newer),
        "the version is read before the shape"
    );
    let mut torn: Value = serde_json::from_str(&w.to_save()).unwrap();
    torn.as_object_mut().unwrap().remove("journal");
    let torn = torn.to_string();
    for bad in [
        "",
        "not a save",
        "null",
        "[]",
        "{}",
        r#"{"state":3}"#,
        r#"{"version":1,"state":{}}"#,
        r#"{"version":"1"}"#,
        r#"{"version":1.0}"#,
        r#"{"version":-1}"#,
        &torn,
    ] {
        assert_eq!(Wake::from_save(bad), Err(SaveError::Unreadable), "{bad:.60}");
    }
    // the bridge throws the serde name
    for e in [SaveError::Newer, SaveError::Unreadable] {
        assert_eq!(serde_json::to_string(&e).unwrap(), format!("\"{e}\""));
    }
}

#[test]
fn a_save_round_trips_and_a_move_is_its_seat_its_time_and_its_action() {
    let w = nine_days();
    let back = Wake::from_save(&w.to_save()).unwrap();
    assert!(back == w, "to_save then from_save is the same wake");
    assert!(w.to_save().starts_with(r#"{"version":1,"origin":{"#));
    let mv = Move { seat: SOLO, at: 123, action: Action::Place { dor: 4, on: 9 } };
    assert_eq!(
        serde_json::to_string(&mv).unwrap(),
        r#"{"seat":0,"at":123,"action":{"type":"place","dor":4,"on":9}}"#
    );
}

#[test]
fn refusals_idle_ticks_and_questions_are_not_journaled() {
    let mut w = wake();
    let before = w.clone();
    let now = by_day(&w);
    assert_eq!(w.apply(Action::Treci, now), Err(Refusal::NotNow));
    assert_eq!(w.apply(Action::Place { dor: 999, on: 1 }, now), Err(Refusal::NoSuchCard));
    assert_eq!(w.apply(Action::Tick, now), Ok(false), "nothing due");
    let dor = dor_ids(&w, Where::Cloth)[0];
    let on = things_ready(&w)[0];
    assert_eq!(w.probe(Action::Place { dor, on }, now), Ok(true));
    assert_eq!(w.ask(&Move { seat: 3, at: now, action: Action::Place { dor, on } }), Ok(true));
    assert!(w == before, "nothing recorded, nothing changed");
    assert_eq!(w.journal.len(), 1, "the boot alone");
    let dusk = w.state.clock.dusk_at;
    assert_eq!(w.apply(Action::Tick, dusk), Ok(true));
    w.apply(Action::Place { dor, on }, dusk + 5).unwrap();
    assert_eq!(
        w.journal[1..],
        [
            Move { seat: SOLO, at: dusk, action: Action::Tick },
            Move { seat: SOLO, at: dusk + 5, action: Action::Place { dor, on } },
        ]
    );
}

#[test]
fn a_move_that_leaves_the_state_as_it_was_is_accepted_and_not_journaled() {
    let mut w = Wake::new(T0);
    for i in 0..1000 {
        assert_eq!(w.apply(Action::Pause, T0 + 2 * i), Ok(false));
        assert_eq!(w.apply(Action::Resume, T0 + 2 * i + 1), Ok(false));
    }
    assert!(w.journal.is_empty(), "the dark's pauses are no steps ({} journaled)", w.journal.len());
    // in the wake the first pause is a change, a second is not, the resume is
    let mut w = wake();
    let now = by_day(&w);
    assert_eq!(w.apply(Action::Pause, now), Ok(true));
    assert_eq!(w.apply(Action::Pause, now + 1), Ok(false));
    assert_eq!(w.apply(Action::Resume, now + 2), Ok(true));
    assert_eq!(w.journal.len(), 3, "the boot, the pause, the resume");
    replays(&w);
    // the reference run had no such move: its 59 stand, and replay
    let w = nine_days();
    assert_eq!(w.journal.len(), 59);
    replays(&w);
    let mut ended = w.clone();
    ended.apply(Action::Ramai, 1).unwrap();
    let n = ended.journal.len();
    assert_eq!(ended.apply(Action::Pause, 2), Ok(false), "an ended page: nothing to pause");
    assert_eq!(ended.journal.len(), n);
}

#[test]
fn a_seat_from_javascript_is_an_integer_in_a_byte_or_refused() {
    assert_eq!(seat_from_js(0.0), Some(0));
    assert_eq!(seat_from_js(7.0), Some(7));
    assert_eq!(seat_from_js(255.0), Some(255));
    // NaN is what `undefined` becomes: a seat left out is refused, never taken for 0
    for bad in [-1.0, 256.0, 0.5, 254.5, f64::NAN, f64::INFINITY, f64::NEG_INFINITY] {
        assert_eq!(seat_from_js(bad), None, "{bad}");
    }
}

#[test]
fn the_rules_ignore_the_seat() {
    let w = nine_days();
    assert!(w.journal.iter().all(|m| m.seat == SOLO), "every move made through apply is the solo hand's");
    let mut other = Wake { journal: Vec::new(), state: w.origin.clone(), ..w.clone() };
    for mv in &w.journal {
        other.play(Move { seat: 7, ..mv.clone() }).unwrap();
    }
    assert!(other.state == w.state, "another seat, the same wake");
}

/// Every number in a JSON value that is not an integer, by path.
fn floats(v: &Value, path: &str, out: &mut Vec<String>) -> usize {
    match v {
        Value::Number(n) => {
            if !(n.is_u64() || n.is_i64()) {
                out.push(path.to_string());
            }
            1
        }
        Value::Array(a) => a.iter().enumerate().map(|(i, x)| floats(x, &format!("{path}[{i}]"), out)).sum(),
        Value::Object(o) => o.iter().map(|(k, x)| floats(x, &format!("{path}.{k}"), out)).sum(),
        _ => 0,
    }
}

#[test]
fn a_save_holds_integers_only() {
    let save: Value = serde_json::from_str(&nine_days().to_save()).unwrap();
    let mut out = Vec::new();
    let numbers = floats(&save, "$", &mut out);
    assert!(numbers > 500, "the walk reached the numbers ({numbers})");
    assert!(out.is_empty(), "a float in the save: {out:?}");
}

/// FNV-1a, 64 bits: enough to tell two machines' states apart, with no dependency.
fn fnv1a(bytes: &[u8]) -> u64 {
    bytes.iter().fold(0xcbf2_9ce4_8422_2325, |h, b| (h ^ u64::from(*b)).wrapping_mul(0x0100_0000_01b3))
}

/// The nine-day run's final state, pinned as bytes: computed on an aarch64 Mac; CI re-checks it on
/// Linux x86_64 natively and on wasm32-wasip1 under wasmtime (three targets, one state, R163).
/// Re-pinned only when the state's shape changes on purpose, with a ruling; otherwise a change here
/// means the rules drifted or a float got into the economy.
const NINE_DAYS_FNV: u64 = 0x6cdb_e186_4d1f_bc01;

#[test]
fn the_nine_days_end_in_the_same_bytes_on_every_machine() {
    assert_eq!(fnv1a(b""), 0xcbf2_9ce4_8422_2325);
    assert_eq!(fnv1a(b"a"), 0xaf63_dc4c_8601_ec8c, "the published FNV-1a 64 vector");
    let got = fnv1a(serde_json::to_string(&nine_days().state).unwrap().as_bytes());
    assert_eq!(got, NINE_DAYS_FNV, "the nine days' state hashes to {got:#018x}");
}
