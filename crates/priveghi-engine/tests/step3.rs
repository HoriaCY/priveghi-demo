//! Rules of the wake, step 3: the troita (rest, the sill), wax and the candle's dish, Frant, the end.

mod common;

use common::*;
use priveghi_engine::*;

fn rest(g: &mut Game, at: u64) -> Result<bool, Refusal> {
    let cards = on_table(g, Kind::Plosca);
    g.apply(Action::Place { cards, target: Target::Niche(Niche::Troita) }, at)
}

/// A lit wander on day 1, then three closes: its three Fir de dor rot at the fourth close.
fn three_jale(g: &mut Game) {
    wander(g, true);
    close(g);
    close(g);
    close(g);
}

// ---------------------------------------------------------------- the troita

#[test]
fn resting_with_the_flask_closes_the_day_one_precue_later() {
    let mut g = game();
    rest(&mut g, T0 + 5_000).unwrap();
    assert_eq!(precues(&g), 1);
    assert_eq!(g.state.day, 1);
    g.apply(Action::Tick, T0 + 5_400).unwrap();
    assert_eq!(g.state.day, 2);
    assert!(last_close(&g).contains(&Event::Rested));
    assert_eq!(on_table(&g, Kind::Plosca).len(), 1);
}

#[test]
fn a_dor_tied_at_the_sill_does_not_rot() {
    let mut g = game();
    wander(&mut g, false);
    place(&mut g, Kind::FirDeDor, 2, Niche::Troita).unwrap();
    assert_eq!(sill(&g), 2);
    for _ in 0..5 {
        close(&mut g);
    }
    assert_eq!(sill(&g), 2);
    assert_eq!(count(&g, Kind::Jale), 0);
    assert!(g.state.cards.iter().filter(|c| c.at == Loc::Sill).all(|c| c.grains == 3));
}

#[test]
fn the_sill_holds_three() {
    let mut g = game();
    wander(&mut g, true);
    wander(&mut g, false);
    place(&mut g, Kind::FirDeDor, 4, Niche::Troita).unwrap();
    assert_eq!(sill(&g), 3);
    assert_eq!(on_table(&g, Kind::FirDeDor).len(), 1);
}

#[test]
fn an_untied_dor_decays_again() {
    let mut g = game();
    wander(&mut g, false);
    place(&mut g, Kind::FirDeDor, 2, Niche::Troita).unwrap();
    close(&mut g);
    let tied = sill_ids(&g);
    g.apply(Action::Unplace { cards: tied }, T0).unwrap();
    close(&mut g);
    assert_eq!(dor_grains(&g), vec![2, 2]);
}

#[test]
fn a_tied_dor_can_be_carried_to_rada() {
    let mut g = game();
    wander(&mut g, true);
    place(&mut g, Kind::FirDeDor, 3, Niche::Troita).unwrap();
    place(&mut g, Kind::Rada, 1, Niche::Boci).unwrap();
    let tied = sill_ids(&g);
    g.apply(Action::Place { cards: tied, target: Target::Niche(Niche::Boci) }, T0).unwrap();
    assert_eq!(sill(&g), 0);
    assert_eq!(in_niche(&g, Niche::Boci).len(), 4);
}

#[test]
fn the_troita_takes_only_the_flask_and_threads() {
    let mut g = game();
    assert_eq!(place(&mut g, Kind::Rada, 1, Niche::Troita), Err(Refusal::DoesNotFit));
    assert_eq!(place(&mut g, Kind::Lumanare, 1, Niche::Troita), Err(Refusal::DoesNotFit));
}

// ---------------------------------------------------------------- wax and the candle

#[test]
fn the_candle_burns_a_notch_at_every_third_close() {
    let mut g = game();
    assert_eq!(g.state.wax, 5);
    close(&mut g);
    close(&mut g);
    assert_eq!(g.state.wax, 5);
    close(&mut g);
    assert_eq!(g.state.wax, 4);
    close(&mut g);
    close(&mut g);
    close(&mut g);
    assert_eq!(g.state.wax, 3);
}

#[test]
fn a_candle_card_in_the_dish_adds_a_notch_until_the_candle_is_whole() {
    let mut g = game();
    assert_eq!(place_on(&mut g, Kind::Lumanare, 1, Target::Candle), Err(Refusal::DoesNotFit));
    for _ in 0..6 {
        close(&mut g);
    }
    let kit = count(&g, Kind::Lumanare);
    place_on(&mut g, Kind::Lumanare, 5, Target::Candle).unwrap();
    assert_eq!(g.state.wax, 5);
    assert_eq!(count(&g, Kind::Lumanare), kit - 2);
}

