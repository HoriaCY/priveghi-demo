//! The dead's wake, step 1: the rules one by one, each pinned to its chapter section. The day's two
//! halves, STINGE and the rest, the acts and their verbs, the Amintire's strength, Pomenire, the
//! close's order, the soroace, the candle, the priest, the Hunter, the burial, the endings.

mod v3;

use priveghi_engine::v3::*;
use v3::*;

fn with(f: impl FnOnce(&mut Config)) -> Wake {
    let mut c = Config::default();
    f(&mut c);
    begin(c)
}

// ---------------------------------------------------------------- the table on day one

#[test]
fn they_bring_you_home_to_a_table_with_the_house_and_the_mother() {
    let w = wake();
    assert_eq!(w.state.phase, Phase::Wake);
    assert_eq!(you(&w).at, Where::Plank);
    assert!(w.state.candle && !w.state.night);
    let kit: Vec<Lucru> = w
        .state
        .cards
        .iter()
        .filter(|c| c.at == Where::Kit)
        .filter_map(|c| match &c.kind {
            Kind::Lucru { lucru, .. } => Some(*lucru),
            _ => None,
        })
        .collect();
    assert_eq!(kit, vec![Lucru::Cana, Lucru::Broboada, Lucru::Inel, Lucru::Icoana, Lucru::Oglinda]);
    let road: Vec<Loc> = w
        .state
        .cards
        .iter()
        .filter(|c| c.at == Where::Road)
        .filter_map(|c| match &c.kind {
            Kind::Loc { loc, .. } => Some(*loc),
            _ => None,
        })
        .collect();
    assert_eq!(road, vec![Loc::Casa, Loc::Tinda, Loc::Curte]);
    let present: Vec<Om> = w
        .state
        .cards
        .iter()
        .filter(|c| c.at == Where::Cloth)
        .filter_map(|c| match &c.kind {
            Kind::Om { om, .. } => Some(*om),
            _ => None,
        })
        .collect();
    assert_eq!(present, vec![Om::Mama, Om::Frate, Om::Rada], "the sworn brother sits the vigil nights");
    assert!(w.state.log.iter().any(|e| e.event == Event::BroughtHome));
}

#[test]
fn in_the_dark_nothing_moves_until_they_bring_you_home() {
    let mut w = Wake::with_config(Config::default(), T0);
    assert_eq!(w.state.phase, Phase::Boot);
    assert_eq!(w.apply(Action::Tick, T0 + 600_000), Ok(false));
    assert_eq!(w.apply(Action::Stinge, T0), Err(Refusal::NotNow));
    assert_eq!(w.state.day, 1);
}

// ---------------------------------------------------------------- the day, the night, the candle (§3)

#[test]
fn the_last_twenty_seconds_of_the_day_are_night_and_the_day_closes_at_sixty() {
    let mut w = wake();
    assert_eq!(w.apply(Action::Tick, T0 + 39_999), Ok(false));
    assert!(!w.state.night);
    assert_eq!(w.apply(Action::Tick, T0 + 40_000), Ok(true));
    assert!(w.state.night);
    w.apply(Action::Tick, T0 + 59_999).unwrap();
    assert_eq!(w.state.day, 1);
    w.apply(Action::Tick, T0 + 60_000).unwrap();
    assert_eq!(w.state.day, 2);
    assert!(!w.state.night, "a new day begins with the candle lit");
    assert_eq!(w.state.clock.dusk_at, T0 + 100_000);
}

#[test]
fn the_precue_sounds_once_before_the_close() {
    let mut w = wake();
    w.apply(Action::Tick, T0 + 59_599).unwrap();
    assert_eq!(w.state.log.iter().filter(|e| e.event == Event::Precue).count(), 0);
    w.apply(Action::Tick, T0 + 59_600).unwrap();
    assert_eq!(w.state.log.iter().filter(|e| e.event == Event::Precue).count(), 1);
    w.apply(Action::Tick, T0 + 59_800).unwrap();
    assert_eq!(w.state.log.iter().filter(|e| e.event == Event::Precue).count(), 1);
}

#[test]
fn stinge_brings_the_night_now_and_the_living_notice() {
    let mut w = wake();
    assert_eq!(w.apply(Action::Stinge, T0 + 5_000), Ok(true));
    assert!(w.state.night);
    assert_eq!(w.state.spaima, 1);
    assert_eq!(w.state.clock.day_ends_at, T0 + 60_000, "the day still closes at its hour");
    assert_eq!(w.apply(Action::Stinge, T0 + 6_000), Err(Refusal::NotNow));
}

