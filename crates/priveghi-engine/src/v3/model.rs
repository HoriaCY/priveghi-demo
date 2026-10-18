//! The dead's wake: the cards, the state of one wake, the actions a hand can take, the beats the
//! engine logs. Code ids are Romanian-ASCII; every display string lives in the renderer's strings file.

use serde::{Deserialize, Serialize};

use super::config::Config;

/// The five kinds of longing, each a bond with one of the living (chapter §4).
#[derive(Clone, Copy, Debug, PartialEq, Eq, PartialOrd, Ord, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Fel {
    Neam,
    Dragoste,
    Frate,
    Vrajba,
    Rugaciune,
}

impl Fel {
    pub const ALL: [Fel; 5] = [Fel::Neam, Fel::Dragoste, Fel::Frate, Fel::Vrajba, Fel::Rugaciune];

    pub fn index(self) -> usize {
        Fel::ALL.iter().position(|f| *f == self).expect("a kind")
    }
}

/// The living at the table. The first five send Dor (chapter §4); Rada keens and is listened to.
#[derive(Clone, Copy, Debug, PartialEq, Eq, PartialOrd, Ord, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Om {
    Mama,
    Draguta,
    Frate,
    Dusman,
    Preot,
    Rada,
}

impl Om {
    pub const ALL: [Om; 6] = [Om::Mama, Om::Draguta, Om::Frate, Om::Dusman, Om::Preot, Om::Rada];
    pub const SOURCES: [Om; 5] = [Om::Mama, Om::Draguta, Om::Frate, Om::Dusman, Om::Preot];

    /// This person's row in the economy's arrays; Rada sends no Dor.
    pub fn source(self) -> Option<usize> {
        Om::SOURCES.iter().position(|o| *o == self)
    }

    /// The kind of longing this person sends.
    pub fn fel(self) -> Option<Fel> {
        self.source().map(|i| Fel::ALL[i])
    }

    /// What this person's sleep answers to (chapter §5: the living are their own owners).
    pub fn affinities(self) -> &'static [Fel] {
        match self {
            Om::Mama => &[Fel::Neam, Fel::Rugaciune],
            Om::Draguta => &[Fel::Dragoste, Fel::Frate],
            Om::Frate => &[Fel::Frate, Fel::Dragoste],
            Om::Dusman => &[Fel::Vrajba, Fel::Neam],
            Om::Preot => &[Fel::Rugaciune, Fel::Neam],
            Om::Rada => &[],
        }
    }
}

/// The house's things and the finds (chapter §5, §9). A pomana is the thing a Minunat dream leaves.
#[derive(Clone, Copy, Debug, PartialEq, Eq, PartialOrd, Ord, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Lucru {
    Cana,
    Broboada,
    Inel,
    Icoana,
    Oglinda,
    Cutit,
    Fluier,
    Arc,
    Pomana,
}

impl Lucru {
    pub fn affinities(self) -> &'static [Fel] {
        match self {
            Lucru::Cana => &[Fel::Frate, Fel::Neam],
            Lucru::Broboada => &[Fel::Neam],
            Lucru::Inel => &[Fel::Dragoste],
            Lucru::Icoana => &[Fel::Rugaciune, Fel::Neam],
            Lucru::Oglinda => &[Fel::Dragoste, Fel::Vrajba],
            Lucru::Cutit => &[Fel::Vrajba, Fel::Frate],
            Lucru::Fluier => &[Fel::Frate, Fel::Dragoste],
            Lucru::Arc => &[Fel::Vrajba],
            Lucru::Pomana => &[],
        }
    }

    pub fn owner(self) -> Option<Om> {
        match self {
            Lucru::Cana | Lucru::Fluier => Some(Om::Frate),
            Lucru::Broboada | Lucru::Icoana => Some(Om::Mama),
            Lucru::Inel | Lucru::Oglinda => Some(Om::Draguta),
            Lucru::Cutit => Some(Om::Dusman),
            Lucru::Arc | Lucru::Pomana => None,
        }
    }
}

