//! The day engine: one pure step per action. Nothing happens inside a day but placing cards;
//! everything resolves at the close, in one published order (brief §3.6):
//! commits, decays, verb resolutions in slot order, then the next day.

use std::collections::BTreeMap;

use crate::config::Config;
use crate::model::*;
use crate::rng::Rng;

/// The table when the wake begins.
pub fn new_state(config: Config, now_ms: u64) -> State {
    let mut s = State {
        clock: Clock {
            day_ends_at: now_ms + config.zi_ms,
            paused_left: None,
            precued: false,
            closing: false,
        },
        config,
        phase: Phase::Wake,
        day: 1,
        cards: Vec::new(),
        runs: BTreeMap::new(),
        wanders: BTreeMap::new(),
        sung: 0,
        bocete: 0,
        next_id: 1,
        rev: 0,
        log: Vec::new(),
    };
    for (kind, n) in START {
        for _ in 0..*n {
            let at = if *kind == Kind::CelNenuntit { Loc::Plank } else { Loc::Table };
            add(&mut s, *kind, at);
        }
    }
    s
}

/// Brief §3.4 (the kit's five candles); chapter §6.5 (one Grau) and §12's sim (one Sare).
const START: &[(Kind, u8)] = &[
    (Kind::CelNenuntit, 1),
    (Kind::Rada, 1),
    (Kind::CodriiVlasiei, 1),
    (Kind::Plosca, 1),
    (Kind::Lumanare, 5),
    (Kind::Grau, 1),
    (Kind::Sare, 1),
];

pub fn step(state: &State, action: Action, now_ms: u64, rng: &mut Rng) -> Result<State, Refusal> {
    let mut s = state.clone();
    let changed = match action {
        Action::Tick => tick(&mut s, now_ms, rng),
        Action::CloseDay => {
            awake(&s)?;
            close_day(&mut s, now_ms, true, rng);
            true
        }
        Action::Tap { on: TapOn::Flame } => tap_flame(&mut s, now_ms)?,
        Action::Pause => pause(&mut s, now_ms),
        Action::Resume => resume(&mut s, now_ms),
        Action::Place { cards, target } => {
            place(&mut s, &cards, target)?;
            true
        }
        Action::Unplace { cards } => {
            unplace(&mut s, &cards)?;
            true
        }
    };
    if changed {
        s.rev += 1;
    }
    Ok(s)
}

// ---------------------------------------------------------------- the clock

fn awake(s: &State) -> Result<(), Refusal> {
    if s.phase == Phase::Wake {
        Ok(())
    } else {
        Err(Refusal::NotNow)
    }
}

fn tick(s: &mut State, now: u64, rng: &mut Rng) -> bool {
    if s.phase != Phase::Wake || s.clock.paused_left.is_some() {
        return false;
    }
    let mut changed = false;
    if !s.clock.precued && now + s.config.precue_ms >= s.clock.day_ends_at {
        s.clock.precued = true;
        log(s, Event::Precue);
        changed = true;
    }
    if now >= s.clock.day_ends_at {
        let early = s.clock.closing;
        close_day(s, now, early, rng);
        changed = true;
    }
    changed
}

/// Early close: the pre-cue still plays, then the day closes (DECISIONS 2026-10-12).
fn tap_flame(s: &mut State, now: u64) -> Result<bool, Refusal> {
    awake(s)?;
    if s.clock.paused_left.is_some() {
        return Err(Refusal::NotNow);
    }
    if s.clock.closing {
        return Ok(false);
    }
    s.clock.closing = true;
    s.clock.day_ends_at = s.clock.day_ends_at.min(now + s.config.precue_ms);
    if !s.clock.precued {
        s.clock.precued = true;
        log(s, Event::Precue);
    }
    Ok(true)
}