#[test]
fn rest_closes_the_day_after_the_precue_refills_putere_and_calms_the_house() {
    let mut w = wake();
    w.apply(Action::Stinge, T0 + 5_000).unwrap();
    let id = lucru_id(&w, Lucru::Cana);
    let _ = id;
    w.state.spaima = 2;
    w.state.putere = 1;
    assert_eq!(w.apply(Action::Rest, T0 + 10_000), Ok(true));
    assert_eq!(
        w.apply(Action::Stinge, T0 + 10_100),
        Err(Refusal::NotNow),
        "nothing happens while the day closes"
    );
    w.apply(Action::Tick, T0 + 10_400).unwrap();
    assert_eq!(w.state.day, 2);
    assert_eq!(w.state.putere, 4);
    assert_eq!(w.state.spaima, 0, "rest takes one, the close takes one");
    assert_eq!(w.state.stats.rested, 1);
    assert!(last_close(&w).contains(&Event::Rested));
}

#[test]
fn a_night_act_cords_the_troita_until_dawn() {
    let mut w = wake();
    close(&mut w); // day 2: a Dor arrives
    let d = dor_ids(&w, Where::Cloth)[0];
    let now = dusk(&mut w);
    let mama = om_id(&w, Om::Mama);
    act(&mut w, d, mama, Grade::Bun, now).unwrap();
    assert_eq!(w.apply(Action::Rest, now), Err(Refusal::Corded));
    close(&mut w);
    assert_eq!(w.apply(Action::Rest, by_day(&w)), Ok(true));
}

#[test]
fn pause_stops_both_the_dusk_and_the_close() {
    let mut w = wake();
    w.apply(Action::Pause, T0 + 10_000).unwrap();
    assert_eq!(w.apply(Action::Tick, T0 + 900_000), Ok(false));
    assert!(!w.state.night);
    w.apply(Action::Resume, T0 + 900_000).unwrap();
    assert_eq!(w.state.clock.dusk_at, T0 + 930_000);
    assert_eq!(w.state.clock.day_ends_at, T0 + 950_000);
}

#[test]
fn a_long_gap_between_ticks_closes_one_day_not_many() {
    let mut w = wake();
    w.apply(Action::Tick, T0 + 600_000).unwrap();
    assert_eq!(w.state.day, 2);
    assert_eq!(w.state.clock.day_ends_at, T0 + 660_000);
}

// ---------------------------------------------------------------- Dor (§4)

#[test]
fn no_dor_on_day_one_two_on_day_two_from_the_mother_and_the_betrothed() {
    let mut w = wake();
    assert!(dor_ids(&w, Where::Cloth).is_empty(), "the accumulators start at nothing");
    close(&mut w);
    let got: Vec<(Fel, Om)> = dor_ids(&w, Where::Cloth)
        .iter()
        .map(|d| {
            let (f, o, _) = dor(&w, *d);
            (f, o)
        })
        .collect();
    assert_eq!(got, vec![(Fel::Neam, Om::Mama), (Fel::Dragoste, Om::Draguta)]);
}

#[test]
fn a_dor_is_exempt_at_the_close_it_arrives_and_gutters_at_the_third_close_after() {
    let mut w = wake();
    close(&mut w); // close 1: day 2's Dor arrive with three days
    let d = dor_ids(&w, Where::Cloth)[0];
    assert_eq!(dor(&w, d).2, 3);
    close(&mut w);
    assert_eq!(dor(&w, d).2, 2);
    close(&mut w);
    assert_eq!(dor(&w, d).2, 1);
    assert_eq!(w.state.uitare, 0);
    close(&mut w);
    assert!(w.state.cards.iter().all(|c| c.id != d));
    assert!(w.state.uitare >= 1);
    assert!(last_close(&w).iter().any(|e| matches!(e, Event::Guttered { card, .. } if *card == d)));
}

#[test]
fn the_house_sends_at_most_three_dor_a_day_and_one_per_person() {
    let mut w = with(|c| c.base_m = [999, 999, 999, 999, 999]);
    let got = dor_ids(&w, Where::Cloth);
    assert_eq!(got.len(), 3, "five long for you on day one; the house's attention holds three");
    let mut from: Vec<Om> = got.iter().map(|d| dor(&w, *d).1).collect();
    from.sort();
    from.dedup();
    assert_eq!(from.len(), 3);
    close(&mut w);
    assert_eq!(dor_ids(&w, Where::Cloth).len(), 6, "the two who waited come first on day two");
}