/// Where the dead can go (chapter §9): the house by day, the village by night from the burial on.
#[derive(Clone, Copy, Debug, PartialEq, Eq, PartialOrd, Ord, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Loc {
    Casa,
    Tinda,
    Curte,
    Sat,
    Biserica,
}

impl Loc {
    pub const ALL: [Loc; 5] = [Loc::Casa, Loc::Tinda, Loc::Curte, Loc::Sat, Loc::Biserica];

    pub fn affinity(self) -> Fel {
        match self {
            Loc::Casa => Fel::Neam,
            Loc::Tinda => Fel::Frate,
            Loc::Curte => Fel::Vrajba,
            Loc::Sat => Fel::Vrajba,
            Loc::Biserica => Fel::Rugaciune,
        }
    }

    /// What the first wander there brings to the kit row.
    pub fn finds(self) -> &'static [Lucru] {
        match self {
            Loc::Tinda => &[Lucru::Cutit, Lucru::Fluier],
            Loc::Curte => &[Lucru::Arc],
            _ => &[],
        }
    }

    /// Who sleeps there, within reach on a night you went.
    pub fn sleeper(self) -> Option<Om> {
        match self {
            Loc::Sat => Some(Om::Dusman),
            Loc::Biserica => Some(Om::Preot),
            _ => None,
        }
    }

    pub fn village(self) -> bool {
        matches!(self, Loc::Sat | Loc::Biserica)
    }
}

/// The screen of verbs: the troita niche and the five (chapter §2). Declaration order is slot order.
#[derive(Clone, Copy, Debug, PartialEq, Eq, PartialOrd, Ord, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Verb {
    Odihneste,
    Bantuie,
    Asculta,
    Urneste,
    Sopteste,
    Arata,
}

/// Where a card is: the three zones (chapter §2), the sill, a niche while its play runs, the plank
/// with your own card, the cross after the burial; `Away` for the living not at the table.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Where {
    Plank,
    Cloth,
    Kit,
    Road,
    Sill,
    Niche(Verb),
    Cimitir,
    Away,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(tag = "kind", rename_all = "snake_case")]
pub enum Kind {
    /// Your own card: your body under the sheet; Uitare is drawn on it.
    CelNenuntit,
    /// A living person's longing for you: its kind on the hem, its sender in its name, its stub in days.
    Dor {
        fel: Fel,
        from: Om,
        left: u8,
        /// The day it was tied on the sill; zero when loose.
        #[serde(default)]
        tied_at: u8,
    },
    /// A thing of the house, with its affinities and its owner; it rests after use and is never spent.
    Lucru {
        lucru: Lucru,
        fel: Vec<Fel>,
        owner: Option<Om>,
        /// Unavailable through this day (a thing used rests `lucru_odihna` closes).
        rests_until: u8,
        /// A pomana leaves at the close of this day; zero: it stays.
        leaves_at: u8,
    },
    Om {
        om: Om,
        fel: Vec<Fel>,
    },
    Loc {
        loc: Loc,
        fel: Fel,
    },
    /// A fragment of what they say of you: of every kind and nobody's (chapter §5).
    Frantura,
    /// A Minune stays on the cloth as a card: the sign the village tells (chapter §5). Its one use is M0b T5.
    Semn {
        fel: Fel,
    },
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct Card {
    pub id: u32,
    #[serde(flatten)]
    pub kind: Kind,
    pub at: Where,
    /// The day it came to the table.
    pub born: u8,
}

/// How the renderer reports a play (chapter §6). A fumble resolves as the skip does.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Grade {
    Slab,
    Bun,
    Minunat,
    Skipped,
}

/// An act committed: the Dor, the card it was dropped on, the verb that implies, and which half of
/// the day it was committed in. Its play is open until the renderer resolves it.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct Commit {
    pub dor: u32,
    pub on: u32,
    pub verb: Verb,
    pub night: bool,
}

