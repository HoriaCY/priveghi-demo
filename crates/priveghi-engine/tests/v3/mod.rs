//! Shared helpers for the dead's wake tests: a clock the tests drive, card lookups, the simulator's
//! summary printed from the engine's state, and the `chibzuit` policy ported from wake_sim_v3.py
//! (the considered dead), which the integration test plays against the chapter's reference run.
#![allow(dead_code)]

use priveghi_engine::v3::*;

pub const T0: u64 = 1_000_000;

/// A wake begun at T0: they brought you home, day 1 runs.
pub fn begin(config: Config) -> Wake {
    let mut w = Wake::with_config(config, T0);
    w.apply(Action::Begin, T0).unwrap();
    w
}

pub fn wake() -> Wake {
    begin(Config::default())
}

/// When this day began, as the clock has it.
pub fn day_start(w: &Wake) -> u64 {
    w.state.clock.day_ends_at - w.state.config.zi_ms
}

/// A moment inside the day half.
pub fn by_day(w: &Wake) -> u64 {
    day_start(w) + 1_000
}

/// Ticks the clock to dusk: the night begins on its own.
pub fn dusk(w: &mut Wake) -> u64 {
    let at = w.state.clock.dusk_at;
    w.apply(Action::Tick, at).unwrap();
    assert!(w.state.night, "dusk brings the night");
    at + 1_000
}

/// Ticks the clock past the close.
pub fn close(w: &mut Wake) {
    let at = w.state.clock.day_ends_at;
    w.apply(Action::Tick, at).unwrap();
}

pub fn ids_where(w: &Wake, at: Where) -> Vec<u32> {
    w.state.cards.iter().filter(|c| c.at == at).map(|c| c.id).collect()
}

pub fn dor_ids(w: &Wake, at: Where) -> Vec<u32> {
    w.state.cards.iter().filter(|c| c.at == at && matches!(c.kind, Kind::Dor { .. })).map(|c| c.id).collect()
}

pub fn dor(w: &Wake, id: u32) -> (Fel, Om, u8) {
    match &card(w, id).kind {
        Kind::Dor { fel, from, left, .. } => (*fel, *from, *left),
        k => panic!("{id} is not a Dor: {k:?}"),
    }
}

pub fn card(w: &Wake, id: u32) -> &Card {
    w.state.cards.iter().find(|c| c.id == id).expect("a card on the table")
}

pub fn lucru_id(w: &Wake, lucru: Lucru) -> u32 {
    w.state
        .cards
        .iter()
        .find(|c| matches!(&c.kind, Kind::Lucru { lucru: l, .. } if *l == lucru))
        .map(|c| c.id)
        .expect("the thing is on the table")
}

pub fn om_id(w: &Wake, om: Om) -> u32 {
    w.state
        .cards
        .iter()
        .find(|c| matches!(&c.kind, Kind::Om { om: o, .. } if *o == om))
        .map(|c| c.id)
        .expect("a person")
}

pub fn loc_id(w: &Wake, loc: Loc) -> u32 {
    w.state
        .cards
        .iter()
        .find(|c| matches!(&c.kind, Kind::Loc { loc: l, .. } if *l == loc))
        .map(|c| c.id)
        .expect("a place")
}

pub fn you(w: &Wake) -> &Card {
    w.state.cards.iter().find(|c| c.kind == Kind::CelNenuntit).expect("your card")
}

/// Things in the kit row that are not resting, in table order.
pub fn things_ready(w: &Wake) -> Vec<u32> {
    w.state
        .cards
        .iter()
        .filter(|c| {
            c.at == Where::Kit
                && matches!(c.kind, Kind::Lucru { rests_until, .. } if rests_until < w.state.day)
        })
        .map(|c| c.id)
        .collect()
}

pub fn franturi(w: &Wake) -> Vec<u32> {
    w.state.cards.iter().filter(|c| c.at == Where::Cloth && c.kind == Kind::Frantura).map(|c| c.id).collect()
}

/// The sleepers within reach, in the economy's order.
pub fn sleeper_ids(w: &Wake) -> Vec<u32> {
    Om::SOURCES
        .iter()
        .filter_map(|om| {
            w.state
                .cards
                .iter()
                .find(|c| c.at == Where::Cloth && matches!(&c.kind, Kind::Om { om: o, .. } if o == om))
        })
        .map(|c| c.id)
        .collect()
}