#[test]
fn the_sill_slows_a_tied_dor_one_day_every_three_closes() {
    let mut w = wake();
    close(&mut w);
    let d = dor_ids(&w, Where::Cloth)[0];
    w.apply(Action::Tie { dor: d }, by_day(&w)).unwrap(); // tied on day 2
    assert_eq!(card(&w, d).at, Where::Sill);
    close(&mut w);
    close(&mut w);
    close(&mut w);
    assert_eq!(dor(&w, d).2, 3, "the closes of days 2, 3 and 4: untouched");
    close(&mut w);
    assert_eq!(
        dor(&w, d).2,
        2,
        "the close of day 5, three days after tying, takes one (the simulator's reading)"
    );
}

#[test]
fn the_sill_holds_three() {
    let mut w = with(|c| c.base_m = [999, 999, 999, 999, 999]);
    close(&mut w);
    close(&mut w);
    let loose = dor_ids(&w, Where::Cloth);
    assert!(loose.len() >= 4);
    for d in &loose[..3] {
        w.apply(Action::Tie { dor: *d }, by_day(&w)).unwrap();
    }
    assert_eq!(w.apply(Action::Tie { dor: loose[3] }, by_day(&w)), Err(Refusal::Full));
    w.apply(Action::Untie { dor: loose[0] }, by_day(&w)).unwrap();
    assert_eq!(card(&w, loose[0]).at, Where::Cloth);
}

// ---------------------------------------------------------------- the acts and the Amintire (§5, §6)

#[test]
fn the_mothers_longing_in_the_mothers_kerchief_is_a_living_memory() {
    let mut w = wake();
    close(&mut w);
    let d = dor_ids(&w, Where::Cloth)[0]; // Mama's, neam
    let broboada = lucru_id(&w, Lucru::Broboada);
    let now = by_day(&w);
    assert_eq!(w.apply(Action::Place { dor: d, on: broboada }, now), Ok(true));
    assert_eq!(w.state.putere, 3, "URNESTE costs one");
    assert_eq!(w.state.commit.map(|c| c.verb), Some(Verb::Urneste));
    assert_eq!(w.apply(Action::Place { dor: d, on: broboada }, now), Err(Refusal::Busy));
    w.apply(Action::Resolve { dor: d, grade: Grade::Bun }, now).unwrap();
    assert_eq!(w.state.amintiri[0], vec![Amintire { fel: Fel::Neam, strength: 2, day: 2 }]);
    assert_eq!(w.state.standing_m[0], 200 + 50, "two points, and a Pomenire that found nothing to forgive");
    assert_eq!(w.state.spaima, 2, "a nudge by day");
    assert_eq!(w.state.stats.pomeniri, 1);
    assert!(
        matches!(&card(&w, broboada).kind, Kind::Lucru { rests_until: 5, .. }),
        "a thing used rests three closes"
    );
    assert_eq!(
        w.apply(Action::Place { dor: dor_ids(&w, Where::Cloth)[0], on: broboada }, now),
        Err(Refusal::Spent)
    );
}

#[test]
fn the_wrong_thing_still_makes_a_faded_memory_never_a_wasted_turn() {
    let mut w = wake();
    close(&mut w);
    let d = dor_ids(&w, Where::Cloth)[1]; // Draguta's, dragoste
    let icoana = lucru_id(&w, Lucru::Icoana); // [rugaciune, neam], Mama's
    let now = by_day(&w);
    act(&mut w, d, icoana, Grade::Bun, now).unwrap();
    assert_eq!(w.state.amintiri[1][0].strength, 0);
    assert_eq!(w.state.standing_m[1], 0, "the betrothed gains no floor from a faded memory");
    assert_eq!(
        w.state.standing_m[0], 50,
        "the Pomenire's small floor goes to the icon's owner, who named you"
    );
    assert_eq!(w.state.stats.amintiri, [1, 0, 0, 0]);
}

