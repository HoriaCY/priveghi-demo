//! The dead's wake, one pure step per action. Inside a day a hand commits acts and resolves their
//! plays, goes about, listens and ties; everything else resolves at the close, in the chapter's published
//! order (§3), which is the simulator's `close()` verbatim: the open play as a skip -> Dor rot -> the
//! Bride on the last day ->
//! the sill's tick -> the soroc -> the burial -> the dark-dawn pip -> the pomane expire -> the Uitare
//! check -> the Hunter -> the priest -> Spaima decay -> Ratacire on the last day -> the candle for tomorrow ->
//! Putere -> arrivals, last, so the lifetime rule exempts them at this close.

use super::config::Config;
use super::model::*;

/// The table before they bring you home: your card on the plank, the house's five things, the
/// house's three places; the living exist and come to the table by the presence rule (chapter §9).
pub fn new_state(config: Config, now_ms: u64) -> State {
    let putere = config.putere;
    let clock = Clock {
        day_ends_at: now_ms + config.zi_ms,
        dusk_at: now_ms + config.zi_ms - config.zi_noapte_ms,
        paused_at: None,
        precued: false,
        closing: false,
    };
    let acc_start = config.acc_start_m;
    let mut s = State {
        config,
        phase: Phase::Boot,
        day: 1,
        night: false,
        clock,
        cards: Vec::new(),
        commit: None,
        uitare: 0,
        spaima: 0,
        putere,
        candle: true,
        under: 0,
        standing_m: [0; 5],
        acc_m: [acc_start; 5],
        last_sent: [0; 5],
        afterglow: Vec::new(),
        amintiri: Default::default(),
        minuni: Vec::new(),
        minune_promise: false,
        walked: Vec::new(),
        biserica_known: false,
        night_at: None,
        last_dream: None,
        dreamed_tonight: None,
        dreams_tonight: 0,
        night_acted: false,
        rest_pending: false,
        preot_until: 0,
        preot_services: 0,
        buried: false,
        ending: None,
        treci: false,
        stats: Stats::default(),
        next_id: 1,
        rev: 0,
        log: Vec::new(),
    };
    add(&mut s, Kind::CelNenuntit, Where::Plank);
    for om in Om::ALL {
        add(&mut s, Kind::Om { om, fel: om.affinities().to_vec() }, Where::Away);
    }
    for lucru in [Lucru::Cana, Lucru::Broboada, Lucru::Inel, Lucru::Icoana, Lucru::Oglinda] {
        add_lucru(&mut s, lucru, lucru.affinities().to_vec(), lucru.owner(), 0);
    }
    for loc in Loc::ALL {
        add(&mut s, Kind::Loc { loc, fel: loc.affinity() }, Where::Away);
    }
    refresh_presence(&mut s);
    s
}

pub fn step(state: &State, action: Action, now_ms: u64) -> Result<State, Refusal> {
    let mut s = state.clone();
    let changed = match s.phase {
        Phase::Boot => match action {
            Action::Begin => begin(&mut s, now_ms),
            Action::Tick | Action::Pause | Action::Resume => false,
            _ => return Err(Refusal::NotNow),
        },
        Phase::Door => match action {
            Action::Treci => treci(&mut s),
            Action::Ramai => ramai(&mut s),
            Action::Again => return Ok(again(&s, now_ms)),
            Action::Tick | Action::Pause | Action::Resume => false,
            _ => return Err(Refusal::NotNow),
        },
        Phase::Ended => match action {
            Action::Again => return Ok(again(&s, now_ms)),
            Action::Tick | Action::Pause | Action::Resume => false,
            _ => return Err(Refusal::NotNow),
        },
        Phase::Wake => match action {
            Action::Begin | Action::Treci | Action::Ramai | Action::Again => return Err(Refusal::NotNow),
            Action::Tick => tick(&mut s, now_ms),
            Action::CloseDay => {
                close_day(&mut s, now_ms, true);
                true
            }
            Action::Pause => pause(&mut s, now_ms),
            Action::Resume => resume(&mut s, now_ms),
            Action::Place { dor, on } => place(&mut s, dor, on)?,
            Action::Resolve { dor, grade } => resolve(&mut s, dor, grade)?,
            Action::Bantuie { loc } => bantuie(&mut s, loc)?,
            Action::Asculta { om } => asculta(&mut s, om)?,
            Action::Tie { dor } => tie(&mut s, dor)?,
            Action::Untie { dor } => untie(&mut s, dor)?,
            Action::Stinge => stinge(&mut s, now_ms)?,
            Action::Rest => rest(&mut s, now_ms)?,
        },
    };
    if changed {
        s.rev += 1;
    }
    Ok(s)
}

