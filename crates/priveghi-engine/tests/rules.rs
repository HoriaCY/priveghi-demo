//! Rules of the wake, step 1: the day clock, Dor decay, UMBLA, BOCESTE, determinism, saves.
//! Tests pin their own numbers (`cfg`), so they test the mechanics, not today's defaults.

mod common;

use common::*;
use priveghi_engine::*;
use serde_json::Value;

// ---------------------------------------------------------------- the day clock

#[test]
fn the_day_closes_when_its_time_runs_out() {
    let mut g = game();
    g.apply(Action::Tick, T0 + 59_999).unwrap();
    assert_eq!(g.state.day, 1);
    g.apply(Action::Tick, T0 + 60_000).unwrap();
    assert_eq!(g.state.day, 2);
    assert_eq!(g.state.clock.day_ends_at, T0 + 120_000);
}

#[test]
fn the_precue_sounds_four_tenths_of_a_second_before_the_close_once() {
    let mut g = game();
    g.apply(Action::Tick, T0 + 59_599).unwrap();
    assert_eq!(precues(&g), 0);
    g.apply(Action::Tick, T0 + 59_600).unwrap();
    assert_eq!(precues(&g), 1);
    assert_eq!(g.state.day, 1);
    g.apply(Action::Tick, T0 + 59_800).unwrap();
    assert_eq!(precues(&g), 1);
}

#[test]
fn tapping_the_flame_closes_the_day_after_the_precue() {
    let mut g = game();
    g.apply(Action::Tap { on: TapOn::Flame }, T0 + 5_000).unwrap();
    assert_eq!(precues(&g), 1);
    g.apply(Action::Tick, T0 + 5_399).unwrap();
    assert_eq!(g.state.day, 1);
    g.apply(Action::Tick, T0 + 5_400).unwrap();
    assert_eq!(g.state.day, 2);
    assert_eq!(last_close(&g)[0], Event::DayClosed { early: true });
    assert_eq!(g.state.clock.day_ends_at, T0 + 65_400);
}

#[test]
fn pause_stops_the_clock() {
    let mut g = game();
    g.apply(Action::Pause, T0 + 10_000).unwrap();
    g.apply(Action::Tick, T0 + 900_000).unwrap();
    assert_eq!(g.state.day, 1);
    g.apply(Action::Resume, T0 + 900_000).unwrap();
    g.apply(Action::Tick, T0 + 949_999).unwrap();
    assert_eq!(g.state.day, 1);
    g.apply(Action::Tick, T0 + 950_000).unwrap();
    assert_eq!(g.state.day, 2);
}

#[test]
fn a_long_gap_between_ticks_closes_one_day_not_many() {
    let mut g = game();
    g.apply(Action::Tick, T0 + 600_000).unwrap();
    assert_eq!(g.state.day, 2);
    assert_eq!(g.state.clock.day_ends_at, T0 + 660_000);
}

#[test]
fn a_tick_that_changes_nothing_says_so() {
    let mut g = game();
    assert_eq!(g.apply(Action::Tick, T0 + 1_000), Ok(false));
    assert_eq!(g.apply(Action::Tick, T0 + 59_600), Ok(true));
}

#[test]
fn the_wake_ends_at_the_ninth_close() {
    let mut g = game();
    for _ in 0..8 {
        close(&mut g);
    }
    assert_eq!((g.state.day, g.state.phase), (9, Phase::Wake));
    close(&mut g);
    assert_eq!(g.state.phase, Phase::Ended);
    assert_eq!(g.apply(Action::CloseDay, T0), Err(Refusal::NotNow));
    assert_eq!(g.apply(Action::Tick, T0 + 10_000_000), Ok(false));
}

// ---------------------------------------------------------------- Dor decay

#[test]
fn a_dor_loses_a_grain_at_each_later_close_and_rots_to_jale_at_the_third() {
    let mut g = game();
    wander(&mut g, false); // day 1 closes: two Dor arrive
    assert_eq!(dor_grains(&g), vec![3, 3]);
    close(&mut g);
    assert_eq!(dor_grains(&g), vec![2, 2]);
    close(&mut g);
    assert_eq!(dor_grains(&g), vec![1, 1]);
    assert_eq!(count(&g, Kind::Jale), 0);
    close(&mut g);
    assert_eq!(dor_grains(&g), Vec::<u8>::new());
    assert_eq!(on_table(&g, Kind::Jale).len(), 2);
}

// ---------------------------------------------------------------- UMBLA

#[test]
fn the_first_four_wanders_in_codrii_follow_the_brief() {
    let mut g = game();
    assert_eq!(wander(&mut g, false), sorted(vec![Kind::FirDeDor, Kind::FirDeDor]));
    assert_eq!(wander(&mut g, false), sorted(vec![Kind::FirDeDor, Kind::CantecDeLeagan]));
    assert_eq!(wander(&mut g, false), sorted(vec![Kind::Fier, Kind::FirDeDor]));
    assert_eq!(wander(&mut g, false), sorted(vec![Kind::Negustor, Kind::FirDeDor]));
}

