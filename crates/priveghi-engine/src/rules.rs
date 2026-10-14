//! The day engine: one pure step per action. Nothing happens inside a day but placing cards;
//! everything resolves at the close, in one published order (brief §3.6):
//! commits, decays, verb resolutions in slot order, then the next day.

use std::collections::BTreeMap;

use crate::config::Config;
use crate::model::*;
use crate::rng::Rng;

/// The table when the wake begins.
pub fn new_state(config: Config, now_ms: u64) -> State {
    let (wax, vigoare) = (config.kit_wax, config.vigoare);
    let mut s = State {
        clock: Clock {
            day_ends_at: now_ms + config.zi_ms,
            paused_left: None,
            precued: false,
            closing: false,
        },
        config,
        phase: Phase::Boot,
        day: 1,
        cards: Vec::new(),
        runs: BTreeMap::new(),
        wanders: BTreeMap::new(),
        sung: 0,
        bocete: 0,
        wax,
        vigoare,
        dark: 0,
        frant: false,
        offered: Vec::new(),
        marks: Vec::new(),
        start_wax: wax,
        wakes: 1,
        silence_spent: false,
        ending: None,
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
    // the one card the dark shows: a candle on the troita's sill (brief §3.1)
    add(&mut s, Kind::Lumanare, Loc::Sill);
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
    if s.phase == Phase::Boot {
        let changed = boot(&mut s, action, now_ms)?;
        if changed {
            s.rev += 1;
        }
        return Ok(s);
    }
    let changed = match action {
        Action::Again => again(&mut s, now_ms)?,
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
            place(&mut s, &cards, target, now_ms)?;
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

// ---------------------------------------------------------------- the boot, and another wake

/// In the dark only the candle on the sill moves: placed into the troita it becomes the table candle
/// and the wake begins (brief §3.1). Time does not pass in the dark.
fn boot(s: &mut State, action: Action, now: u64) -> Result<bool, Refusal> {
    match action {
        Action::Tick | Action::Pause | Action::Resume => Ok(false),
        Action::Place { cards, target: Target::Niche(Niche::Troita) } => {
            let candle: Vec<u32> = s
                .cards
                .iter()
                .filter(|c| c.at == Loc::Sill && c.kind == Kind::Lumanare)
                .map(|c| c.id)
                .collect();
            if cards.is_empty() || cards != candle {
                return Err(Refusal::NotNow);
            }
            remove(s, candle[0]);
            s.phase = Phase::Wake;
            s.clock = Clock {
                day_ends_at: now + s.config.zi_ms,
                paused_left: None,
                precued: false,
                closing: false,
            };
            log(s, Event::Kindled);
            Ok(true)
        }
        _ => Err(Refusal::NotNow),
    }
}

/// After the Bride: another wake, in the dark again, its candle one notch lower, never at nothing
/// (brief §3.7; RULINGS R36). The dice run on.
fn again(s: &mut State, now: u64) -> Result<bool, Refusal> {
    if s.phase != Phase::Ended || s.ending != Some(Ending::Cununie) {
        return Err(Refusal::NotNow);
    }
    let start = s.start_wax.saturating_sub(1).max(1);
    let mut next = new_state(s.config.clone(), now);
    next.start_wax = start;
    next.wax = start;
    next.wakes = s.wakes + 1;
    next.rev = s.rev;
    *s = next;
    Ok(true)
}

// ---------------------------------------------------------------- the clock

fn awake(s: &State) -> Result<(), Refusal> {
    if s.phase == Phase::Wake {
        Ok(())
    } else {
        Err(Refusal::NotNow)
    }
}

/// Whether a tick at `now` would sound the pre-cue or close the day.
pub fn tick_due(s: &State, now: u64) -> bool {
    s.phase == Phase::Wake
        && s.clock.paused_left.is_none()
        && ((!s.clock.precued && now + s.config.precue_ms >= s.clock.day_ends_at)
            || now >= s.clock.day_ends_at)
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
    Ok(begin_close(s, now))
}

/// The day closes one pre-cue from now: the flame gutters with its dry tick first.
fn begin_close(s: &mut State, now: u64) -> bool {
    if s.clock.closing {
        return false;
    }
    s.clock.closing = true;
    s.clock.day_ends_at = s.clock.day_ends_at.min(now + s.config.precue_ms);
    if !s.clock.precued {
        s.clock.precued = true;
        log(s, Event::Precue);
    }
    true
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

fn place(s: &mut State, ids: &[u32], target: Target, now: u64) -> Result<(), Refusal> {
    awake(s)?;
    if ids.is_empty() {
        return Err(Refusal::Nothing);
    }
    if let Target::Niche(niche) = target {
        if s.runs.contains_key(&niche) {
            return Err(Refusal::Busy);
        }
        if s.frant && LOCKED_BY_FRANT.contains(&niche) {
            return Err(Refusal::Locked);
        }
    }
    for &id in ids {
        let card = find(s, id)?;
        match card.at {
            Loc::Plank => return Err(Refusal::Fixed),
            Loc::Niche(n) if s.runs.contains_key(&n) => return Err(Refusal::Busy),
            _ => {}
        }
    }
    match target {
        Target::Nenuntit => offer(s, ids),
        Target::Candle => feed_candle(s, ids),
        Target::Niche(Niche::Troita) => troita(s, ids, now),
        Target::Niche(niche) => into_niche(s, ids, niche),
    }
}

/// Frant ties these shut; BOCESTE, GAZDUIESTE and the troita stay open (brief §3.6, RULINGS R22).
const LOCKED_BY_FRANT: [Niche; 3] = [Niche::Umbla, Niche::Asculta, Niche::Descanta];

/// A candle card in the dish adds a notch, until the candle is whole (RULINGS R19, R24).
fn feed_candle(s: &mut State, ids: &[u32]) -> Result<(), Refusal> {
    let mut fed = 0;
    for &id in ids {
        if kind_of(s, id) != Kind::Lumanare || s.wax >= s.config.kit_wax {
            break;
        }
        remove(s, id);
        s.wax += 1;
        fed += 1;
    }
    if fed == 0 {
        return Err(Refusal::DoesNotFit);
    }
    log(s, Event::WaxFed { wax: s.wax });
    Ok(())
}

/// The flask rests the day; a Fir de dor is tied on the sill, safe from decay (brief §3.3).
fn troita(s: &mut State, ids: &[u32], now: u64) -> Result<(), Refusal> {
    match kind_of(s, ids[0]) {
        Kind::Plosca => {
            if s.clock.paused_left.is_some() {
                return Err(Refusal::NotNow);
            }
            set_at(s, ids[0], Loc::Niche(Niche::Troita));
            log(s, Event::Placed { cards: vec![ids[0]], target: Target::Niche(Niche::Troita) });
            begin_close(s, now);
            Ok(())
        }
        Kind::FirDeDor => {
            let tied_now = s.cards.iter().filter(|c| c.at == Loc::Sill).count();
            let room = usize::from(s.config.sill).saturating_sub(tied_now);
            let tied: Vec<u32> =
                ids.iter().copied().filter(|id| kind_of(s, *id) == Kind::FirDeDor).take(room).collect();
            if tied.is_empty() {
                return Err(Refusal::DoesNotFit);
            }
            for id in &tied {
                set_at(s, *id, Loc::Sill);
            }
            log(s, Event::Tied { cards: tied });
            Ok(())
        }
        _ => Err(Refusal::DoesNotFit),
    }
}

fn into_niche(s: &mut State, ids: &[u32], niche: Niche) -> Result<(), Refusal> {
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
    log(s, Event::Placed { cards: accepted, target: Target::Niche(niche) });
    Ok(())
}

fn unplace(s: &mut State, ids: &[u32]) -> Result<(), Refusal> {
    awake(s)?;
    let mut moved = Vec::new();
    for &id in ids {
        match find(s, id)?.at {
            Loc::Niche(n) if s.runs.contains_key(&n) => return Err(Refusal::Busy),
            Loc::Niche(_) | Loc::Sill => moved.push(id),
            _ => {}
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
        // a lullaby (brief §3.3)
        Niche::Asculta => kind == Kind::CantecDeLeagan && inside.is_empty(),
        // a name, spoken at the dark door (brief §3.3)
        Niche::Descanta => kind == Kind::Nume && inside.is_empty(),
        // the peddler and one payment (bog iron or a thread), or wheat with no guest (brief §3.3)
        Niche::Gazdui => {
            let paid = has(Kind::Fier) || has(Kind::FirDeDor);
            match kind {
                Kind::Negustor => !has(Kind::Negustor) && !has(Kind::Grau),
                Kind::Fier | Kind::FirDeDor => !paid && !has(Kind::Grau),
                Kind::Grau => inside.is_empty(),
                _ => false,
            }
        }
        Niche::Troita => false,
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
        Niche::Asculta => (inside == [Kind::CantecDeLeagan]).then_some(Recipe::Listen),
        Niche::Descanta => (inside == [Kind::Nume]).then_some(Recipe::Charm),
        Niche::Gazdui => {
            if inside == [Kind::Grau] {
                return Some(Recipe::Hearth);
            }
            let pay = *inside.iter().find(|k| matches!(k, Kind::Fier | Kind::FirDeDor))?;
            (inside.len() == 2 && inside.contains(&Kind::Negustor)).then_some(Recipe::Trade { pay })
        }
        Niche::Troita => None,
    }
}

fn duration(recipe: Recipe, cfg: &Config) -> u8 {
    let days = match recipe {
        Recipe::Wander { .. } => cfg.umbla_zile,
        Recipe::MournDor { .. } => cfg.boci_dor_zile,
        Recipe::MournJale => cfg.boci_jale_zile,
        Recipe::Listen => cfg.asculta_zile,
        Recipe::Charm => 1,
        Recipe::Trade { .. } | Recipe::Hearth => cfg.gazdui_zile,
    };
    days.max(1)
}

// ---------------------------------------------------------------- the close

fn close_day(s: &mut State, now: u64, early: bool, rng: &mut Rng) {
    log(s, Event::DayClosed { early });
    commit(s);
    decay(s);
    resolve(s, rng);
    lifetimes(s);
    peddler_returns(s);
    drain_wax(s);
    check_marks(s);
    check_frant(s);
    // the last Vigoare pip, or the ninth close (brief §3.7; RULINGS R25)
    if s.vigoare == 0 || s.day >= s.config.zile {
        let kept = s.vigoare > 0
            && s.config.soroace.iter().filter(|d| **d <= s.config.zile).all(|d| s.offered.contains(d));
        let ending = if kept { Ending::Pomelnic } else { Ending::Cununie };
        s.phase = Phase::Ended;
        s.ending = Some(ending);
        log(s, Event::Ended { ending });
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
    let flask = ids_at(s, Niche::Troita);
    if !flask.is_empty() {
        for id in flask {
            set_at(s, id, Loc::Table);
        }
        log(s, Event::Rested);
    }
    for niche in Niche::ORDER {
        if niche == Niche::Troita || s.runs.contains_key(&niche) {
            continue;
        }
        let ids = ids_at(s, niche);
        if ids.is_empty() {
            continue;
        }
        let inside: Vec<Kind> = ids.iter().map(|id| kind_of(s, *id)).collect();
        match recipe_of(niche, &inside, &s.config) {
            Some(recipe) => {
                let days = duration(recipe, &s.config);
                s.runs.insert(niche, Run { recipe, days, days_left: days, started: s.day });
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
            // the one great silence: a thread lost while broken, once a run (brief §3.7)
            if s.frant && !s.silence_spent {
                s.silence_spent = true;
                log(s, Event::Silence);
            }
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
            Recipe::Listen => exchange(s, niche, &[Kind::CantecDeLeagan], Kind::Nume, 0),
            Recipe::Charm => {
                log(s, Event::DoorAnswered);
                let days = s.config.binecuvantare_zile;
                exchange(s, niche, &[], Kind::Binecuvantare, days);
            }
            Recipe::Trade { pay } => exchange(s, niche, &[pay], Kind::Grau, 0),
            Recipe::Hearth => {
                let days = s.config.coliva_zile;
                exchange(s, niche, &[Kind::Grau], Kind::Coliva, days);
            }
        }
    }
}

/// One notch burns at every `ceara_zile`-th close. With no wax the light is out: every close in the
/// dark, the close that burns the last notch included, costs a Vigoare pip after the grace (chapter §6.4).
fn drain_wax(s: &mut State) {
    if s.config.ceara_zile > 0 && s.day.is_multiple_of(s.config.ceara_zile) && s.wax > 0 {
        s.wax -= 1;
        log(s, Event::WaxBurned { wax: s.wax });
    }
    if s.wax > 0 {
        s.dark = 0;
        return;
    }
    s.dark = s.dark.saturating_add(1);
    if s.dark > s.config.wax_grace {
        s.vigoare = s.vigoare.saturating_sub(1);
    }
    log(s, Event::DarkClose { vigoare: s.vigoare });
}

/// Three Jale break the watcher; mourning them mends it at the close it happens (chapter §6.2).
fn check_frant(s: &mut State) {
    let jale = s.cards.iter().filter(|c| c.kind == Kind::Jale).count();
    let broken = jale >= usize::from(s.config.jale_frant);
    if broken && !s.frant {
        s.frant = true;
        log(s, Event::FrantLocked);
    } else if !broken && s.frant {
        s.frant = false;
        log(s, Event::FrantLifted);
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
    // a blessing on the table: this wander draws one more, and the blessing is spent (brief §3.5)
    if let Some(b) = s.cards.iter().find(|c| c.kind == Kind::Binecuvantare).map(|c| c.id) {
        remove(s, b);
        log(s, Event::Consumed { card: b, kind: Kind::Binecuvantare });
        draws.push(Kind::FirDeDor);
    }
    for kind in draws {
        if kind == Kind::Negustor {
            arrive_peddler(s);
            continue;
        }
        let card = add(s, kind, Loc::Table);
        log(s, Event::Arrived { card, kind });
    }
}

fn arrive_peddler(s: &mut State) {
    if s.cards.iter().any(|c| c.kind == Kind::Negustor) {
        return;
    }
    let card = add(s, Kind::Negustor, Loc::Table);
    let stay = s.config.peddler_stay_zile;
    set_days(s, card, stay);
    log(s, Event::Arrived { card, kind: Kind::Negustor });
}

/// He comes back on his day if he is not at the table (RULINGS R20).
fn peddler_returns(s: &mut State) {
    if s.day + 1 == s.config.peddler_return_day {
        arrive_peddler(s);
    }
}

/// A niche's verb resolves: the consumed kinds go, everything else returns to the cloth, and one
/// card of `made` arrives (lasting `days` full days, or staying when zero).
fn exchange(s: &mut State, niche: Niche, consumed: &[Kind], made: Kind, days: u8) {
    for id in ids_at(s, niche) {
        let kind = kind_of(s, id);
        if consumed.contains(&kind) {
            remove(s, id);
            log(s, Event::Consumed { card: id, kind });
        } else {
            set_at(s, id, Loc::Table);
        }
    }
    let card = add(s, made, Loc::Table);
    set_days(s, card, days);
    log(s, Event::Arrived { card, kind: made });
}

/// Cards that do not stay count down at every close after the one they arrived at: a guest goes
/// on, a coliva spoils, a blessing fades (chapter §3's lifetime rule).
fn lifetimes(s: &mut State) {
    let day = s.day;
    let mut gone = Vec::new();
    for c in s.cards.iter_mut().filter(|c| c.days > 0 && c.born < day) {
        c.days -= 1;
        if c.days == 0 {
            gone.push((c.id, c.kind));
        }
    }
    for (card, kind) in gone {
        remove(s, card);
        log(s, Event::Left { card, kind });
    }
}

/// On Cel Nenuntit's days, coliva laid on him keeps his mark; otherwise the day passes unkept.
fn check_marks(s: &mut State) {
    let day = s.day;
    if !s.config.soroace.contains(&day) {
        return;
    }
    let held = s.offered.contains(&day);
    s.marks.push(Mark { day, held });
    log(s, if held { Event::MarkHeld { soroc: day } } else { Event::MarkMissed { soroc: day } });
}

/// Coliva on Cel Nenuntit, on one of his days, once: the pomana (brief §3.3). Open under Frant.
fn offer(s: &mut State, ids: &[u32]) -> Result<(), Refusal> {
    let day = s.day;
    let id = ids[0];
    if kind_of(s, id) != Kind::Coliva || !s.config.soroace.contains(&day) || s.offered.contains(&day) {
        return Err(Refusal::DoesNotFit);
    }
    remove(s, id);
    s.offered.push(day);
    log(s, Event::Offered { soroc: day });
    Ok(())
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
    s.cards.push(Card { id, kind, at, grains, born: s.day, days: 0 });
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

fn set_days(s: &mut State, id: u32, days: u8) {
    if let Some(c) = s.cards.iter_mut().find(|c| c.id == id) {
        c.days = days;
    }
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
