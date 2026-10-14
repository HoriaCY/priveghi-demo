//! The dead's wake, step 1: the engine reproduces the chapter's reference run. The considered dead
//! (`chibzuit`) plays nine days against this engine and its summary must equal, byte for byte, what
//! wake_sim_v3.py printed at the revision stamped in SYSTEMS_v3_MORTUL.md §13 (its md5 begins
//! 4564652f4f04): tests/fixtures/v3_chibzuit_9.txt, a verbatim copy of the chapter's
//! design/out/v3_chibzuit_9.txt. Nothing in here is a number copied into prose.

mod v3;

use priveghi_engine::v3::*;
use v3::*;

const FIXTURE: &str = include_str!("fixtures/v3_chibzuit_9.txt");

#[test]
fn the_considered_dead_reaches_the_ninth_soroc_as_the_simulator_printed() {
    let mut w = wake();
    let mut policy = Chibzuit::new();
    policy.play(&mut w);
    let got = summary(&w, "chibzuit");
    assert_eq!(got, FIXTURE, "\n--- engine ---\n{got}\n--- simulator ---\n{FIXTURE}");
    assert_eq!(w.state.phase, Phase::Door, "the Bride stands in the door");
}

/// When the loki repository is checked out beside this one, the fixture must still be its file.
#[test]
fn the_fixture_is_the_chapters_file_when_the_chapter_is_beside_us() {
    let path =
        concat!(env!("CARGO_MANIFEST_DIR"), "/../../../loki/docs/priveghi/design/out/v3_chibzuit_9.txt");
    if let Ok(theirs) = std::fs::read_to_string(path) {
        assert_eq!(theirs, FIXTURE, "tests/fixtures/v3_chibzuit_9.txt drifted from {path}");
    }
}

/// The forgetting in thousandths equals Python's `round(forget ** k * 1000)` for every day of a
/// forty-day wake: the integer economy is pinned to the simulator's floats.
#[test]
fn the_forgetting_table_is_the_simulators() {
    let py_920: [u32; 41] = [
        1000, 920, 846, 779, 716, 659, 606, 558, 513, 472, 434, 400, 368, 338, 311, 286, 263, 242, 223, 205,
        189, 174, 160, 147, 135, 124, 114, 105, 97, 89, 82, 75, 69, 64, 59, 54, 50, 46, 42, 39, 36,
    ];
    let py_750: [u32; 41] = [
        1000, 750, 562, 422, 316, 237, 178, 133, 100, 75, 56, 42, 32, 24, 18, 13, 10, 8, 6, 4, 3, 2, 2, 1, 1,
        1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    ];
    for k in 0..41u32 {
        assert_eq!(forget_pow_m(920, k), py_920[k as usize], "0.92^{k}");
        assert_eq!(forget_pow_m(750, k), py_750[k as usize], "0.75^{k}");
    }
}

/// The run is the same whatever the clock says: the economy has no dice and no wall-clock decay.
#[test]
fn the_run_does_not_depend_on_when_it_is_played() {
    let mut a = Wake::with_config(Config::default(), 5);
    a.apply(Action::Begin, 5).unwrap();
    let mut b = Wake::with_config(Config::default(), 9_000_000_000);
    b.apply(Action::Begin, 9_000_000_000).unwrap();
    Chibzuit::new().play(&mut a);
    Chibzuit::new().play(&mut b);
    assert_eq!(summary(&a, "chibzuit"), summary(&b, "chibzuit"));
}

/// A save in the middle of the run resumes to the same end.
#[test]
fn a_saved_wake_resumes_to_the_same_end() {
    let mut w = wake();
    let mut policy = Chibzuit::new();
    for _ in 0..4 {
        policy.play_day(&mut w);
    }
    let json = serde_json::to_string(&w).unwrap();
    let mut back: Wake = serde_json::from_str(&json).unwrap();
    assert_eq!(back, w);
    policy.play(&mut back);
    assert_eq!(summary(&back, "chibzuit"), FIXTURE);
}