// ---------------------------------------------------------------- the boot, the door

/// They brought you home: the candle is lit at your head, the first day runs, the first Dor arrive.
fn begin(s: &mut State, now: u64) -> bool {
    s.phase = Phase::Wake;
    s.clock = Clock {
        day_ends_at: now + s.config.zi_ms,
        dusk_at: now + s.config.zi_ms - s.config.zi_noapte_ms,
        paused_at: None,
        precued: false,
        closing: false,
    };
    log(s, Event::BroughtHome);
    arrivals(s);
    refresh_presence(s);
    log(s, Event::DayBegan);
    true
}

/// Your card on the dark door: the wedding.
fn treci(s: &mut State) -> bool {
    s.treci = true;
    log(s, Event::Treci);
    end(s, Ending::Nunta);
    true
}

/// She stood in the door and you would not go: you remain (chapter §10).
fn ramai(s: &mut State) -> bool {
    log(s, Event::Ramai);
    end(s, Ending::Ratacire);
    true
}

/// Another wake from the dark: a new dead, the same house. Nothing of this wake carries over in M0.
fn again(s: &State, now: u64) -> State {
    let mut next = new_state(s.config.clone(), now);
    next.rev = s.rev + 1;
    next
}

// ---------------------------------------------------------------- the clock

fn awake(s: &State) -> Result<(), Refusal> {
    if s.phase == Phase::Wake && s.clock.paused_at.is_none() && !s.clock.closing {
        Ok(())
    } else {
        Err(Refusal::NotNow)
    }
}

/// Whether a tick at `now` would bring the dusk, sound the pre-cue or close the day.
pub fn tick_due(s: &State, now: u64) -> bool {
    s.phase == Phase::Wake
        && s.clock.paused_at.is_none()
        && ((!s.night && now >= s.clock.dusk_at)
            || (!s.clock.precued && now + s.config.precue_ms >= s.clock.day_ends_at)
            || now >= s.clock.day_ends_at)
}

fn tick(s: &mut State, now: u64) -> bool {
    if s.clock.paused_at.is_some() {
        return false;
    }
    let mut changed = false;
    if !s.night && now >= s.clock.dusk_at {
        s.night = true;
        log(s, Event::Dusk);
        changed = true;
    }
    if !s.clock.precued && now + s.config.precue_ms >= s.clock.day_ends_at {
        s.clock.precued = true;
        log(s, Event::Precue);
        changed = true;
    }
    if now >= s.clock.day_ends_at {
        let early = s.clock.closing;
        close_day(s, now, early);
        changed = true;
    }
    changed
}

/// The day closes one pre-cue from now: the flame gutters with its dry tick first.
fn begin_close(s: &mut State, now: u64) {
    s.clock.closing = true;
    s.clock.day_ends_at = s.clock.day_ends_at.min(now + s.config.precue_ms);
    if !s.clock.precued {
        s.clock.precued = true;
        log(s, Event::Precue);
    }
}

fn pause(s: &mut State, now: u64) -> bool {
    if s.clock.paused_at.is_some() {
        return false;
    }
    s.clock.paused_at = Some(now);
    log(s, Event::Paused);
    true
}

fn resume(s: &mut State, now: u64) -> bool {
    match s.clock.paused_at.take() {
        Some(at) => {
            let gap = now.saturating_sub(at);
            s.clock.day_ends_at += gap;
            s.clock.dusk_at += gap;
            log(s, Event::Resumed);
            true
        }
        None => false,
    }
}

/// STINGE: you blow the candle out and the night begins now; the living notice (chapter §3).
fn stinge(s: &mut State, now: u64) -> Result<bool, Refusal> {
    awake(s)?;
    if s.night {
        return Err(Refusal::NotNow);
    }
    s.night = true;
    s.clock.dusk_at = now;
    s.spaima = (s.spaima + s.config.spaima_stinge).min(s.config.spaima_cap);
    let spaima = s.spaima;
    log(s, Event::Stinge { spaima });
    Ok(true)
}

/// ODIHNESTE-TE: you lie back; the night (or what is left of the day) passes, and dawn comes after
/// the pre-cue. Corded once a night act was committed (chapter §3).
fn rest(s: &mut State, now: u64) -> Result<bool, Refusal> {
    awake(s)?;
    if s.commit.is_some() {
        return Err(Refusal::Busy);
    }
    if s.night_acted {
        return Err(Refusal::Corded);
    }
    s.rest_pending = true;
    begin_close(s, now);
    Ok(true)
}

// ---------------------------------------------------------------- the acts