#[test]
fn a_minunat_two_point_act_is_a_minune_once_per_kind_and_leaves_the_semn() {
    let mut w = wake();
    close(&mut w);
    let d = dor_ids(&w, Where::Cloth)[0];
    let broboada = lucru_id(&w, Lucru::Broboada);
    let now = by_day(&w);
    act(&mut w, d, broboada, Grade::Minunat, now).unwrap();
    assert_eq!(w.state.amintiri[0][0].strength, 3);
    assert_eq!(w.state.minuni, vec![Fel::Neam]);
    assert!(w.state.minune_promise);
    assert!(w.state.cards.iter().any(|c| c.at == Where::Cloth && c.kind == Kind::Semn { fel: Fel::Neam }));
    // the second neam Minunat is a living memory, not a second Minune
    close(&mut w);
    close(&mut w);
    let next = dor_ids(&w, Where::Cloth).into_iter().find(|d| dor(&w, *d).0 == Fel::Neam).unwrap();
    let icoana = lucru_id(&w, Lucru::Icoana);
    let now = by_day(&w);
    act(&mut w, next, icoana, Grade::Minunat, now).unwrap();
    assert_eq!(w.state.amintiri[0].last().unwrap().strength, 2);
}

#[test]
fn a_fumble_resolves_as_the_skip_and_both_count_as_bun() {
    let mut w = wake();
    close(&mut w);
    let ids = dor_ids(&w, Where::Cloth);
    let cana = lucru_id(&w, Lucru::Cana);
    let inel = lucru_id(&w, Lucru::Inel);
    let now = by_day(&w);
    act(&mut w, ids[0], cana, Grade::Slab, now).unwrap();
    let now = by_day(&w);
    act(&mut w, ids[1], inel, Grade::Skipped, now).unwrap();
    assert_eq!(w.state.stats.skipped, 2);
    let grades: Vec<Grade> = last_events(&w)
        .iter()
        .filter_map(|e| match e {
            Event::Resolved { grade, .. } => Some(*grade),
            _ => None,
        })
        .collect();
    assert_eq!(grades, vec![Grade::Skipped, Grade::Skipped]);
}

fn last_events(w: &Wake) -> Vec<Event> {
    w.state.log.iter().map(|e| e.event.clone()).collect()
}

#[test]
fn a_dream_is_only_by_night_and_only_one_a_night() {
    let mut w = wake();
    close(&mut w);
    let ids = dor_ids(&w, Where::Cloth);
    let mama = om_id(&w, Om::Mama);
    let now = by_day(&w);
    w.apply(Action::Place { dor: ids[0], on: mama }, now).unwrap();
    assert_eq!(
        w.state.commit.map(|c| c.verb),
        Some(Verb::Arata),
        "by day a Dor on a person is an apparition"
    );
    assert_eq!(w.state.putere, 2, "ARATA-TE costs two");
    w.apply(Action::Resolve { dor: ids[0], grade: Grade::Bun }, now).unwrap();
    assert_eq!(w.state.spaima, 3);
    let now = dusk(&mut w);
    w.apply(Action::Place { dor: ids[1], on: mama }, now).unwrap();
    assert_eq!(w.state.commit.map(|c| c.verb), Some(Verb::Sopteste));
    w.apply(Action::Resolve { dor: ids[1], grade: Grade::Bun }, now).unwrap();
    assert_eq!(w.state.dreamed_tonight, Some(Om::Mama));
    close(&mut w);
    close(&mut w);
    let d = dor_ids(&w, Where::Cloth)[0];
    let now = dusk(&mut w);
    w.apply(Action::Place { dor: d, on: mama }, now).unwrap();
    w.apply(Action::Resolve { dor: d, grade: Grade::Bun }, now).unwrap();
    let d2 = dor_ids(&w, Where::Cloth).first().copied();
    if let Some(d2) = d2 {
        assert_eq!(w.apply(Action::Place { dor: d2, on: mama }, now), Err(Refusal::Spent));
    }
}

#[test]
fn the_same_sleeper_two_nights_running_caps_the_match_and_frightens() {
    let mut w = with(|c| c.base_m = [999, 0, 0, 0, 0]);
    let mama = om_id(&w, Om::Mama);
    close(&mut w);
    let d = dor_ids(&w, Where::Cloth)[0];
    let now = dusk(&mut w);
    act(&mut w, d, mama, Grade::Bun, now).unwrap();
    assert_eq!(w.state.amintiri[0][0].strength, 2);
    close(&mut w);
    assert_eq!(w.state.last_dream, Some(Om::Mama));
    let d = dor_ids(&w, Where::Cloth)[0];
    let now = dusk(&mut w);
    let before = w.state.spaima;
    act(&mut w, d, mama, Grade::Bun, now).unwrap();
    assert_eq!(w.state.amintiri[0][1].strength, 1, "the troubled sleep");
    assert_eq!(w.state.spaima, before + 1);
}

