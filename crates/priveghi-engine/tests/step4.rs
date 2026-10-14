//! Rules of the wake, step 4: ASCULTA, DESCANTA, GAZDUIESTE, the peddler, coliva, the offering, the
//! two endings.

mod common;

use common::*;
use priveghi_engine::*;

/// Wheat into GAZDUIESTE with no guest: the hearth makes coliva at the close.
fn hearth(g: &mut Game) {
    place(g, Kind::Grau, 1, Niche::Gazdui).unwrap();
}

// ---------------------------------------------------------------- ASCULTA, DESCANTA

#[test]
fn listening_to_a_lullaby_yields_a_name_and_spends_the_song() {
    let mut g = game();
    wander(&mut g, false);
    wander(&mut g, false); // day 2's wander brings the lullaby
    place(&mut g, Kind::CantecDeLeagan, 1, Niche::Asculta).unwrap();
    close(&mut g);
    assert_eq!(arrivals(&g), vec![Kind::Nume]);
    assert_eq!(count(&g, Kind::CantecDeLeagan), 0);
}

#[test]
fn asculta_takes_only_a_lullaby() {
    let mut g = game();
    assert_eq!(place(&mut g, Kind::Sare, 1, Niche::Asculta), Err(Refusal::DoesNotFit));
}

/// Days 1-3: two wanders, then the lullaby heard; a Nume lies on the table on day 4.
fn a_name(g: &mut Game) {
    wander(g, false);
    wander(g, false);
    place(g, Kind::CantecDeLeagan, 1, Niche::Asculta).unwrap();
    close(g);
}

#[test]
fn speaking_a_name_at_the_door_keeps_the_name_and_brings_a_blessing_for_a_day() {
    let mut g = game();
    a_name(&mut g);
    place(&mut g, Kind::Nume, 1, Niche::Descanta).unwrap();
    close(&mut g);
    assert!(last_close(&g).contains(&Event::DoorAnswered));
    assert_eq!(on_table(&g, Kind::Nume).len(), 1);
    assert_eq!(on_table(&g, Kind::Binecuvantare).len(), 1);
}

#[test]
fn the_next_wander_under_a_blessing_draws_one_more_dor_and_spends_it() {
    // a two-day blessing, so spending it differs from its fading
    let mut g = begin(Config { binecuvantare_zile: 2, ..cfg() }, 7);
    a_name(&mut g);
    place(&mut g, Kind::Nume, 1, Niche::Descanta).unwrap();
    close(&mut g); // day 4: the blessing arrives
    let got = wander(&mut g, false); // day 5: wander 3 of Codrii (Fier + Dor) with the blessing
    assert_eq!(got, vec![Kind::Fier, Kind::FirDeDor, Kind::FirDeDor]);
    assert_eq!(count(&g, Kind::Binecuvantare), 0, "spent by the wander, a day early");
}

#[test]
fn an_unused_blessing_fades_after_its_day() {
    let mut g = game();
    a_name(&mut g);
    place(&mut g, Kind::Nume, 1, Niche::Descanta).unwrap();
    close(&mut g);
    assert_eq!(count(&g, Kind::Binecuvantare), 1);
    close(&mut g);
    assert_eq!(count(&g, Kind::Binecuvantare), 0);
}

// ---------------------------------------------------------------- GAZDUIESTE and coliva

#[test]
fn the_hearth_makes_coliva_from_wheat_with_no_guest() {
    let mut g = game();
    hearth(&mut g);
    close(&mut g);
    assert_eq!(arrivals(&g), vec![Kind::Coliva]);
    assert_eq!(count(&g, Kind::Grau), 0);
}

#[test]
fn coliva_stays_four_full_days_then_spoils() {
    let mut g = game();
    hearth(&mut g);
    close(&mut g); // made at the close of day 1
    for _ in 0..3 {
        close(&mut g);
    }
    assert_eq!(count(&g, Kind::Coliva), 1, "still there on day 5");
    close(&mut g);
    assert_eq!(count(&g, Kind::Coliva), 0, "gone at the close of day 5");
}

/// Four wanders: the peddler arrives with the fourth, at the close of day 4.
fn the_peddler(g: &mut Game) {
    for _ in 0..4 {
        wander(g, false);
    }
}

#[test]
fn the_peddler_sells_wheat_for_bog_iron() {
    let mut g = game();
    the_peddler(&mut g);
    place(&mut g, Kind::Negustor, 1, Niche::Gazdui).unwrap();
    place(&mut g, Kind::Fier, 1, Niche::Gazdui).unwrap();
    close(&mut g);
    assert!(arrivals(&g).contains(&Kind::Grau));
    assert_eq!(count(&g, Kind::Fier), 0);
    assert_eq!(on_table(&g, Kind::Negustor).len(), 1);
}