fn locked(s: &State) -> bool {
    s.day <= s.preot_until
}

/// How well a thing, a person or a place answers a Dor (chapter §5): one point for the kind among
/// its affinities, one for the owner being the sender. A fragment is of every kind and nobody's.
pub fn match_points(fel: Fel, from: Om, target: &Card) -> u8 {
    let (fels, owner): (&[Fel], Option<Om>) = match &target.kind {
        Kind::Lucru { fel, owner, .. } => (fel, *owner),
        Kind::Om { om, fel } => (fel, Some(*om)),
        Kind::Loc { fel, .. } => (std::slice::from_ref(fel), None),
        Kind::Frantura => (&Fel::ALL, None),
        _ => (&[], None),
    };
    u8::from(fels.contains(&fel)) + u8::from(owner == Some(from))
}

fn owner_of(target: &Card) -> Option<Om> {
    match &target.kind {
        Kind::Lucru { owner, .. } => *owner,
        Kind::Om { om, .. } => Some(*om),
        _ => None,
    }
}

/// A Dor dropped on a card: the verb the target implies, the Putere spent, the play opened.
fn place(s: &mut State, dor: u32, on: u32) -> Result<bool, Refusal> {
    awake(s)?;
    if s.commit.is_some() {
        return Err(Refusal::Busy);
    }
    let dor_card = find(s, dor)?;
    let tied = match (&dor_card.kind, dor_card.at) {
        (Kind::Dor { .. }, Where::Cloth) => false,
        (Kind::Dor { .. }, Where::Sill) => true,
        _ => return Err(Refusal::DoesNotFit),
    };
    let target = find(s, on)?;
    let verb = match (&target.kind, target.at) {
        (Kind::Lucru { rests_until, .. }, Where::Kit) => {
            if *rests_until >= s.day {
                return Err(Refusal::Spent);
            }
            Verb::Urneste
        }
        (Kind::Frantura, Where::Cloth) => Verb::Urneste,
        (Kind::Om { om, .. }, Where::Cloth) if s.night => {
            if om.source().is_none() {
                return Err(Refusal::DoesNotFit);
            }
            if s.dreams_tonight >= s.config.vis_max {
                return Err(Refusal::Spent);
            }
            Verb::Sopteste
        }
        (Kind::Om { .. }, Where::Cloth) => Verb::Arata,
        (Kind::Loc { .. }, Where::Road) => Verb::Arata,
        _ => return Err(Refusal::DoesNotFit),
    };
    if locked(s) && matches!(verb, Verb::Urneste | Verb::Arata) {
        return Err(Refusal::Locked);
    }
    let cost = cost_of(&s.config, verb);
    if s.putere < cost {
        return Err(Refusal::Tired);
    }
    if tied {
        log(s, Event::Untied { dor });
    }
    set_at(s, dor, Where::Niche(verb));
    set_at(s, on, Where::Niche(verb));
    s.putere -= cost;
    s.stats.putere_spent += u32::from(cost);
    s.commit = Some(Commit { dor, on, verb, night: s.night });
    log(s, Event::Committed { dor, on, verb });
    Ok(true)
}

fn cost_of(cfg: &Config, verb: Verb) -> u8 {
    match verb {
        Verb::Urneste => cfg.cost_urneste,
        Verb::Sopteste => cfg.cost_sopteste,
        Verb::Arata => cfg.cost_arata,
        Verb::Bantuie => cfg.cost_bantuie,
        Verb::Asculta => cfg.cost_asculta,
        Verb::Odihneste => 0,
    }
}

/// The renderer reports the play's grade: the act resolves (chapter §5, §6, §7).
fn resolve(s: &mut State, dor: u32, grade: Grade) -> Result<bool, Refusal> {
    awake(s)?;
    match s.commit {
        Some(c) if c.dor == dor => {
            s.commit = None;
            act(s, c, grade);
            Ok(true)
        }
        _ => Err(Refusal::NotNow),
    }
}