#[test]
fn a_minunat_dream_leaves_a_pomana_for_three_days() {
    let mut w = with(|c| c.base_m = [999, 0, 0, 0, 0]);
    close(&mut w);
    let d = dor_ids(&w, Where::Cloth)[0];
    let mama = om_id(&w, Om::Mama);
    let now = dusk(&mut w);
    act(&mut w, d, mama, Grade::Minunat, now).unwrap();
    let pomana = w
        .state
        .cards
        .iter()
        .find(|c| matches!(&c.kind, Kind::Lucru { lucru: Lucru::Pomana, .. }))
        .cloned()
        .expect("a pomana");
    assert_eq!(pomana.at, Where::Kit);
    assert!(matches!(&pomana.kind, Kind::Lucru { owner: Some(Om::Mama), leaves_at: 5, .. }));
    assert_eq!(w.state.stats.pomane, 1);
    close(&mut w); // day 3
    close(&mut w); // day 4
    assert!(w.state.cards.iter().any(|c| c.id == pomana.id));
    close(&mut w); // the close of day 4 does not take it; the close of day 5 does
    assert!(w.state.cards.iter().any(|c| c.id == pomana.id));
    close(&mut w);
    assert!(w.state.cards.iter().all(|c| c.id != pomana.id));
}

#[test]
fn the_vigil_nights_cost_no_fright_for_a_night_nudge() {
    let mut w = wake();
    close(&mut w); // day 2
    let d = dor_ids(&w, Where::Cloth)[0];
    let cana = lucru_id(&w, Lucru::Cana);
    let now = dusk(&mut w);
    act(&mut w, d, cana, Grade::Bun, now).unwrap();
    assert_eq!(w.state.spaima, 0);
    close(&mut w); // day 3: the masks are off
    let d = dor_ids(&w, Where::Cloth)[0];
    let inel = lucru_id(&w, Lucru::Inel);
    let now = dusk(&mut w);
    act(&mut w, d, inel, Grade::Bun, now).unwrap();
    assert_eq!(w.state.spaima, 1);
}

#[test]
fn an_enemys_memory_made_calms_the_house() {
    let mut w = with(|c| c.base_m = [0, 0, 0, 999, 0]);
    close(&mut w);
    let d = dor_ids(&w, Where::Cloth)[0];
    assert_eq!(dor(&w, d).0, Fel::Vrajba);
    let oglinda = lucru_id(&w, Lucru::Oglinda); // [dragoste, vrajba]
    w.state.spaima = 3;
    let now = by_day(&w);
    act(&mut w, d, oglinda, Grade::Bun, now).unwrap();
    assert_eq!(w.state.spaima, 3 + 2 - 1);
}

#[test]
fn a_fragment_matches_any_dor_for_one_point_and_at_most_two_are_held() {
    let mut w = wake();
    let mama = om_id(&w, Om::Mama);
    let now = by_day(&w);
    w.apply(Action::Asculta { om: mama }, now).unwrap();
    w.apply(Action::Asculta { om: mama }, now).unwrap();
    assert_eq!(w.apply(Action::Asculta { om: mama }, now), Err(Refusal::Full));
    assert_eq!(w.state.putere, 4, "listening costs nothing");
    close(&mut w);
    let d = dor_ids(&w, Where::Cloth)[1];
    let f = franturi(&w)[0];
    let now = by_day(&w);
    act(&mut w, d, f, Grade::Bun, now).unwrap();
    assert_eq!(w.state.amintiri[1][0].strength, 1);
    assert_eq!(franturi(&w).len(), 1, "a fragment is spent");
    assert_eq!(w.state.stats.franturi_used, 1);
}

#[test]
fn a_play_left_open_at_the_close_resolves_as_the_skip() {
    let mut w = wake();
    close(&mut w);
    let d = dor_ids(&w, Where::Cloth)[0];
    let cana = lucru_id(&w, Lucru::Cana);
    w.apply(Action::Place { dor: d, on: cana }, by_day(&w)).unwrap();
    close(&mut w);
    assert!(w.state.commit.is_none());
    assert_eq!(w.state.stats.skipped, 1);
    assert_eq!(card(&w, cana).at, Where::Kit);
}

