//! Rules of the wake, step 5: the boot, the one silence, another wake after the Bride.

mod common;

use common::*;
use priveghi_engine::*;

/// As a wake comes: in the dark, before the boot.
fn dark() -> Game {
    Game::with_config(cfg(), 7, T0)
}

#[test]
fn a_new_wake_waits_in_the_dark_with_one_candle_on_the_troita_sill() {
    let mut g = dark();
    assert_eq!(g.state.phase, Phase::Boot);
    let sill: Vec<Kind> = g.state.cards.iter().filter(|c| c.at == Loc::Sill).map(|c| c.kind).collect();
    assert_eq!(sill, vec![Kind::Lumanare]);
    assert_eq!(g.apply(Action::Tick, T0 + 10 * 60_000), Ok(false), "no day passes in the dark");
    assert_eq!(g.state.day, 1);
}

#[test]
fn only_the_boot_candle_can_be_placed_in_the_dark() {
    let mut g = dark();
    assert_eq!(place(&mut g, Kind::CodriiVlasiei, 1, Niche::Umbla), Err(Refusal::NotNow));
    assert_eq!(g.apply(Action::Tap { on: TapOn::Flame }, T0), Err(Refusal::NotNow));
}

#[test]
fn the_candle_lit_at_the_troita_begins_the_wake() {
    let mut g = dark();
    let candle = sill_ids(&g);
    let kit = count(&g, Kind::Lumanare) - 1;
    g.apply(Action::Place { cards: candle, target: Target::Niche(Niche::Troita) }, T0 + 5_000).unwrap();
    assert_eq!(g.state.phase, Phase::Wake);
    assert_eq!(g.state.clock.day_ends_at, T0 + 65_000);
    assert_eq!(count(&g, Kind::Lumanare), kit, "the boot candle became the table candle");
    assert_eq!(g.state.wax, 5);
    assert!(g.state.log.iter().any(|e| e.event == Event::Kindled));
}

#[test]
fn a_dor_that_rots_while_frant_goes_down_the_sabbath_water_once_a_run() {
    let mut g = begin(Config { dor_zile: 2, ..cfg() }, 7);
    wander(&mut g, true);
    wander(&mut g, true);
    wander(&mut g, true); // the first three rot at this close: the watcher breaks
    assert!(g.state.frant);
    close(&mut g); // day 4: day 2's threads rot while broken
    assert_eq!(last_close(&g).iter().filter(|e| **e == Event::Silence).count(), 1);
    close(&mut g); // day 5: day 3's rot too; the silence is spent
    assert!(!last_close(&g).contains(&Event::Silence));
}

#[test]
fn a_dor_that_rots_while_whole_is_quiet_grief_not_the_silence() {
    let mut g = game();
    wander(&mut g, false);
    close(&mut g);
    close(&mut g);
    close(&mut g);
    assert_eq!(count(&g, Kind::Jale), 2);
    assert!(!g.state.log.iter().any(|e| e.event == Event::Silence));
}

#[test]
fn after_the_bride_another_wake_begins_in_the_dark_with_one_less_wax() {
    let mut g = game();
    for _ in 0..9 {
        close(&mut g);
    }
    assert_eq!(g.state.ending, Some(Ending::Cununie));
    g.apply(Action::Again, T0).unwrap();
    assert_eq!((g.state.phase, g.state.day, g.state.wakes), (Phase::Boot, 1, 2));
    kindle(&mut g);
    assert_eq!(g.state.wax, 4);
}

#[test]
fn the_candle_never_begins_a_wake_at_nothing() {
    let mut g = begin(Config { kit_wax: 1, ..cfg() }, 7);
    for _ in 0..5 {
        close(&mut g); // dark from the third close: the Bride comes at the fifth
    }
    assert_eq!(g.state.ending, Some(Ending::Cununie));
    g.apply(Action::Again, T0).unwrap();
    kindle(&mut g);
    assert_eq!(g.state.wax, 1);
}

#[test]
fn again_is_only_for_after_the_bride() {
    let mut g = game();
    assert_eq!(g.apply(Action::Again, T0), Err(Refusal::NotNow));
}
