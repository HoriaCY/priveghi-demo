//! Shared helpers for the rules tests. Tests pin their own numbers (`cfg`), so they test the
//! mechanics, not today's defaults; a new knob must be added here on purpose.
#![allow(dead_code)]

use priveghi_engine::*;

pub const T0: u64 = 1_000_000;

pub fn cfg() -> Config {
    Config {
        zi_ms: 60_000,
        precue_ms: 400,
        zile: 9,
        dor_zile: 3,
        boci_min: 3,
        boci_max: 6,
        boci_dor_zile: 2,
        boci_jale_zile: 1,
        umbla_zile: 1,
        dor_per_bocet: 3,
        kit_wax: 5,
        ceara_zile: 3,
        vigoare: 3,
        wax_grace: 0,
        sill: 3,
        jale_frant: 3,
    }
}

/// Room for more wanders than a nine-day wake allows. These runs never mourn, so their grief would
/// break the watcher and their candle would go out; they test the draws, so neither may happen.
pub fn cfg_long() -> Config {
    Config { zile: 30, jale_frant: u8::MAX, kit_wax: u8::MAX, ..cfg() }
}

pub fn game() -> Game {
    Game::with_config(cfg(), 7, T0)
}

pub fn on_table(g: &Game, kind: Kind) -> Vec<u32> {
    g.state.cards.iter().filter(|c| c.kind == kind && c.at == Loc::Table).map(|c| c.id).collect()
}

pub fn count(g: &Game, kind: Kind) -> usize {
    g.state.cards.iter().filter(|c| c.kind == kind).count()
}

pub fn in_niche(g: &Game, niche: Niche) -> Vec<Kind> {
    let mut v: Vec<Kind> =
        g.state.cards.iter().filter(|c| c.at == Loc::Niche(niche)).map(|c| c.kind).collect();
    v.sort();
    v
}

pub fn niche_ids(g: &Game, niche: Niche) -> Vec<u32> {
    g.state.cards.iter().filter(|c| c.at == Loc::Niche(niche)).map(|c| c.id).collect()
}

pub fn sorted(mut v: Vec<Kind>) -> Vec<Kind> {
    v.sort();
    v
}

pub fn dor_grains(g: &Game) -> Vec<u8> {
    let mut v: Vec<u8> = g
        .state
        .cards
        .iter()
        .filter(|c| c.kind == Kind::FirDeDor && c.at == Loc::Table)
        .map(|c| c.grains)
        .collect();
    v.sort();
    v
}

pub fn place(g: &mut Game, kind: Kind, n: usize, niche: Niche) -> Result<bool, Refusal> {
    let cards: Vec<u32> = on_table(g, kind).into_iter().take(n).collect();
    g.apply(Action::Place { cards, target: Target::Niche(niche) }, T0)
}

pub fn close(g: &mut Game) {
    g.apply(Action::CloseDay, T0).unwrap();
}

pub fn event_name(e: &Event) -> String {
    serde_json::to_value(e).unwrap()["event"].as_str().unwrap().to_string()
}

/// Events logged since the last close began.
pub fn last_close(g: &Game) -> Vec<Event> {
    let at = g
        .state
        .log
        .iter()
        .rposition(|e| matches!(e.event, Event::DayClosed { .. }))
        .expect("a close happened");
    g.state.log[at..].iter().map(|e| e.event.clone()).collect()
}

pub fn precues(g: &Game) -> usize {
    g.state.log.iter().filter(|e| e.event == Event::Precue).count()
}

/// Codrii Vlasiei into UMBLA (with a candle if `lit`), the day closes; returns what arrived.
pub fn wander(g: &mut Game, lit: bool) -> Vec<Kind> {
    place(g, Kind::CodriiVlasiei, 1, Niche::Umbla).unwrap();
    if lit {
        place(g, Kind::Lumanare, 1, Niche::Umbla).unwrap();
    }
    close(g);
    let mut got: Vec<Kind> = last_close(g)
        .into_iter()
        .filter_map(|e| match e {
            Event::Arrived { kind, .. } => Some(kind),
            _ => None,
        })
        .collect();
    got.sort();
    got
}

pub fn place_on(g: &mut Game, kind: Kind, n: usize, target: Target) -> Result<bool, Refusal> {
    let cards: Vec<u32> = on_table(g, kind).into_iter().take(n).collect();
    g.apply(Action::Place { cards, target }, T0)
}

pub fn sill_ids(g: &Game) -> Vec<u32> {
    g.state.cards.iter().filter(|c| c.at == Loc::Sill).map(|c| c.id).collect()
}

pub fn sill(g: &Game) -> usize {
    sill_ids(g).len()
}