fn pause(s: &mut State, now: u64) -> bool {
    if s.phase != Phase::Wake || s.clock.paused_left.is_some() {
        return false;
    }
    s.clock.paused_left = Some(s.clock.day_ends_at.saturating_sub(now));
    true
}

fn resume(s: &mut State, now: u64) -> bool {
    match s.clock.paused_left.take() {
        Some(left) => {
            s.clock.day_ends_at = now + left;
            true
        }
        None => false,
    }
}

// ---------------------------------------------------------------- placing

fn place(s: &mut State, ids: &[u32], target: Target) -> Result<(), Refusal> {
    awake(s)?;
    if ids.is_empty() {
        return Err(Refusal::Nothing);
    }
    let Target::Niche(niche) = target;
    if s.runs.contains_key(&niche) {
        return Err(Refusal::Busy);
    }
    for &id in ids {
        let card = find(s, id)?;
        match card.at {
            Loc::Plank => return Err(Refusal::Fixed),
            Loc::Niche(n) if s.runs.contains_key(&n) => return Err(Refusal::Busy),
            _ => {}
        }
    }
    let mut inside: Vec<Kind> = s
        .cards
        .iter()
        .filter(|c| c.at == Loc::Niche(niche) && !ids.contains(&c.id))
        .map(|c| c.kind)
        .collect();
    let mut accepted = Vec::new();
    for &id in ids {
        let kind = find(s, id)?.kind;
        if !fits(niche, &inside, kind, &s.config) {
            break;
        }
        inside.push(kind);
        accepted.push(id);
    }
    if accepted.is_empty() {
        return Err(Refusal::DoesNotFit);
    }
    for c in s.cards.iter_mut().filter(|c| accepted.contains(&c.id)) {
        c.at = Loc::Niche(niche);
    }
    log(s, Event::Placed { cards: accepted, target });
    Ok(())
}

fn unplace(s: &mut State, ids: &[u32]) -> Result<(), Refusal> {
    awake(s)?;
    let mut moved = Vec::new();
    for &id in ids {
        if let Loc::Niche(n) = find(s, id)?.at {
            if s.runs.contains_key(&n) {
                return Err(Refusal::Busy);
            }
            moved.push(id);
        }
    }
    if moved.is_empty() {
        return Err(Refusal::Nothing);
    }
    for c in s.cards.iter_mut().filter(|c| moved.contains(&c.id)) {
        c.at = Loc::Table;
    }
    log(s, Event::Unplaced { cards: moved });
    Ok(())
}

/// What a niche will take next, given what it already holds. Order of placing is free.
fn fits(niche: Niche, inside: &[Kind], kind: Kind, cfg: &Config) -> bool {
    let has = |k: Kind| inside.contains(&k);
    let n = |k: Kind| inside.iter().filter(|x| **x == k).count();
    match niche {
        // a place, and optionally one candle burnt on the road (brief §3.3)
        Niche::Umbla => match kind.class() {
            Class::Place => !inside.iter().any(|k| k.class() == Class::Place),
            _ => kind == Kind::Lumanare && !has(Kind::Lumanare),
        },
        // Rada, then three to six Fir de dor or one Jale (brief §3.3)
        Niche::Boci => match kind {
            Kind::Rada => !has(Kind::Rada),
            Kind::FirDeDor => !has(Kind::Jale) && n(Kind::FirDeDor) < usize::from(cfg.boci_max),
            Kind::Jale => !has(Kind::FirDeDor) && !has(Kind::Jale),
            _ => false,
        },
        _ => false,
    }
}

fn recipe_of(niche: Niche, inside: &[Kind], cfg: &Config) -> Option<Recipe> {
    match niche {
        Niche::Umbla => {
            let place = *inside.iter().find(|k| k.class() == Class::Place)?;
            Some(Recipe::Wander { place, lit: inside.contains(&Kind::Lumanare) })
        }
        Niche::Boci => {
            if !inside.contains(&Kind::Rada) {
                return None;
            }
            if inside.contains(&Kind::Jale) {
                return Some(Recipe::MournJale);
            }
            let dor = inside.iter().filter(|k| **k == Kind::FirDeDor).count();
            (usize::from(cfg.boci_min)..=usize::from(cfg.boci_max))
                .contains(&dor)
                .then_some(Recipe::MournDor { n: dor as u8 })
        }
        _ => None,
    }
}