#[test]
fn a_dark_candle_costs_a_pip_at_every_close_and_the_last_pip_brings_the_bride() {
    let mut g = begin(Config { kit_wax: 1, ..cfg() }, 7);
    close(&mut g);
    close(&mut g);
    assert_eq!((g.state.wax, g.state.vigoare), (1, 3));
    close(&mut g); // the close that burns the last stick is already dark
    assert_eq!((g.state.wax, g.state.vigoare), (0, 2));
    close(&mut g);
    assert_eq!(g.state.vigoare, 1);
    close(&mut g);
    assert_eq!(g.state.vigoare, 0);
    assert_eq!(g.state.phase, Phase::Ended);
    assert_eq!(g.state.ending, Some(Ending::Cununie));
    assert_eq!(g.state.day, 5);
}

#[test]
fn feeding_a_dark_candle_relights_it() {
    let mut g = begin(Config { kit_wax: 1, ..cfg() }, 7);
    for _ in 0..3 {
        close(&mut g);
    }
    place_on(&mut g, Kind::Lumanare, 1, Target::Candle).unwrap();
    close(&mut g);
    assert_eq!((g.state.wax, g.state.vigoare), (1, 2));
}

#[test]
fn wax_grace_forgives_the_first_dark_closes() {
    let mut g = begin(Config { kit_wax: 1, wax_grace: 1, ..cfg() }, 7);
    for _ in 0..3 {
        close(&mut g);
    }
    assert_eq!(g.state.vigoare, 3);
    close(&mut g);
    assert_eq!(g.state.vigoare, 2);
}

// ---------------------------------------------------------------- Frant

#[test]
fn three_jale_break_the_watcher_and_lock_three_niches() {
    let mut g = game();
    three_jale(&mut g);
    assert_eq!(count(&g, Kind::Jale), 3);
    assert!(g.state.frant);
    assert!(last_close(&g).contains(&Event::FrantLocked));
    assert_eq!(place(&mut g, Kind::CodriiVlasiei, 1, Niche::Umbla), Err(Refusal::Locked));
    assert_eq!(place(&mut g, Kind::Sare, 1, Niche::Descanta), Err(Refusal::Locked));
    assert_eq!(place(&mut g, Kind::Sare, 1, Niche::Asculta), Err(Refusal::Locked));
}

#[test]
fn under_frant_the_troita_boci_gazdui_and_the_candle_stay_open() {
    let mut g = game();
    three_jale(&mut g);
    assert!(g.state.frant);
    assert_ne!(place(&mut g, Kind::Grau, 1, Niche::Gazdui), Err(Refusal::Locked));
    place(&mut g, Kind::Rada, 1, Niche::Boci).unwrap();
    place(&mut g, Kind::Jale, 1, Niche::Boci).unwrap();
    place_on(&mut g, Kind::Lumanare, 1, Target::Candle).unwrap();
    rest(&mut g, T0).unwrap();
}

#[test]
fn mourning_the_jale_lifts_frant_at_that_close() {
    let mut g = game();
    three_jale(&mut g);
    place(&mut g, Kind::Rada, 1, Niche::Boci).unwrap();
    place(&mut g, Kind::Jale, 1, Niche::Boci).unwrap();
    close(&mut g);
    assert!(!g.state.frant);
    assert!(last_close(&g).contains(&Event::FrantLifted));
    place(&mut g, Kind::CodriiVlasiei, 1, Niche::Umbla).unwrap();
}

// ---------------------------------------------------------------- the end

#[test]
fn nine_untouched_days_end_with_the_bride_and_the_candle_still_lit() {
    let mut g = game();
    let mut t = T0;
    while g.state.phase == Phase::Wake {
        t += 100;
        g.apply(Action::Tick, t).unwrap();
    }
    assert_eq!(t, T0 + 9 * 60_000);
    assert_eq!(g.state.day, 9);
    assert_eq!(g.state.ending, Some(Ending::Cununie));
    assert_eq!((g.state.wax, g.state.vigoare), (2, 3));
    assert!(g.state.log.iter().any(|e| e.event == Event::Ended { ending: Ending::Cununie }));
}

// ---------------------------------------------------------------- probing

#[test]
fn a_probe_answers_like_apply_and_changes_nothing() {
    let g = game();
    let before = g.clone();
    let codrii = on_table(&g, Kind::CodriiVlasiei);
    let rada = on_table(&g, Kind::Rada);
    assert_eq!(g.probe(Action::Place { cards: codrii, target: Target::Niche(Niche::Umbla) }, T0), Ok(true));
    assert_eq!(
        g.probe(Action::Place { cards: rada, target: Target::Niche(Niche::Umbla) }, T0),
        Err(Refusal::DoesNotFit)
    );
    assert_eq!(g, before);
}