#[test]
fn the_peddler_takes_a_thread_of_longing_as_payment() {
    let mut g = game();
    the_peddler(&mut g);
    let dor = count(&g, Kind::FirDeDor);
    place(&mut g, Kind::FirDeDor, 3, Niche::Gazdui).unwrap();
    place(&mut g, Kind::Negustor, 1, Niche::Gazdui).unwrap();
    assert_eq!(in_niche(&g, Niche::Gazdui), sorted(vec![Kind::Negustor, Kind::FirDeDor]));
    close(&mut g);
    assert!(arrivals(&g).contains(&Kind::Grau));
    assert!(count(&g, Kind::FirDeDor) < dor);
}

#[test]
fn the_hearth_does_not_cook_while_a_guest_sits_at_it() {
    let mut g = game();
    the_peddler(&mut g);
    place(&mut g, Kind::Negustor, 1, Niche::Gazdui).unwrap();
    assert_eq!(place(&mut g, Kind::Grau, 1, Niche::Gazdui), Err(Refusal::DoesNotFit));
}

#[test]
fn the_peddler_stays_two_days_and_comes_back_on_day_seven() {
    let mut g = game();
    the_peddler(&mut g); // arrives at the close of day 4
    close(&mut g);
    assert_eq!(count(&g, Kind::Negustor), 1, "day 6");
    close(&mut g); // the close of day 6: his two days are over, and he comes back for day 7
    assert_eq!(count(&g, Kind::Negustor), 1, "day 7");
    close(&mut g);
    assert_eq!(count(&g, Kind::Negustor), 1, "day 8");
    close(&mut g);
    assert_eq!(count(&g, Kind::Negustor), 0, "day 9: gone");
}

#[test]
fn the_peddler_comes_on_day_seven_even_unmet() {
    let mut g = game();
    for _ in 0..6 {
        close(&mut g);
    }
    assert_eq!(count(&g, Kind::Negustor), 1);
}

// ---------------------------------------------------------------- the offering and the marks

#[test]
fn coliva_is_offered_to_cel_nenuntit_only_on_his_days() {
    let mut g = game();
    hearth(&mut g);
    close(&mut g); // day 2: coliva on the cloth
    assert_eq!(offer(&mut g), Err(Refusal::DoesNotFit), "day 2 is no soroc");
    close(&mut g); // day 3
    offer(&mut g).unwrap();
    assert_eq!(count(&g, Kind::Coliva), 0);
    close(&mut g);
    assert!(last_close(&g).contains(&Event::MarkHeld { soroc: 3 }));
}

#[test]
fn a_soroc_without_coliva_is_missed() {
    let mut g = game();
    for _ in 0..3 {
        close(&mut g);
    }
    assert!(last_close(&g).contains(&Event::MarkMissed { soroc: 3 }));
}

#[test]
fn only_coliva_is_offered() {
    let mut g = game();
    close(&mut g);
    close(&mut g);
    assert_eq!(place_on(&mut g, Kind::Grau, 1, Target::Nenuntit), Err(Refusal::DoesNotFit));
}

#[test]
fn the_offering_stays_open_under_frant() {
    let mut g = begin(Config { dor_zile: 1, ..cfg() }, 7);
    hearth(&mut g);
    wander(&mut g, true); // day 1: coliva made, three Dor that rot at the next close
    close(&mut g); // day 2 closes: three Jale, the watcher breaks
    assert!(g.state.frant);
    assert_eq!(g.state.day, 3);
    offer(&mut g).unwrap();
}

// ---------------------------------------------------------------- the two endings

/// A watcher who keeps both marks: coliva for day 3 from the kit's wheat, for day 9 from the peddler's.
fn kept_wake(g: &mut Game) {
    hearth(g); // day 1: the kit's wheat to the hearth
    wander(g, false);
    wander(g, false); // day 2
    offer(g).unwrap(); // day 3: the first mark
    wander(g, false);
    wander(g, false); // day 4: the peddler arrives at its close
    place(g, Kind::Negustor, 1, Niche::Gazdui).unwrap();
    place(g, Kind::Fier, 1, Niche::Gazdui).unwrap();
    close(g); // day 5: wheat bought
    hearth(g);
    close(g); // day 6: coliva for day 9 made (it lasts days 7 to 10)
    close(g);
    close(g); // days 7, 8
    offer(g).unwrap(); // day 9: the second mark
    close(g);
}

#[test]
fn a_wake_that_keeps_both_marks_ends_with_the_pomelnic() {
    let mut g = game();
    kept_wake(&mut g);
    assert_eq!(g.state.phase, Phase::Ended);
    assert_eq!(g.state.ending, Some(Ending::Pomelnic));
    assert!(last_close(&g).contains(&Event::MarkHeld { soroc: 9 }));
}

#[test]
fn one_missed_mark_brings_the_bride_on_day_nine() {
    let mut g = game();
    hearth(&mut g);
    close(&mut g);
    close(&mut g);
    offer(&mut g).unwrap(); // day 3 kept
    for _ in 3..=9 {
        close(&mut g); // nothing for day 9
    }
    assert_eq!(g.state.phase, Phase::Ended);
    assert!(g.state.log.iter().any(|e| e.event == Event::MarkHeld { soroc: 3 }));
    assert!(last_close(&g).contains(&Event::MarkMissed { soroc: 9 }));
    assert_eq!(g.state.ending, Some(Ending::Cununie));
}