fn duration(recipe: Recipe, cfg: &Config) -> u8 {
    let days = match recipe {
        Recipe::Wander { .. } => cfg.umbla_zile,
        Recipe::MournDor { .. } => cfg.boci_dor_zile,
        Recipe::MournJale => cfg.boci_jale_zile,
    };
    days.max(1)
}

// ---------------------------------------------------------------- the close

fn close_day(s: &mut State, now: u64, early: bool, rng: &mut Rng) {
    log(s, Event::DayClosed { early });
    commit(s);
    decay(s);
    resolve(s, rng);
    if s.day >= s.config.zile {
        s.phase = Phase::Ended;
        log(s, Event::Ended);
        return;
    }
    s.day += 1;
    let paused = s.clock.paused_left.is_some();
    s.clock = Clock {
        day_ends_at: now + s.config.zi_ms,
        paused_left: paused.then_some(s.config.zi_ms),
        precued: false,
        closing: false,
    };
    log(s, Event::DayBegan);
}

/// Niches holding cards start their verb; a niche that cannot start gives its cards back.
fn commit(s: &mut State) {
    for niche in Niche::ORDER {
        if s.runs.contains_key(&niche) {
            continue;
        }
        let ids = ids_at(s, niche);
        if ids.is_empty() {
            continue;
        }
        let inside: Vec<Kind> = ids.iter().map(|id| kind_of(s, *id)).collect();
        match recipe_of(niche, &inside, &s.config) {
            Some(recipe) => {
                let days_left = duration(recipe, &s.config);
                s.runs.insert(niche, Run { recipe, days_left, started: s.day });
                log(s, Event::Started { niche, recipe });
            }
            None => {
                for c in s.cards.iter_mut().filter(|c| ids.contains(&c.id)) {
                    c.at = Loc::Table;
                }
                log(s, Event::Returned { niche, cards: ids });
            }
        }
    }
}

/// Loose Fir de dor lose a grain; at none they rot to Jale. Dor in a niche is safe. Cards found
/// at this close arrive after this step, so nothing counts down at the close it arrived (chapter §3).
fn decay(s: &mut State) {
    let mut ticked = Vec::new();
    for c in s.cards.iter_mut() {
        if c.kind == Kind::FirDeDor && c.at == Loc::Table {
            c.grains = c.grains.saturating_sub(1);
            ticked.push((c.id, c.grains));
        }
    }
    for (card, grains) in ticked {
        if grains > 0 {
            log(s, Event::Decayed { card, grains });
        } else {
            remove(s, card);
            let jale = add(s, Kind::Jale, Loc::Table);
            log(s, Event::Rotted { card, jale });
        }
    }
}

fn resolve(s: &mut State, rng: &mut Rng) {
    for niche in Niche::ORDER {
        let Some(run) = s.runs.get_mut(&niche) else { continue };
        run.days_left -= 1;
        if run.days_left > 0 {
            continue;
        }
        let run = s.runs.remove(&niche).expect("a running niche");
        log(s, Event::Resolved { niche });
        match run.recipe {
            Recipe::Wander { place, lit } => wander(s, niche, place, lit, rng),
            Recipe::MournDor { n } => mourn_dor(s, niche, n),
            Recipe::MournJale => mourn_jale(s, niche),
        }
    }
}