#[test]
fn no_putere_no_act() {
    let mut w = wake();
    close(&mut w);
    w.state.putere = 0;
    let d = dor_ids(&w, Where::Cloth)[0];
    let cana = lucru_id(&w, Lucru::Cana);
    assert_eq!(w.apply(Action::Place { dor: d, on: cana }, by_day(&w)), Err(Refusal::Tired));
    close(&mut w);
    assert_eq!(w.state.putere, 2, "two back at the close");
}

// ---------------------------------------------------------------- places (§9)

#[test]
fn the_village_opens_at_night_from_the_burial_and_brings_its_sleeper() {
    let mut w = wake();
    assert_eq!(card(&w, loc_id(&w, Loc::Sat)).at, Where::Away);
    close(&mut w);
    close(&mut w); // day 3
    let sat = loc_id(&w, Loc::Sat);
    assert_eq!(card(&w, sat).at, Where::Road);
    assert_eq!(w.apply(Action::Umbla { loc: sat }, by_day(&w)), Err(Refusal::OnlyAtNight));
    let now = dusk(&mut w);
    w.apply(Action::Umbla { loc: sat }, now).unwrap();
    assert_eq!(w.state.night_at, Some(Loc::Sat));
    assert_eq!(card(&w, om_id(&w, Om::Dusman)).at, Where::Cloth);
    assert_eq!(w.state.putere, 3);
    close(&mut w);
    assert_eq!(card(&w, om_id(&w, Om::Dusman)).at, Where::Away, "only on a night you went");
}

#[test]
fn the_church_once_walked_keeps_the_priest_within_reach() {
    let mut w = wake();
    close(&mut w);
    close(&mut w);
    let biserica = loc_id(&w, Loc::Biserica);
    let now = dusk(&mut w);
    w.apply(Action::Umbla { loc: biserica }, now).unwrap();
    assert!(w.state.biserica_known);
    close(&mut w);
    assert_eq!(card(&w, om_id(&w, Om::Preot)).at, Where::Cloth);
}

#[test]
fn the_first_wander_in_the_porch_brings_the_knife_and_the_flute_once() {
    let mut w = wake();
    let tinda = loc_id(&w, Loc::Tinda);
    w.apply(Action::Umbla { loc: tinda }, by_day(&w)).unwrap();
    assert!(matches!(
        &card(&w, lucru_id(&w, Lucru::Cutit)).kind,
        Kind::Lucru { owner: Some(Om::Dusman), .. }
    ));
    assert_eq!(card(&w, lucru_id(&w, Lucru::Fluier)).at, Where::Kit);
    w.apply(Action::Umbla { loc: tinda }, by_day(&w)).unwrap();
    assert_eq!(
        w.state.cards.iter().filter(|c| matches!(&c.kind, Kind::Lucru { lucru: Lucru::Cutit, .. })).count(),
        1
    );
    assert_eq!(w.state.stats.walks, 2);
}

#[test]
fn who_is_at_the_table_follows_the_days() {
    let mut w = with(|c| c.base_m = [0; 5]); // nothing to gutter: the wake reaches day nine untended
    let at = |w: &Wake, om: Om| card(w, om_id(w, om)).at;
    assert_eq!(at(&w, Om::Draguta), Where::Away);
    assert_eq!(at(&w, Om::Frate), Where::Cloth);
    close(&mut w); // day 2
    assert_eq!(at(&w, Om::Draguta), Where::Cloth);
    close(&mut w);
    close(&mut w); // day 4
    assert_eq!(at(&w, Om::Frate), Where::Away);
    assert_eq!(at(&w, Om::Rada), Where::Away);
    for _ in 4..9 {
        close(&mut w);
    }
    assert_eq!(w.state.day, 9);
    assert_eq!(at(&w, Om::Frate), Where::Cloth, "the soroc");
    assert_eq!(at(&w, Om::Rada), Where::Cloth);
}

// ---------------------------------------------------------------- Uitare, Pomenire, the soroace, the burial (§7)

#[test]
fn the_idle_dead_sees_the_candle_go_out_and_is_gone_before_day_ten() {
    let mut w = wake();
    let mut dark = None;
    while w.state.phase == Phase::Wake {
        if !w.state.candle && dark.is_none() {
            dark = Some(w.state.day);
            assert!(w.state.night, "a day with no candle is night from the start");
        }
        close(&mut w);
    }
    assert_eq!(w.state.ending, Some(Ending::Uitare));
    assert!(w.state.day < 10, "gone on day {}", w.state.day);
    assert!(dark.is_some(), "the candle was the first tell");
    assert!(w.state.stats.missed.contains(&3) || w.state.stats.soroace.contains(&3));
}