/// One act = one Amintire of strength = matches (capped for a repeated dream), plus the play's grade;
/// the simulator's `act()` to the letter.
fn act(s: &mut State, c: Commit, grade: Grade) {
    let cfg = s.config.clone();
    let (fel, from) = match &find(s, c.dor).expect("the committed Dor").kind {
        Kind::Dor { fel, from, .. } => (*fel, *from),
        _ => unreachable!("a commit holds a Dor"),
    };
    let target = find(s, c.on).expect("the committed target").clone();
    let mut m = match_points(fel, from, &target);
    let mut repeat = false;
    let sleeper = match (&target.kind, c.verb) {
        (Kind::Om { om, .. }, Verb::Sopteste) => Some(*om),
        _ => None,
    };
    if sleeper.is_some() && sleeper == s.last_dream && m > cfg.vis_repeat_cap {
        m = cfg.vis_repeat_cap;
        repeat = true;
    }
    let h = usize::from(c.night);
    let mut sp = match c.verb {
        Verb::Urneste => cfg.spaima_urneste[h],
        Verb::Sopteste => cfg.spaima_sopteste[h],
        Verb::Arata => {
            cfg.spaima_arata[h] + if grade == Grade::Minunat { cfg.spaima_minunat_arata } else { 0 }
        }
        _ => 0,
    };
    if repeat {
        sp += cfg.spaima_repeat_sleeper;
    }
    // the vigil nights: the masked players take the blame (chapter §6)
    if c.night && s.day <= cfg.masti_zile && c.verb != Verb::Sopteste {
        sp = 0;
    }
    s.spaima = (s.spaima + sp).min(cfg.spaima_cap);
    let grade = if grade == Grade::Slab { Grade::Skipped } else { grade };
    let mut strength = m;
    let mut minune = false;
    if m == 2 && grade == Grade::Minunat && !s.minuni.contains(&fel) {
        minune = true;
        s.minuni.push(fel);
        strength = 3;
    }
    s.stats.amintiri[usize::from(strength)] += 1;
    let day = s.day;
    let src = from.source().expect("a Dor's sender is a source");
    s.amintiri[src].push(Amintire { fel, strength, day });
    match strength {
        1 => s.standing_m[src] += cfg.amintire_rate_m,
        2 | 3 => s.standing_m[src] += 2 * cfg.amintire_rate_m,
        _ => {}
    }
    if minune {
        s.minune_promise = true;
        add(s, Kind::Semn { fel }, Where::Cloth);
    }
    match &target.kind {
        Kind::Frantura => {
            remove(s, c.on);
            s.stats.franturi_used += 1;
        }
        Kind::Lucru { .. } => {
            let until = day + cfg.lucru_odihna;
            if let Some(Kind::Lucru { rests_until, .. }) =
                s.cards.iter_mut().find(|x| x.id == c.on).map(|x| &mut x.kind)
            {
                *rests_until = until;
            }
            set_at(s, c.on, Where::Kit);
        }
        Kind::Om { .. } => set_at(s, c.on, Where::Cloth),
        Kind::Loc { .. } => set_at(s, c.on, Where::Road),
        _ => {}
    }
    if fel == Fel::Vrajba && strength >= 1 {
        s.spaima = s.spaima.saturating_sub(cfg.spaima_vrajba_calm);
    }
    s.stats.acts += 1;
    s.stats.plays += 1;
    if grade == Grade::Skipped {
        s.stats.skipped += 1;
    }
    let g = if grade == Grade::Skipped { Grade::Bun } else { grade };
    let mut pom = match g {
        Grade::Minunat => cfg.pomenire_minunat,
        Grade::Bun => cfg.pomenire_bun,
        _ => 0,
    };
    if strength == 2 {
        pom += cfg.pomenire_vie;
    }
    if minune {
        pom += cfg.pomenire_minune;
    }
    if c.verb == Verb::Sopteste && g == Grade::Minunat {
        // the dream-request answered: at dawn the sleeper leaves a thing on the table (chapter §5)
        pom += cfg.pomenire_vis_minunat;
        let card = add_lucru(s, Lucru::Pomana, vec![fel], Some(from), day + cfg.pomana_zile);
        s.stats.pomane += 1;
        log(s, Event::Pomana { card, from });
    }
    if c.verb == Verb::Arata {
        if !c.night {
            pom *= cfg.arata_zi_mult;
        }
        s.stats.arata += 1;
    }
    remove(s, c.dor);
    log(s, Event::Resolved { dor: c.dor, verb: c.verb, grade, strength, minune, spaima: sp });
    pomenire(s, pom, owner_of(&target));
    if let Some(om) = sleeper {
        s.dreamed_tonight = Some(om);
        s.dreams_tonight += 1;
    }
    if c.night {
        s.night_acted = true;
    }
    refresh_presence(s);
}

/// The living name you: Uitare taken off; named with nothing to forgive, that person thinks of
/// you a little more (chapter §7).
fn pomenire(s: &mut State, n: u8, src: Option<Om>) {
    if n == 0 {
        return;
    }
    let before = s.uitare;
    s.uitare = s.uitare.saturating_sub(n);
    s.stats.pomeniri += 1;
    if before == 0 {
        s.stats.pomeniri_noop += 1;
        if let Some(i) = src.and_then(Om::source) {
            s.standing_m[i] += s.config.pomenire_standing_m;
        }
    }
    let uitare = s.uitare;
    log(s, Event::Pomenire { n, uitare });
}