/// Events logged since the last close began.
pub fn last_close(w: &Wake) -> Vec<Event> {
    let at = w
        .state
        .log
        .iter()
        .rposition(|e| matches!(e.event, Event::DayClosed { .. }))
        .expect("a close happened");
    w.state.log[at..].iter().map(|e| e.event.clone()).collect()
}

/// Commits a Dor on a card and resolves its play at once.
pub fn act(w: &mut Wake, dor: u32, on: u32, grade: Grade, now: u64) -> Result<bool, Refusal> {
    w.apply(Action::Place { dor, on }, now)?;
    w.apply(Action::Resolve { dor, grade }, now)
}

pub fn tally(w: &Wake) -> [u32; 5] {
    let mut t = [0u32; 5];
    for (i, list) in w.state.amintiri.iter().enumerate() {
        t[i] = list.iter().map(|a| u32::from(a.strength)).sum();
    }
    t
}

// ---------------------------------------------------------------- the simulator's summary

/// The five lines wake_sim_v3.py prints, from the engine's state, so the reference file is compared
/// whole and nothing is retyped.
pub fn summary(w: &Wake, policy: &str) -> String {
    let s = &w.state;
    let st = &s.stats;
    let cfg = &s.config;
    let names = ["mama", "draguta", "frate", "dusman", "preot"];
    let kinds = ["neam", "dragoste", "frate", "vrajba", "rugaciune"];
    let ending = match s.ending {
        Some(Ending::Nunta) => "Nunt\u{103}",
        Some(Ending::Ratacire) => "R\u{103}t\u{103}cire",
        Some(Ending::Uitare) => "Uitare",
        Some(Ending::Tarus) => "\u{21a}\u{103}ru\u{219}",
        Some(Ending::Dezlegare) => "Dezlegare",
        None => "None",
    };
    let day_ended = if s.ending.is_some() { s.day.to_string() } else { "None".to_string() };
    let tied = dor_ids(w, Where::Sill).len();
    let loose = dor_ids(w, Where::Cloth).len();
    let dict = |vals: Vec<String>| format!("{{{}}}", vals.join(", "));
    let gut = dict(kinds.iter().zip(st.guttered_by_fel).map(|(k, n)| format!("'{k}': {n}")).collect());
    let standing = dict(
        names.iter().zip(s.standing_m).map(|(k, m)| format!("{k} {:.2}", f64::from(m) / 1000.0)).collect(),
    );
    let tally = dict(names.iter().zip(tally(w)).map(|(k, n)| format!("'{k}': {n}")).collect());
    let mut minuni: Vec<&str> = s.minuni.iter().map(|f| kinds[f.index()]).collect();
    minuni.sort();
    let minuni = format!("[{}]", minuni.iter().map(|m| format!("'{m}'")).collect::<Vec<_>>().join(", "));
    let list = |v: &[u8]| format!("[{}]", v.iter().map(u8::to_string).collect::<Vec<_>>().join(", "));
    let am = st.amintiri;
    [
        format!(
            "=== {policy} cale=none zile={} dor_zile={} putere={} seed=1 | ending={ending} day_ended={day_ended}",
            cfg.zile, cfg.dor_zile, cfg.putere
        ),
        format!(
            "uitare peak {} end {} (dawns at >=4: {}) | spaima peak {} end {} | candle unlit days {}",
            st.uitare_peak, s.uitare, st.uitare_ge4, st.spaima_peak, s.spaima, st.dark_dawns
        ),
        format!(
            "dor arrived {} guttered {} {gut} tied {tied} loose {loose} | amintiri 0/1/2/minune [{}, {}, {}, {}] | pomeniri {} (no-op {})",
            st.arrived, st.guttered, am[0], am[1], am[2], am[3], st.pomeniri, st.pomeniri_noop
        ),
        format!(
            "soroace held {} missed {} | acts {} plays {} skipped {} rested {} arata {} walks {} franturi used {} putere spent {} | preot services {} rides 0 shakes 0",
            list(&st.soroace), list(&st.missed), st.acts, st.plays, st.skipped, st.rested, st.arata, st.walks, st.franturi_used, st.putere_spent, s.preot_services
        ),
        format!(
            "standing {standing} | tally {tally} | sick {{}} dead [] | minuni {minuni} | cloth peak {} kit peak {} | dark dawns {} pomane de vis {}",
            st.cloth_peak, st.kit_peak, st.dark_dawns, st.pomane
        ),
    ]
    .join("\n")
        + "\n"
}