#[test]
fn a_soroc_held_names_you_and_sends_the_afterglow_one_a_day() {
    let mut w = wake();
    for _ in 1..3 {
        close(&mut w);
    }
    assert_eq!(w.state.day, 3);
    close(&mut w);
    assert!(last_close(&w).contains(&Event::SorocHeld { soroc: 3 }));
    assert_eq!(w.state.afterglow.len(), 4, "one of five sent at this close");
    assert!(last_close(&w)
        .iter()
        .any(|e| matches!(e, Event::Arrived { afterglow: true, from: Om::Mama, .. })));
    close(&mut w);
    assert!(last_close(&w)
        .iter()
        .any(|e| matches!(e, Event::Arrived { afterglow: true, from: Om::Draguta, .. })));
}

#[test]
fn a_soroc_at_six_uitare_is_skipped_and_costs_three() {
    let mut w = wake();
    close(&mut w);
    close(&mut w);
    w.state.uitare = 6;
    close(&mut w);
    assert!(last_close(&w).iter().any(|e| matches!(e, Event::SorocMissed { soroc: 3, .. })));
    assert_eq!(w.state.stats.missed, vec![3]);
}

#[test]
fn a_minune_holds_the_soroc_whatever_uitare_is() {
    let mut w = wake();
    close(&mut w);
    close(&mut w);
    w.state.uitare = 7;
    w.state.minune_promise = true;
    close(&mut w);
    assert_eq!(w.state.stats.soroace, vec![3]);
    assert!(!w.state.minune_promise);
}

#[test]
fn on_the_third_close_your_card_goes_to_the_cross() {
    let mut w = wake();
    close(&mut w);
    close(&mut w);
    assert_eq!(you(&w).at, Where::Plank);
    close(&mut w);
    assert_eq!(you(&w).at, Where::Cimitir);
    assert!(w.state.buried);
    assert!(last_close(&w).contains(&Event::Buried));
}

#[test]
fn the_candle_goes_out_at_four_and_relights_after_two_dawns_under() {
    let mut w = with(|c| c.base_m = [0; 5]);
    w.state.uitare = 4;
    close(&mut w);
    assert!(!w.state.candle);
    assert!(w.state.night, "a day with no candle is night from its start");
    w.state.uitare = 1; // as if the living had named you
    close(&mut w);
    assert_eq!(w.state.uitare, 2, "a dark dawn costs one");
    assert!(!w.state.candle, "one dawn under the threshold: still dark");
    assert_eq!(w.state.stats.dark_dawns, 1);
    w.state.uitare = 1;
    close(&mut w);
    assert!(w.state.candle, "two dawns under: relit");
    assert!(!w.state.night);
}

#[test]
fn the_forecast_is_uitare_plus_the_loose_dor_by_stub() {
    let mut w = wake();
    close(&mut w);
    assert_eq!(forecast(&w.state), [0, 0, 2]);
    close(&mut w);
    let f = forecast(&w.state);
    assert_eq!(f[0], 0);
    assert_eq!(f[1], 2);
}

// ---------------------------------------------------------------- Spaima: the priest and the Hunter (§8)

#[test]
fn at_six_the_priest_comes_cords_two_verbs_for_three_days_and_names_you() {
    let mut w = wake();
    w.state.spaima = 6;
    w.state.uitare = 2;
    close(&mut w);
    assert!(last_close(&w).contains(&Event::Priest { service: 1, until: 4 }));
    assert_eq!(w.state.spaima, 2, "reset to three, then the close's decay");
    assert_eq!(w.state.uitare, 1, "his Pomenire at this close");
    let d = dor_ids(&w, Where::Cloth)[0];
    let cana = lucru_id(&w, Lucru::Cana);
    let mama = om_id(&w, Om::Mama);
    assert_eq!(w.apply(Action::Place { dor: d, on: cana }, by_day(&w)), Err(Refusal::Locked));
    assert_eq!(w.apply(Action::Place { dor: d, on: mama }, by_day(&w)), Err(Refusal::Locked));
    let now = dusk(&mut w);
    assert_eq!(w.apply(Action::Place { dor: d, on: mama }, now), Ok(true), "a dream is private");
}

#[test]
fn the_third_service_is_dezlegare() {
    let mut w = wake();
    w.state.preot_services = 2;
    w.state.spaima = 6;
    close(&mut w);
    assert_eq!(w.state.ending, Some(Ending::Dezlegare));
    assert_eq!(w.state.phase, Phase::Ended);
}