/// BANTUIE: a place on the road row; you are there at once (chapter §9).
fn bantuie(s: &mut State, loc_id: u32) -> Result<bool, Refusal> {
    awake(s)?;
    if s.commit.is_some() {
        return Err(Refusal::Busy);
    }
    let card = find(s, loc_id)?;
    let loc = match (&card.kind, card.at) {
        (Kind::Loc { loc, .. }, Where::Road) => *loc,
        _ => return Err(Refusal::DoesNotFit),
    };
    if loc.village() && !s.night {
        return Err(Refusal::OnlyAtNight);
    }
    let cost = s.config.cost_bantuie;
    if s.putere < cost {
        return Err(Refusal::Tired);
    }
    s.putere -= cost;
    s.stats.putere_spent += u32::from(cost);
    s.stats.walks += 1;
    let mut finds = Vec::new();
    if !s.walked.contains(&loc) {
        s.walked.push(loc);
        for lucru in loc.finds() {
            finds.push(add_lucru(s, *lucru, lucru.affinities().to_vec(), lucru.owner(), 0));
        }
    }
    if s.night {
        s.night_at = Some(loc);
    }
    if loc == Loc::Biserica {
        s.biserica_known = true;
    }
    log(s, Event::Walked { loc, finds });
    refresh_presence(s);
    Ok(true)
}

/// ASCULTA: a fragment of what this person says of you (chapter §5); at most `franturi_max` held.
fn asculta(s: &mut State, om_id: u32) -> Result<bool, Refusal> {
    awake(s)?;
    if s.commit.is_some() {
        return Err(Refusal::Busy);
    }
    let card = find(s, om_id)?;
    let om = match (&card.kind, card.at) {
        (Kind::Om { om, .. }, Where::Cloth) => *om,
        _ => return Err(Refusal::DoesNotFit),
    };
    if franturi(s) >= s.config.franturi_max {
        return Err(Refusal::Full);
    }
    let cost = s.config.cost_asculta;
    if s.putere < cost {
        return Err(Refusal::Tired);
    }
    s.putere -= cost;
    s.stats.putere_spent += u32::from(cost);
    let card = add(s, Kind::Frantura, Where::Cloth);
    log(s, Event::Listened { om, card });
    Ok(true)
}

/// A Dor tied on the troita's sill: the sill slows it, it does not stop it (chapter §4).
fn tie(s: &mut State, dor: u32) -> Result<bool, Refusal> {
    awake(s)?;
    let card = find(s, dor)?;
    if !matches!((&card.kind, card.at), (Kind::Dor { .. }, Where::Cloth)) {
        return Err(Refusal::DoesNotFit);
    }
    if s.cards.iter().filter(|c| c.at == Where::Sill).count() >= usize::from(s.config.sill) {
        return Err(Refusal::Full);
    }
    let day = s.day;
    if let Some(Kind::Dor { tied_at, .. }) = s.cards.iter_mut().find(|c| c.id == dor).map(|c| &mut c.kind) {
        *tied_at = day;
    }
    set_at(s, dor, Where::Sill);
    log(s, Event::Tied { dor });
    Ok(true)
}

fn untie(s: &mut State, dor: u32) -> Result<bool, Refusal> {
    awake(s)?;
    let card = find(s, dor)?;
    if !matches!((&card.kind, card.at), (Kind::Dor { .. }, Where::Sill)) {
        return Err(Refusal::DoesNotFit);
    }
    if let Some(Kind::Dor { tied_at, .. }) = s.cards.iter_mut().find(|c| c.id == dor).map(|c| &mut c.kind) {
        *tied_at = 0;
    }
    set_at(s, dor, Where::Cloth);
    log(s, Event::Untied { dor });
    Ok(true)
}

// ---------------------------------------------------------------- the close