/// A memory made, kept on its person's tally card (chapter §5): strength 0 faded, 1, 2 living, 3 a Minune.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct Amintire {
    pub fel: Fel,
    pub strength: u8,
    pub day: u8,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct Clock {
    /// When the day closes, in the renderer's milliseconds.
    pub day_ends_at: u64,
    /// When the night begins on its own; STINGE brings it forward.
    pub dusk_at: u64,
    /// Set while nobody is at the table (the tab is hidden): when the clock stopped.
    pub paused_at: Option<u64>,
    /// The pre-cue has sounded for this day.
    pub precued: bool,
    /// The day closes when the pre-cue ends (a rest).
    pub closing: bool,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Phase {
    /// The dark before they bring you home.
    Boot,
    Wake,
    /// The Bride stands in the dark door: your card on it is TRECI.
    Door,
    Ended,
}

/// The five endings (chapter §10).
#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Ending {
    Nunta,
    Ratacire,
    Uitare,
    Tarus,
    Dezlegare,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(tag = "event", rename_all = "snake_case")]
pub enum Event {
    /// They brought you home: the candle is lit at your head.
    BroughtHome,
    DayBegan,
    Dusk,
    Precue,
    DayClosed {
        early: bool,
    },
    Paused,
    Resumed,
    Arrived {
        card: u32,
        fel: Fel,
        from: Om,
        /// One more Dor from a held soroc's afterglow, above the day's caps.
        afterglow: bool,
    },
    /// A Dor nobody made anything of: Uitare rises.
    Guttered {
        card: u32,
        fel: Fel,
        tied: bool,
        uitare: u8,
    },
    Committed {
        dor: u32,
        on: u32,
        verb: Verb,
    },
    /// An act resolved with its play's grade: the Amintire's strength, and whether it was a Minune.
    Resolved {
        dor: u32,
        verb: Verb,
        grade: Grade,
        strength: u8,
        minune: bool,
        spaima: u8,
    },
    /// The living named you: Uitare taken off (or, at 0, a little more thought of you).
    Pomenire {
        n: u8,
        uitare: u8,
    },
    /// At dawn the sleeper did something about the dream: a thing on the table.
    Pomana {
        card: u32,
        from: Om,
    },
    Walked {
        loc: Loc,
        finds: Vec<u32>,
    },
    Listened {
        om: Om,
        card: u32,
    },
    Tied {
        dor: u32,
    },
    Untied {
        dor: u32,
    },
    Stinge {
        spaima: u8,
    },
    /// You lay back at dusk: the night passes, Putere refilled, the house calmer.
    Rested,
    SorocHeld {
        soroc: u8,
    },
    /// Nobody made coliva.
    SorocMissed {
        soroc: u8,
        uitare: u8,
    },
    /// The candle was not lit today.
    DarkDawn {
        uitare: u8,
    },
    /// Whether the house lights the candle for the coming day.
    Candle {
        lit: bool,
    },
    /// Your card leaves the plank for the cross.
    Buried,
    /// The priest reads the prayers of absolution: URNESTE and ARATA-TE corded through `until`.
    Priest {
        service: u8,
        until: u8,
    },
    /// The Bride stands in the dark door.
    BrideStands,
    Treci,
    /// You would not go.
    Ramai,
    Ended {
        ending: Ending,
    },
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct Entry {
    pub day: u8,
    #[serde(flatten)]
    pub event: Event,
}

/// The counts the page shows and the simulator prints; the integration test compares them.
#[derive(Clone, Debug, Default, PartialEq, Eq, Serialize, Deserialize)]
pub struct Stats {
    pub arrived: u32,
    pub guttered: u32,
    pub guttered_by_fel: [u32; 5],
    pub pomeniri: u32,
    pub pomeniri_noop: u32,
    pub soroace: Vec<u8>,
    pub missed: Vec<u8>,
    pub acts: u32,
    pub plays: u32,
    pub skipped: u32,
    pub rested: u32,
    pub uitare_peak: u8,
    pub spaima_peak: u8,
    pub putere_spent: u32,
    pub arata: u32,
    pub walks: u32,
    pub franturi_used: u32,
    pub cloth_peak: u32,
    pub kit_peak: u32,
    pub uitare_ge4: u32,
    pub dark_dawns: u32,
    pub pomane: u32,
    /// Amintiri made by strength: faded, one-point, living, Minune.
    pub amintiri: [u32; 4],
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct State {
    pub config: Config,
    pub phase: Phase,
    pub day: u8,
    /// The night half: the candle is out, or was never lit today.
    pub night: bool,
    pub clock: Clock,
    pub cards: Vec<Card>,
    /// The act whose play is open.
    pub commit: Option<Commit>,
    pub uitare: u8,
    pub spaima: u8,
    pub putere: u8,
    /// The house lit the candle for this day.
    pub candle: bool,
    /// Dawns in a row with Uitare under the candle's threshold (the relight's hysteresis).
    pub under: u8,
    /// The economy per source (Mama, Draguta, Frate, Dusman, Preot), thousandths.
    pub standing_m: [u32; 5],
    pub acc_m: [u32; 5],
    pub last_sent: [u8; 5],
    /// A held soroc's afterglow: one more Dor a day, from each source in turn.
    pub afterglow: Vec<Om>,
    /// The tally cards: each person's memories of you.
    pub amintiri: [Vec<Amintire>; 5],
    pub minuni: Vec<Fel>,
    /// A Minune holds the next soroc whatever Uitare is.
    pub minune_promise: bool,
    pub walked: Vec<Loc>,
    pub biserica_known: bool,
    /// Where you went tonight: the sleeper there is within reach.
    pub night_at: Option<Loc>,
    /// Last night's sleeper, and tonight's: the same sleeper two nights running wakes troubled.
    pub last_dream: Option<Om>,
    pub dreamed_tonight: Option<Om>,
    pub dreams_tonight: u8,
    /// A night act was committed: the troita is corded until dawn.
    pub night_acted: bool,
    pub rest_pending: bool,
    pub preot_until: u8,
    pub preot_services: u8,
    pub buried: bool,
    pub ending: Option<Ending>,
    pub treci: bool,
    pub stats: Stats,
    pub next_id: u32,
    /// Bumped on every change, so a renderer can skip frames where nothing happened.
    pub rev: u32,
    pub log: Vec<Entry>,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum Action {
    /// The boot: they bring you home and light the candle at your head.
    Begin,
    /// A Dor dropped on a thing (URNESTE), a sleeper (SOPTESTE, by night), a place or a person by
    /// day (ARATA-TE): the act is committed, its Putere spent, and its play opens.
    Place {
        dor: u32,
        on: u32,
    },
    /// The renderer reports the play's grade; the act resolves.
    Resolve {
        dor: u32,
        grade: Grade,
    },
    /// BANTUIE (the dead do not walk: you are there at once); its finds come to the kit row, its sleeper within reach.
    Bantuie {
        loc: u32,
    },
    /// ASCULTA: a fragment of what this person says of you.
    Asculta {
        om: u32,
    },
    Tie {
        dor: u32,
    },
    Untie {
        dor: u32,
    },
    /// STINGE: tap the flame; the night begins now.
    Stinge,
    /// ODIHNESTE-TE: lie back; dawn comes after the pre-cue.
    Rest,
    /// Moves the clock to `now`: dusk, the pre-cue and the close when they are due.
    Tick,
    CloseDay,
    Pause,
    Resume,
    /// Your card on the dark door, when the Bride stands in it.
    Treci,
    /// You would not go: the Bride stood in the door and you remain (Ratacire, chapter §10).
    Ramai,
    /// After an ending, or in her door: another wake from the dark, a new dead.
    Again,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Refusal {
    /// The wake is not running, or this is not the moment (a closing day, a paused clock).
    NotNow,
    NoSuchCard,
    /// Nothing here takes this card, or this card cannot be moved.
    DoesNotFit,
    /// A play is open: resolve it first.
    Busy,
    /// The priest's cord: URNESTE and ARATA-TE are tied shut while his service runs.
    Locked,
    /// No Putere left for this act.
    Tired,
    /// A dream, or the village, only by night.
    OnlyAtNight,
    /// The thing rests, or you have dreamed tonight already.
    Spent,
    /// The sill, or the fragments held, is full.
    Full,
    /// A night act was committed: the troita is corded until dawn.
    Corded,
}