#[test]
fn late_wanders_draw_one_or_two_dor_and_a_cantec_on_every_third() {
    for seed in 1..=20 {
        let mut g = Game::with_config(cfg_long(), seed, T0);
        for _ in 1..=4 {
            wander(&mut g, false);
        }
        for w in 5..=12u32 {
            let got = wander(&mut g, false);
            let dor = got.iter().filter(|k| **k == Kind::FirDeDor).count();
            let cantec = got.iter().filter(|k| **k == Kind::CantecDeLeagan).count();
            assert!((1..=2).contains(&dor), "seed {seed}, wander {w}: {got:?}");
            assert_eq!(cantec, usize::from(w % 3 == 0), "seed {seed}, wander {w}: {got:?}");
            assert_eq!(got.len(), dor + cantec, "seed {seed}, wander {w}: {got:?}");
        }
    }
}

#[test]
fn the_seed_decides_the_late_draws() {
    let late = |seed: u64| {
        let mut g = Game::with_config(cfg_long(), seed, T0);
        for _ in 1..=4 {
            wander(&mut g, false);
        }
        (5..=12).map(|_| wander(&mut g, false)).collect::<Vec<_>>()
    };
    assert_eq!(late(3), late(3));
    assert!((4..=20u64).any(|s| late(s) != late(3)));
}

#[test]
fn the_place_card_comes_back_to_the_table_after_the_wander() {
    let mut g = game();
    place(&mut g, Kind::CodriiVlasiei, 1, Niche::Umbla).unwrap();
    assert_eq!(in_niche(&g, Niche::Umbla), vec![Kind::CodriiVlasiei]);
    close(&mut g);
    assert_eq!(count(&g, Kind::FirDeDor), 2);
    assert_eq!(on_table(&g, Kind::CodriiVlasiei).len(), 1);
    assert!(in_niche(&g, Niche::Umbla).is_empty());
}

#[test]
fn a_candle_burnt_on_the_road_adds_one_dor_and_is_spent() {
    let mut g = game();
    let wax = count(&g, Kind::Lumanare);
    assert_eq!(wander(&mut g, true), vec![Kind::FirDeDor; 3]);
    assert_eq!(count(&g, Kind::Lumanare), wax - 1);
}

#[test]
fn umbla_takes_a_place_and_at_most_one_candle() {
    let mut g = game();
    assert_eq!(place(&mut g, Kind::Rada, 1, Niche::Umbla), Err(Refusal::DoesNotFit));
    place(&mut g, Kind::Lumanare, 3, Niche::Umbla).unwrap();
    assert_eq!(in_niche(&g, Niche::Umbla), vec![Kind::Lumanare]);
    place(&mut g, Kind::CodriiVlasiei, 1, Niche::Umbla).unwrap();
    assert_eq!(in_niche(&g, Niche::Umbla), sorted(vec![Kind::CodriiVlasiei, Kind::Lumanare]));
}

#[test]
fn an_umbla_without_a_place_gives_its_cards_back_at_the_close() {
    let mut g = game();
    let wax = count(&g, Kind::Lumanare);
    place(&mut g, Kind::Lumanare, 1, Niche::Umbla).unwrap();
    assert_eq!(in_niche(&g, Niche::Umbla), vec![Kind::Lumanare]);
    close(&mut g);
    assert!(in_niche(&g, Niche::Umbla).is_empty());
    assert_eq!(on_table(&g, Kind::Lumanare).len(), wax);
    assert!(last_close(&g).iter().any(|e| matches!(e, Event::Returned { niche: Niche::Umbla, .. })));
    assert_eq!(count(&g, Kind::FirDeDor), 0);
}

#[test]
fn cards_placed_today_can_be_taken_back_before_the_close() {
    let mut g = game();
    place(&mut g, Kind::CodriiVlasiei, 1, Niche::Umbla).unwrap();
    let ids = niche_ids(&g, Niche::Umbla);
    assert_eq!(ids.len(), 1);
    g.apply(Action::Unplace { cards: ids }, T0).unwrap();
    assert!(in_niche(&g, Niche::Umbla).is_empty());
    close(&mut g);
    assert_eq!(count(&g, Kind::FirDeDor), 0);
    assert_eq!(on_table(&g, Kind::CodriiVlasiei).len(), 1);
}

// ---------------------------------------------------------------- BOCESTE

/// Two wanders: by day 3 three Dor lie on the table.
fn three_dor(g: &mut Game) {
    wander(g, false);
    wander(g, false);
}