fn close_day(s: &mut State, now: u64, early: bool) {
    let cfg = s.config.clone();
    log(s, Event::DayClosed { early });
    // a play left open resolves as the skip does
    if let Some(c) = s.commit.take() {
        act(s, c, Grade::Skipped);
    }
    if s.rest_pending {
        s.rest_pending = false;
        s.putere = cfg.putere;
        s.spaima = s.spaima.saturating_sub(cfg.rest_spaima);
        s.dreamed_tonight = None;
        s.stats.rested += 1;
        log(s, Event::Rested);
    }
    let d = s.day;
    rot(s, d);
    // on the last day the Bride stands before the house's last meal (chapter §10, ruled 2026-10-14)
    if d >= cfg.zile && s.uitare <= cfg.nunta_uitare {
        s.phase = Phase::Door;
        s.ending = Some(Ending::Nunta);
        log(s, Event::BrideStands);
        return;
    }
    if cfg.soroace.contains(&d) {
        if s.uitare < cfg.soroc_uitare_max || s.minune_promise {
            s.minune_promise = false;
            s.stats.soroace.push(d);
            log(s, Event::SorocHeld { soroc: d });
            pomenire(s, cfg.pomenire_soroc, Some(Om::Mama));
            s.afterglow.extend(Om::SOURCES);
        } else {
            s.stats.missed.push(d);
            s.uitare = s.uitare.saturating_add(cfg.uitare_soroc_sarit);
            let uitare = s.uitare;
            log(s, Event::SorocMissed { soroc: d, uitare });
        }
    }
    if d == cfg.burial_day && !s.buried {
        s.buried = true;
        if let Some(id) = s.cards.iter().find(|c| c.kind == Kind::CelNenuntit).map(|c| c.id) {
            set_at(s, id, Where::Cimitir);
        }
        log(s, Event::Buried);
    }
    if !s.candle {
        s.uitare = s.uitare.saturating_add(cfg.uitare_dark_dawn);
        s.stats.dark_dawns += 1;
        let uitare = s.uitare;
        log(s, Event::DarkDawn { uitare });
    }
    s.cards.retain(|c| !matches!(c.kind, Kind::Lucru { leaves_at, .. } if leaves_at != 0 && leaves_at <= d));
    let kit = s.cards.iter().filter(|c| matches!(c.kind, Kind::Lucru { .. })).count() as u32;
    s.stats.kit_peak = s.stats.kit_peak.max(kit);
    for st in s.standing_m.iter_mut() {
        *st = st.saturating_sub(cfg.amintire_fade_m);
    }
    s.stats.cloth_peak = s.stats.cloth_peak.max(cloth(s));
    s.stats.uitare_peak = s.stats.uitare_peak.max(s.uitare);
    s.stats.spaima_peak = s.stats.spaima_peak.max(s.spaima);
    if s.uitare >= 4 {
        s.stats.uitare_ge4 += 1;
    }
    if s.uitare >= cfg.uitare_cap {
        return end(s, Ending::Uitare);
    }
    if s.spaima >= cfg.spaima_vanator {
        return end(s, Ending::Tarus);
    }
    if s.spaima >= cfg.spaima_preot && !locked(s) {
        s.preot_services += 1;
        s.preot_until = d + cfg.preot_zile;
        s.spaima = cfg.preot_spaima;
        let (service, until) = (s.preot_services, s.preot_until);
        log(s, Event::Priest { service, until });
        if s.preot_services >= cfg.preot_services_max {
            return end(s, Ending::Dezlegare);
        }
    }
    if locked(s) {
        pomenire(s, cfg.pomenire_dezlegare, None);
    }
    s.spaima = s.spaima.saturating_sub(cfg.spaima_decay);
    if d >= cfg.zile {
        // the door stayed dark at the check: you remain
        end(s, Ending::Ratacire);
        return;
    }
    // the house stops lighting the candle at the threshold, and relights only after
    // candle_relight_zile dawns under it (chapter §3)
    if s.uitare >= cfg.candle_uitare {
        s.candle = false;
        s.under = 0;
    } else {
        s.under += 1;
        if !s.candle && s.under >= cfg.candle_relight_zile {
            s.candle = true;
        }
    }
    let lit = s.candle;
    log(s, Event::Candle { lit });
    s.putere = (s.putere + cfg.putere_regen).min(cfg.putere);
    s.day += 1;
    s.night_at = None;
    s.last_dream = s.dreamed_tonight.take();
    s.dreams_tonight = 0;
    s.night_acted = false;
    s.night = !s.candle;
    let paused = s.clock.paused_at.is_some();
    s.clock = Clock {
        day_ends_at: now + cfg.zi_ms,
        dusk_at: if s.candle { now + cfg.zi_ms - cfg.zi_noapte_ms } else { now },
        paused_at: paused.then_some(now),
        precued: false,
        closing: false,
    };
    arrivals(s);
    refresh_presence(s);
    log(s, Event::DayBegan);
}