fn wander(s: &mut State, niche: Niche, place: Kind, lit: bool, rng: &mut Rng) {
    let w = {
        let count = s.wanders.entry(place).or_insert(0);
        *count += 1;
        *count
    };
    let mut draws = pool(place, w, rng);
    for id in ids_at(s, niche) {
        let kind = kind_of(s, id);
        if kind == Kind::Lumanare {
            remove(s, id);
            log(s, Event::Consumed { card: id, kind });
        } else {
            set_at(s, id, Loc::Table);
        }
    }
    if lit {
        draws.push(Kind::FirDeDor);
    }
    for kind in draws {
        let card = add(s, kind, Loc::Table);
        log(s, Event::Arrived { card, kind });
    }
}

/// The place's pool, a sequence by wander count (brief §3.5).
fn pool(place: Kind, w: u32, rng: &mut Rng) -> Vec<Kind> {
    use Kind::*;
    match (place, w) {
        (CodriiVlasiei, 1) => vec![FirDeDor, FirDeDor],
        (CodriiVlasiei, 2) => vec![FirDeDor, CantecDeLeagan],
        (CodriiVlasiei, 3) => vec![Fier, FirDeDor],
        (CodriiVlasiei, 4) => vec![Negustor, FirDeDor],
        (CodriiVlasiei, _) => {
            let mut v = vec![FirDeDor; rng.range(1, 2) as usize];
            if w.is_multiple_of(3) {
                v.push(CantecDeLeagan);
            }
            v
        }
        _ => Vec::new(),
    }
}

fn mourn_dor(s: &mut State, niche: Niche, n: u8) {
    for id in ids_at(s, niche) {
        let kind = kind_of(s, id);
        if kind == Kind::FirDeDor {
            remove(s, id);
            log(s, Event::Consumed { card: id, kind });
        } else {
            set_at(s, id, Loc::Table);
        }
    }
    s.sung += u32::from(n);
    let lit = s.sung / s.config.dor_per_bocet.max(1);
    while s.bocete < lit {
        s.bocete += 1;
        let card = add(s, Kind::Bocet, Loc::Table);
        log(s, Event::Arrived { card, kind: Kind::Bocet });
        log(s, Event::Pip { bocete: s.bocete });
    }
}

/// The held note: every Jale on the watcher goes, nothing is gained (chapter §6.2).
fn mourn_jale(s: &mut State, niche: Niche) {
    let jale: Vec<u32> = s
        .cards
        .iter()
        .filter(|c| c.kind == Kind::Jale && (c.at == Loc::Table || c.at == Loc::Niche(niche)))
        .map(|c| c.id)
        .collect();
    for id in &jale {
        remove(s, *id);
    }
    for id in ids_at(s, niche) {
        set_at(s, id, Loc::Table);
    }
    log(s, Event::JaleMourned { n: jale.len() as u32 });
}

// ---------------------------------------------------------------- cards

fn add(s: &mut State, kind: Kind, at: Loc) -> u32 {
    let id = s.next_id;
    s.next_id += 1;
    let grains = if kind == Kind::FirDeDor { s.config.dor_zile } else { 0 };
    s.cards.push(Card { id, kind, at, grains, born: s.day });
    id
}

fn remove(s: &mut State, id: u32) {
    s.cards.retain(|c| c.id != id);
}

fn find(s: &State, id: u32) -> Result<&Card, Refusal> {
    s.cards.iter().find(|c| c.id == id).ok_or(Refusal::NoSuchCard)
}

fn kind_of(s: &State, id: u32) -> Kind {
    s.cards.iter().find(|c| c.id == id).map(|c| c.kind).expect("a card on the table")
}

fn set_at(s: &mut State, id: u32, at: Loc) {
    if let Some(c) = s.cards.iter_mut().find(|c| c.id == id) {
        c.at = at;
    }
}

fn ids_at(s: &State, niche: Niche) -> Vec<u32> {
    s.cards.iter().filter(|c| c.at == Loc::Niche(niche)).map(|c| c.id).collect()
}

fn log(s: &mut State, event: Event) {
    let day = s.day;
    s.log.push(Entry { day, event });
}