// ---------------------------------------------------------------- the considered dead

/// wake_sim_v3.py's `chibzuit`, ported choice for choice. It keeps the simulator's order of the
/// loose Dor (arrival order; sorted by stub when tying; an untied Dor goes last), because the
/// simulator's `best_pair` takes the first best pair in that order.
pub struct Chibzuit {
    pub hand: Vec<u32>,
    pub tied: Vec<u32>,
    read: usize,
    haunt_spaima_max: u8,
    urgent_uitare: u8,
}

impl Chibzuit {
    pub fn new() -> Chibzuit {
        Chibzuit { hand: Vec::new(), tied: Vec::new(), read: 0, haunt_spaima_max: 3, urgent_uitare: 3 }
    }

    /// New arrivals since the last look, in the order they were logged.
    fn sync(&mut self, w: &Wake) {
        for e in &w.state.log[self.read..] {
            if let Event::Arrived { card, .. } = e.event {
                self.hand.push(card);
            }
        }
        self.read = w.state.log.len();
    }

    fn grade_for(&self, w: &Wake, n: u32) -> Grade {
        if n.is_multiple_of(3) && w.state.spaima <= 1 {
            Grade::Minunat
        } else {
            Grade::Bun
        }
    }

    fn may_haunt(&self, w: &Wake, verb: Verb, night: bool, grade: Grade) -> bool {
        let s = &w.state;
        let h = usize::from(night);
        let sp = match verb {
            Verb::Urneste => s.config.spaima_urneste[h],
            Verb::Arata => s.config.spaima_arata[h],
            _ => 0,
        } + u8::from(grade == Grade::Minunat);
        let calm = self.haunt_spaima_max + u8::from(s.uitare >= self.urgent_uitare) - u8::from(night);
        s.spaima + sp < s.config.spaima_preot && s.spaima <= calm
    }

    /// The first best (Dor, card) by (matches, nearest to guttering), in the simulator's orders.
    fn best_pair(&self, w: &Wake, cards: &[u32]) -> Option<(u32, u32, u8)> {
        let mut best: Option<((u8, i16), u32, u32, u8)> = None;
        for &d in &self.hand {
            let (fel, from, left) = dor(w, d);
            for &c in cards {
                let m = match_points(fel, from, card(w, c));
                let key = (m, -i16::from(left));
                if best.is_none_or(|b| key > b.0) {
                    best = Some((key, d, c, m));
                }
            }
        }
        best.map(|(_, d, c, m)| (d, c, m))
    }

    fn act(&mut self, w: &mut Wake, d: u32, on: u32, grade: Grade, now: u64) {
        act(w, d, on, grade, now)
            .unwrap_or_else(|r| panic!("day {}: {r:?} placing {d} on {on}", w.state.day));
        self.hand.retain(|x| *x != d);
    }

    fn untie(&mut self, w: &mut Wake, now: u64) {
        if !self.tied.is_empty() && w.state.putere > 0 && self.hand.is_empty() {
            let d = self.tied.remove(0);
            w.apply(Action::Untie { dor: d }, now).unwrap();
            self.hand.push(d);
        }
    }

    fn tie_loose(&mut self, w: &mut Wake, now: u64) {
        self.hand.sort_by_key(|d| dor(w, *d).2);
        while let Some(&d) = self.hand.first() {
            if dor(w, d).2 > 1 || self.tied.len() >= usize::from(w.state.config.sill) {
                break;
            }
            w.apply(Action::Tie { dor: d }, now).unwrap();
            self.hand.remove(0);
            self.tied.push(d);
        }
    }