/// Loose Dor count down; at none they gutter into Uitare. A tied Dor loses a day every
/// `sill_zile`-th close after it was tied. Arrivals follow this step, so nothing counts down at the
/// close it arrived (chapter §3's lifetime rule).
fn rot(s: &mut State, d: u8) {
    let cfg = s.config.clone();
    let mut gone = Vec::new();
    for c in s.cards.iter_mut() {
        if let Kind::Dor { fel, left, tied_at, .. } = &mut c.kind {
            let ticks = match c.at {
                Where::Cloth => true,
                Where::Sill => d > *tied_at && (d - *tied_at).is_multiple_of(cfg.sill_zile),
                _ => false,
            };
            if ticks {
                *left = left.saturating_sub(1);
                if *left == 0 {
                    gone.push((c.id, *fel, c.at == Where::Sill));
                }
            }
        }
    }
    for (card, fel, tied) in gone {
        remove(s, card);
        s.uitare = s.uitare.saturating_add(cfg.uitare_guttered);
        s.stats.guttered += 1;
        s.stats.guttered_by_fel[fel.index()] += 1;
        let uitare = s.uitare;
        log(s, Event::Guttered { card, fel, tied, uitare });
    }
}

fn end(s: &mut State, ending: Ending) {
    s.phase = Phase::Ended;
    s.ending = Some(ending);
    log(s, Event::Ended { ending });
}

// ---------------------------------------------------------------- arrivals (chapter §4)

/// `forget^k` in thousandths, pinned from the float the simulator uses: the integer economy
/// reproduces the simulator's runs exactly (addendum §3).
pub fn forget_pow_m(forget_m: u32, k: u32) -> u32 {
    let f = f64::from(forget_m) / 1000.0;
    let mut p = 1.0f64;
    for _ in 0..k {
        p *= f;
    }
    (p * 1000.0).round_ties_even() as u32
}

fn rada_present(s: &State) -> bool {
    s.day <= s.config.rada_zile || s.config.soroace.contains(&s.day)
}

/// Forgetting decays each source's rate; a standing memory is a floor under it (capped, fading);
/// fear feeds the enemy and the priest; Rada doubles the house; a night-only day halves it. Two caps:
/// one Dor per person per day, three a day in all, the strongest longing first. A held soroc's
/// afterglow sends one more a day above both caps. Deterministic: an accumulator per source.
fn arrivals(s: &mut State) {
    let cfg = s.config.clone();
    let d = s.day;
    let cap = 1000 + 1000 * cfg.dor_max_src;
    let mut pending: Vec<(u32, u8, u8, usize)> = Vec::new();
    for (i, om) in Om::SOURCES.iter().enumerate() {
        let forget = if *om == Om::Dusman { cfg.forget_dusman_m } else { cfg.forget_m };
        let decayed = (cfg.base_m[i] * forget_pow_m(forget, u32::from(d) - 1) + 500) / 1000;
        let mut rate = decayed.max(s.standing_m[i].min(cfg.standing_cap_m));
        if matches!(om, Om::Dusman | Om::Preot) {
            rate += cfg.fear_dor_m * u32::from(s.spaima.saturating_sub(cfg.fear_from));
        }
        if rada_present(s) {
            rate = (rate * cfg.rada_mult_m + 500) / 1000;
        }
        if !s.candle {
            rate = rate.div_ceil(2);
        }
        s.acc_m[i] = (s.acc_m[i] + rate).min(cap);
        let mut sent = 0;
        while s.acc_m[i] >= 1000 && sent < cfg.dor_max_src {
            s.acc_m[i] -= 1000;
            sent += 1;
            // the simulator sorts (remaining longing, days since last sent, name) descending
            pending.push((s.acc_m[i] + 1000, d - s.last_sent[i], NAME_RANK[i], i));
        }
    }
    pending.sort_by(|a, b| b.cmp(a));
    if !s.afterglow.is_empty() {
        let om = s.afterglow.remove(0);
        arrive(s, om, true);
    }
    for (n, &(_, _, _, i)) in pending.iter().enumerate() {
        if n < cfg.dor_max_day {
            arrive(s, Om::SOURCES[i], false);
            s.last_sent[i] = d;
        } else {
            s.acc_m[i] = (s.acc_m[i] + 1000).min(cap);
        }
    }
}

/// The simulator breaks ties by name, descending: preot, mama, frate, dusman, draguta.
const NAME_RANK: [u8; 5] = [4, 1, 3, 2, 5];

fn arrive(s: &mut State, from: Om, afterglow: bool) {
    let fel = from.fel().expect("a source");
    let left = s.config.dor_zile;
    let card = add(s, Kind::Dor { fel, from, left, tied_at: 0 }, Where::Cloth);
    s.stats.arrived += 1;
    log(s, Event::Arrived { card, fel, from, afterglow });
}

// ---------------------------------------------------------------- the table