#[test]
fn a_dor_sitting_runs_two_days_then_consumes_the_dor_and_lights_a_pip() {
    let mut g = game();
    three_dor(&mut g);
    place(&mut g, Kind::FirDeDor, 3, Niche::Boci).unwrap();
    place(&mut g, Kind::Rada, 1, Niche::Boci).unwrap();
    close(&mut g); // day 3: the sitting starts
    let run = g.state.runs[&Niche::Boci];
    assert_eq!((run.days, run.days_left), (2, 1));
    assert_eq!(
        in_niche(&g, Niche::Boci),
        sorted(vec![Kind::Rada, Kind::FirDeDor, Kind::FirDeDor, Kind::FirDeDor])
    );
    assert_eq!(g.state.bocete, 0);
    close(&mut g); // day 4: it resolves; the oldest two would have rotted on the table at this close
    assert!(in_niche(&g, Niche::Boci).is_empty());
    assert_eq!(count(&g, Kind::FirDeDor), 0);
    assert_eq!(count(&g, Kind::Jale), 0);
    assert_eq!(g.state.bocete, 1);
    assert_eq!(on_table(&g, Kind::Bocet).len(), 1);
    assert_eq!(on_table(&g, Kind::Rada).len(), 1);
    assert!(last_close(&g).contains(&Event::Pip { bocete: 1 }));
}

/// Three lit wanders: by day 4 seven Dor lie on the table.
fn seven_dor(g: &mut Game) {
    wander(g, true);
    wander(g, true);
    wander(g, true);
}

#[test]
fn a_sitting_of_six_dor_lights_two_pips() {
    let mut g = game();
    seven_dor(&mut g);
    place(&mut g, Kind::Rada, 1, Niche::Boci).unwrap();
    place(&mut g, Kind::FirDeDor, 6, Niche::Boci).unwrap();
    close(&mut g);
    close(&mut g);
    assert_eq!(g.state.bocete, 2);
    assert_eq!(on_table(&g, Kind::Bocet).len(), 2);
}

#[test]
fn a_sitting_takes_at_most_six_dor() {
    let mut g = game();
    seven_dor(&mut g);
    place(&mut g, Kind::Rada, 1, Niche::Boci).unwrap();
    place(&mut g, Kind::FirDeDor, 7, Niche::Boci).unwrap();
    let dor_inside = in_niche(&g, Niche::Boci).iter().filter(|k| **k == Kind::FirDeDor).count();
    assert_eq!(dor_inside, 6);
}

#[test]
fn a_sitting_short_of_three_dor_gives_everything_back_at_the_close() {
    let mut g = game();
    wander(&mut g, false);
    place(&mut g, Kind::Rada, 1, Niche::Boci).unwrap();
    place(&mut g, Kind::FirDeDor, 2, Niche::Boci).unwrap();
    close(&mut g);
    assert!(in_niche(&g, Niche::Boci).is_empty());
    assert_eq!(dor_grains(&g), vec![2, 2]);
    assert_eq!(on_table(&g, Kind::Rada).len(), 1);
}

/// One wander, then three closes: both Dor rot, two Jale lie on the table on day 5.
fn two_jale(g: &mut Game) {
    wander(g, false);
    close(g);
    close(g);
    close(g);
}

#[test]
fn a_jale_sitting_clears_every_jale_in_one_day() {
    let mut g = game();
    two_jale(&mut g);
    assert_eq!(count(&g, Kind::Jale), 2);
    place(&mut g, Kind::Rada, 1, Niche::Boci).unwrap();
    place(&mut g, Kind::Jale, 2, Niche::Boci).unwrap();
    assert_eq!(in_niche(&g, Niche::Boci), sorted(vec![Kind::Rada, Kind::Jale]));
    close(&mut g);
    assert_eq!(count(&g, Kind::Jale), 0);
    assert_eq!(g.state.bocete, 0);
    assert_eq!(on_table(&g, Kind::Rada).len(), 1);
    assert!(last_close(&g).contains(&Event::JaleMourned { n: 2 }));
}

#[test]
fn a_sitting_never_mixes_dor_and_jale() {
    let mut g = game();
    wander(&mut g, false);
    wander(&mut g, false);
    close(&mut g);
    close(&mut g);
    // day 5: two Jale, one Dor with a single grain
    place(&mut g, Kind::Rada, 1, Niche::Boci).unwrap();
    place(&mut g, Kind::FirDeDor, 1, Niche::Boci).unwrap();
    assert_eq!(place(&mut g, Kind::Jale, 1, Niche::Boci), Err(Refusal::DoesNotFit));
}