    /// One day, as the simulator plays it: the day half, then the night or a rest; the clock is
    /// driven to dusk and past the close.
    pub fn play_day(&mut self, w: &mut Wake) {
        self.sync(w);
        let cfg = w.state.config.clone();
        let d = w.state.day;
        let mut n = w.state.stats.plays;
        let now = by_day(w);
        if w.state.candle {
            let cards: Vec<u32> = things_ready(w).into_iter().chain(franturi(w)).collect();
            if w.state.day > w.state.preot_until {
                self.untie(w, now);
                let urgent = w.state.uitare >= self.urgent_uitare;
                if urgent && w.state.spaima <= 2 && w.state.putere >= cfg.cost_arata && !self.hand.is_empty()
                {
                    if let Some((dd, c, _)) = self.best_pair(w, &sleeper_ids(w)) {
                        self.act(w, dd, c, Grade::Bun, now);
                        n += 1;
                    }
                } else if w.state.putere >= cfg.cost_urneste
                    && !self.hand.is_empty()
                    && !cards.is_empty()
                    && self.may_haunt(w, Verb::Urneste, false, self.grade_for(w, n))
                {
                    let (dd, c, _) = self.best_pair(w, &cards).expect("a pair");
                    let g = self.grade_for(w, n);
                    self.act(w, dd, c, g, now);
                    n += 1;
                }
            }
            if d.is_multiple_of(3) && franturi(w).len() < cfg.franturi_max {
                let mama = om_id(w, Om::Mama);
                w.apply(Action::Asculta { om: mama }, now).unwrap();
            }
            if w.state.putere >= cfg.cost_bantuie {
                for loc in [Loc::Tinda, Loc::Curte] {
                    if !w.state.walked.contains(&loc) && d >= 4 {
                        let id = loc_id(w, loc);
                        w.apply(Action::Bantuie { loc: id }, now).unwrap();
                        break;
                    }
                }
            }
        }
        let rest = w.state.putere <= 1 || w.state.spaima >= cfg.spaima_preot - 1;
        if rest {
            let now = if w.state.night { now } else { dusk(w) };
            self.tie_loose(w, now);
            w.apply(Action::Rest, now).unwrap();
            close(w);
            return;
        }
        let now = if w.state.night { now } else { dusk(w) };
        self.untie(w, now);
        if d >= cfg.burial_day && w.state.putere >= cfg.cost_bantuie + cfg.cost_sopteste {
            let want: Vec<Om> = self.hand.iter().map(|d| dor(w, *d).1).collect();
            for (loc, who) in [(Loc::Sat, Om::Dusman), (Loc::Biserica, Om::Preot)] {
                if want.contains(&who) && (who != Om::Preot || !w.state.biserica_known) {
                    let id = loc_id(w, loc);
                    w.apply(Action::Bantuie { loc: id }, now).unwrap();
                    break;
                }
            }
        }
        let sleepers = sleeper_ids(w);
        let mut vis = 0;
        while !self.hand.is_empty()
            && !sleepers.is_empty()
            && w.state.putere >= cfg.cost_sopteste
            && vis < cfg.vis_max
        {
            let Some((dd, c, _)) = self.best_pair(w, &sleepers) else { break };
            let g = self.grade_for(w, n);
            self.act(w, dd, c, g, now);
            n += 1;
            vis += 1;
        }
        let cards = things_ready(w);
        if !self.hand.is_empty()
            && !cards.is_empty()
            && w.state.putere >= cfg.cost_urneste
            && w.state.day > w.state.preot_until
            && self.may_haunt(w, Verb::Urneste, true, self.grade_for(w, n))
        {
            let (dd, c, _) = self.best_pair(w, &cards).expect("a pair");
            let g = self.grade_for(w, n);
            self.act(w, dd, c, g, now);
        }
        self.tie_loose(w, now);
        close(w);
    }

    /// Plays the wake out; every day asserts the chapter's guarantee of a legal act.
    pub fn play(&mut self, w: &mut Wake) {
        while w.state.phase == Phase::Wake {
            assert!(legal_act_exists(&w.state), "day {}: no legal act", w.state.day);
            self.play_day(w);
        }
    }
}

impl Default for Chibzuit {
    fn default() -> Self {
        Chibzuit::new()
    }
}