/// Who is at the table (chapter §9): Mama always; Draguta from day 2; Frate de cruce the vigil
/// nights and the soroace; Dusman only on a night you went to Sat; Preot once Biserica is known;
/// Rada while she keens. The village places lie on the road from the burial on.
fn refresh_presence(s: &mut State) {
    let d = s.day;
    let cfg = &s.config;
    let soroc = cfg.soroace.contains(&d);
    for c in s.cards.iter_mut() {
        if matches!(c.at, Where::Niche(_)) {
            continue;
        }
        match &c.kind {
            Kind::Om { om, .. } => {
                let present = match om {
                    Om::Mama => true,
                    Om::Draguta => d >= cfg.draguta_from,
                    Om::Frate => d <= cfg.burial_day || soroc,
                    Om::Dusman => s.night_at == Some(Loc::Sat),
                    Om::Preot => s.biserica_known || s.night_at == Some(Loc::Biserica),
                    Om::Rada => d <= cfg.rada_zile || soroc,
                };
                c.at = if present { Where::Cloth } else { Where::Away };
            }
            Kind::Loc { loc, .. } => {
                let on_road = !loc.village() || d >= cfg.burial_day;
                c.at = if on_road { Where::Road } else { Where::Away };
            }
            _ => {}
        }
    }
}

/// The sleepers within reach tonight: the sources at the table.
pub fn sleepers(s: &State) -> Vec<Om> {
    s.cards
        .iter()
        .filter(|c| c.at == Where::Cloth)
        .filter_map(|c| match &c.kind {
            Kind::Om { om, .. } if om.source().is_some() => Some(*om),
            _ => None,
        })
        .collect()
}

fn franturi(s: &State) -> usize {
    s.cards.iter().filter(|c| c.kind == Kind::Frantura && c.at == Where::Cloth).count()
}

/// What the cloth holds, as the simulator counts it: Dor stacks by (kind, days left), fragments, sleepers.
fn cloth(s: &State) -> u32 {
    let mut stacks: Vec<(Fel, u8)> = s
        .cards
        .iter()
        .filter(|c| c.at == Where::Cloth)
        .filter_map(|c| match &c.kind {
            Kind::Dor { fel, left, .. } => Some((*fel, *left)),
            _ => None,
        })
        .collect();
    stacks.sort();
    stacks.dedup();
    (stacks.len() + franturi(s) + sleepers(s).len()) as u32
}

/// Uitare at the next three dawns if nothing is done: the counter plus the loose Dor by stub (chapter §3),
/// never past `uitare_cap`: there is no dawn beyond the Uitare ending.
pub fn forecast(s: &State) -> [u8; 3] {
    let mut f = [0u8; 3];
    let mut u = s.uitare;
    for (k, slot) in f.iter_mut().enumerate() {
        let due = s
            .cards
            .iter()
            .filter(|c| c.at == Where::Cloth)
            .filter(|c| matches!(c.kind, Kind::Dor { left, .. } if usize::from(left) == k + 1))
            .count();
        u = u.saturating_add(due as u8).min(s.config.uitare_cap);
        *slot = u;
    }
    f
}

/// With Putere and a Dor there is always a thing, a fragment or a sleeper (chapter §4).
pub fn legal_act_exists(s: &State) -> bool {
    let loose = s.cards.iter().any(|c| c.at == Where::Cloth && matches!(c.kind, Kind::Dor { .. }));
    let thing = s.cards.iter().any(|c| {
        c.at == Where::Kit && matches!(c.kind, Kind::Lucru { rests_until, .. } if rests_until < s.day)
    });
    !loose || s.putere == 0 || thing || franturi(s) > 0 || !sleepers(s).is_empty()
}

// ---------------------------------------------------------------- cards

fn add(s: &mut State, kind: Kind, at: Where) -> u32 {
    let id = s.next_id;
    s.next_id += 1;
    s.cards.push(Card { id, kind, at, born: s.day });
    id
}

fn add_lucru(s: &mut State, lucru: Lucru, fel: Vec<Fel>, owner: Option<Om>, leaves_at: u8) -> u32 {
    add(s, Kind::Lucru { lucru, fel, owner, rests_until: 0, leaves_at }, Where::Kit)
}

fn remove(s: &mut State, id: u32) {
    s.cards.retain(|c| c.id != id);
}

fn find(s: &State, id: u32) -> Result<&Card, Refusal> {
    s.cards.iter().find(|c| c.id == id).ok_or(Refusal::NoSuchCard)
}

fn set_at(s: &mut State, id: u32, at: Where) {
    if let Some(c) = s.cards.iter_mut().find(|c| c.id == id) {
        c.at = at;
    }
}

fn log(s: &mut State, event: Event) {
    let day = s.day;
    s.log.push(Entry { day, event });
}