#[test]
fn at_nine_the_hunter_stakes_you_before_the_priest_can_speak() {
    let mut w = wake();
    w.state.spaima = 9;
    close(&mut w);
    assert_eq!(w.state.ending, Some(Ending::Tarus));
    assert_eq!(w.state.preot_services, 0);
}

#[test]
fn fright_feeds_the_enemys_longing() {
    let dusman_dor =
        |w: &Wake| dor_ids(w, Where::Cloth).iter().filter(|d| dor(w, **d).1 == Om::Dusman).count();
    let mut calm = with(|c| c.base_m = [0, 0, 0, 350, 0]);
    close(&mut calm);
    assert_eq!(dusman_dor(&calm), 0, "the enemy forgets fastest: no second-day Dor by himself");
    let mut afraid = with(|c| c.base_m = [0, 0, 0, 350, 0]);
    afraid.state.spaima = 5;
    close(&mut afraid);
    assert_eq!(dusman_dor(&afraid), 1, "a frightened village thinks of you");
}

// ---------------------------------------------------------------- the endings (§10)

#[test]
fn at_the_ninth_close_with_little_uitare_the_bride_stands_in_the_door_and_treci_is_the_wedding() {
    let mut w = with(|c| c.base_m = [0; 5]);
    for _ in 1..9 {
        close(&mut w);
    }
    assert_eq!(w.state.day, 9);
    w.state.uitare = 3;
    close(&mut w);
    assert_eq!(w.state.phase, Phase::Door);
    assert_eq!(w.state.ending, Some(Ending::Nunta));
    assert_eq!(w.apply(Action::Stinge, T0), Err(Refusal::NotNow));
    w.apply(Action::Treci, T0).unwrap();
    assert_eq!(w.state.phase, Phase::Ended);
    assert!(w.state.treci);
}

/// The ninth close is a soroc, and the soroc resolves before the wedding check: held (under six), it
/// takes three off and the Bride stands; skipped (six or more), it adds three and the Uitare ending
/// follows. So in the nine-day wake the door never merely stays dark at the ninth close: the
/// addendum's "Uitare 4-8" page is unreachable as simulated. A finding for the chapter, not a rule.
/// (The day-three soroc's afterglow still sends five Dor to this untended table; the enemy's gutters
/// at this very close, so the counts below start one lower.)
#[test]
fn at_the_ninth_close_the_soroc_decides_before_the_bride_does() {
    let mut w = with(|c| c.base_m = [0; 5]);
    for _ in 1..9 {
        close(&mut w);
    }
    w.state.uitare = 4;
    close(&mut w);
    assert_eq!(w.state.uitare, 2, "the guttered Dor made five, the soroc took three");
    assert_eq!(w.state.ending, Some(Ending::Nunta));

    let mut w = with(|c| c.base_m = [0; 5]);
    for _ in 1..9 {
        close(&mut w);
    }
    w.state.uitare = 5;
    close(&mut w);
    assert_eq!(w.state.ending, Some(Ending::Uitare), "six at the soroc: skipped, nine, gone");
}

/// Where the last day is not a soroc, the door stays dark on Uitare 4-8: Ratacire.
#[test]
fn on_a_last_day_that_is_no_soroc_the_door_stays_dark() {
    let mut w = with(|c| {
        c.base_m = [0; 5];
        c.soroace = vec![3];
    });
    for _ in 1..9 {
        close(&mut w);
    }
    w.state.uitare = 4;
    close(&mut w);
    assert_eq!(w.state.ending, Some(Ending::Ratacire));
    assert_eq!(w.state.phase, Phase::Ended);
    assert_eq!(w.apply(Action::Treci, T0), Err(Refusal::NotNow));
}

#[test]
fn uitare_at_nine_ends_the_wake_on_any_day() {
    let mut w = wake();
    w.state.uitare = 9;
    close(&mut w);
    assert_eq!(w.state.ending, Some(Ending::Uitare));
}

#[test]
fn the_state_round_trips_through_json_with_its_kinds_tagged() {
    let w = wake();
    let json = serde_json::to_string(&w.state).unwrap();
    assert!(json.contains("\"kind\":\"cel_nenuntit\""));
    assert!(json.contains("\"kind\":\"lucru\",\"lucru\":\"cana\""));
    let back: State = serde_json::from_str(&json).unwrap();
    assert_eq!(back, w.state);
}