#[test]
fn a_working_niche_is_sealed_until_it_resolves() {
    let mut g = game();
    three_dor(&mut g);
    place(&mut g, Kind::Rada, 1, Niche::Boci).unwrap();
    place(&mut g, Kind::FirDeDor, 3, Niche::Boci).unwrap();
    close(&mut g);
    let inside = niche_ids(&g, Niche::Boci);
    assert_eq!(g.apply(Action::Unplace { cards: inside }, T0), Err(Refusal::Busy));
    assert_eq!(place(&mut g, Kind::Lumanare, 1, Niche::Boci), Err(Refusal::Busy));
}

#[test]
fn an_early_close_resolves_in_the_published_order() {
    // Decays come before verb resolutions (brief §3.6): a Dor that rots at this close is
    // mourned by the Jale sitting that resolves at it.
    let mut g = game();
    wander(&mut g, false);
    wander(&mut g, false);
    close(&mut g);
    close(&mut g);
    // day 5: two Jale, one Dor with a single grain
    place(&mut g, Kind::Rada, 1, Niche::Boci).unwrap();
    place(&mut g, Kind::Jale, 1, Niche::Boci).unwrap();
    g.apply(Action::Tap { on: TapOn::Flame }, T0 + 1_000).unwrap();
    g.apply(Action::Tick, T0 + 1_400).unwrap();
    assert_eq!(count(&g, Kind::Jale), 0);
    let order: Vec<String> = last_close(&g).iter().map(event_name).collect();
    assert_eq!(
        order,
        ["day_closed", "started", "rotted", "resolved", "jale_mourned", "day_began"].map(String::from)
    );
}

// ---------------------------------------------------------------- refusals

#[test]
fn placing_refuses_unknown_fixed_and_empty() {
    let mut g = game();
    let umbla = Target::Niche(Niche::Umbla);
    assert_eq!(g.apply(Action::Place { cards: vec![9_999], target: umbla }, T0), Err(Refusal::NoSuchCard));
    let plank: Vec<u32> =
        g.state.cards.iter().filter(|c| c.kind == Kind::CelNenuntit).map(|c| c.id).collect();
    assert_eq!(g.apply(Action::Place { cards: plank, target: umbla }, T0), Err(Refusal::Fixed));
    assert_eq!(g.apply(Action::Place { cards: vec![], target: umbla }, T0), Err(Refusal::Nothing));
}

#[test]
fn a_refused_action_changes_nothing() {
    let mut g = game();
    let before = g.clone();
    assert!(place(&mut g, Kind::Rada, 1, Niche::Umbla).is_err());
    assert_eq!(g, before);
}

// ---------------------------------------------------------------- determinism and saves

fn scripted(seed: u64) -> Game {
    let mut g = Game::with_config(cfg_long(), seed, T0);
    for day in 0..12 {
        wander(&mut g, day % 4 == 0);
        if day == 5 {
            place(&mut g, Kind::Rada, 1, Niche::Boci).unwrap();
            place(&mut g, Kind::FirDeDor, 6, Niche::Boci).unwrap();
        }
    }
    g
}

#[test]
fn the_same_seed_and_the_same_actions_give_the_same_log() {
    let (a, b) = (scripted(11), scripted(11));
    assert!(a.state.log.len() > 50);
    assert_eq!(a.state.log, b.state.log);
    assert_eq!(a, b);
}

#[test]
fn a_saved_game_loads_and_plays_on_identically() {
    let mut a = Game::with_config(cfg_long(), 5, T0);
    for _ in 0..5 {
        wander(&mut a, false);
    }
    let mut b: Game = serde_json::from_str(&serde_json::to_string(&a).unwrap()).unwrap();
    for _ in 0..5 {
        wander(&mut a, false);
        wander(&mut b, false);
    }
    assert_eq!(a, b);
}

/// What a browser does to a save: JSON.parse makes every number an f64, JSON.stringify writes it back.
fn through_f64(v: Value) -> Value {
    match v {
        Value::Number(n) => {
            let f = n.as_f64().unwrap();
            if f.fract() == 0.0 && f >= 0.0 {
                Value::from(f as u64)
            } else {
                Value::from(f)
            }
        }
        Value::Array(a) => Value::Array(a.into_iter().map(through_f64).collect()),
        Value::Object(o) => Value::Object(o.into_iter().map(|(k, v)| (k, through_f64(v))).collect()),
        other => other,
    }
}

#[test]
fn a_save_survives_browser_number_precision() {
    let mut a = Game::with_config(cfg_long(), u64::MAX - 12_345, T0);
    for _ in 0..5 {
        wander(&mut a, false);
    }
    let parsed: Value = serde_json::from_str(&serde_json::to_string(&a).unwrap()).unwrap();
    let mut b: Game = serde_json::from_value(through_f64(parsed)).unwrap();
    for _ in 0..5 {
        wander(&mut a, false);
        wander(&mut b, false);
    }
    assert_eq!(a, b);
}
