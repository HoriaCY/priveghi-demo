//! The state of one wake, the actions a hand can take, and the beats the engine logs.
//! Code ids are Romanian-ASCII; every display string lives in the renderer's strings file.

use std::collections::BTreeMap;

use serde::{Deserialize, Serialize};

use crate::config::Config;

/// The sixteen card types of the demo (brief §3.4).
#[derive(Clone, Copy, Debug, PartialEq, Eq, PartialOrd, Ord, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Kind {
    Rada,
    Negustor,
    CelNenuntit,
    CodriiVlasiei,
    Plosca,
    Lumanare,
    Sare,
    Fier,
    Grau,
    Coliva,
    FirDeDor,
    CantecDeLeagan,
    Nume,
    Bocet,
    Jale,
    Binecuvantare,
}

/// Told on the table by ground value (brief §2.7): people on Ceara, places on Pamant Ud,
/// objects on Alb de Var, knowledge and states on soot-paper.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Class {
    Person,
    Place,
    Object,
    Knowledge,
}

impl Kind {
    pub fn class(self) -> Class {
        use Kind::*;
        match self {
            Rada | Negustor | CelNenuntit => Class::Person,
            CodriiVlasiei => Class::Place,
            Plosca | Lumanare | Sare | Fier | Grau | Coliva => Class::Object,
            FirDeDor | CantecDeLeagan | Nume | Bocet | Jale | Binecuvantare => Class::Knowledge,
        }
    }
}

/// The screen of verbs. Declaration order is slot order: left to right on the table, and the
/// order verbs resolve in at the close (brief §3.6).
#[derive(Clone, Copy, Debug, PartialEq, Eq, PartialOrd, Ord, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Niche {
    Troita,
    Umbla,
    Asculta,
    Descanta,
    Boci,
    Gazdui,
}

impl Niche {
    pub const ORDER: [Niche; 6] =
        [Niche::Troita, Niche::Umbla, Niche::Asculta, Niche::Descanta, Niche::Boci, Niche::Gazdui];
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Loc {
    Table,
    Niche(Niche),
    /// Cel Nenuntit's plank at the cloth's far left; he never leaves it.
    Plank,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct Card {
    pub id: u32,
    pub kind: Kind,
    pub at: Loc,
    /// Fir de dor: grains left on its three-grain row. Zero on every other card.
    pub grains: u8,
    /// The day it arrived. Nothing counts down at the close of the day it arrived (chapter §3).
    pub born: u8,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Target {
    Niche(Niche),
}

/// What a niche was committed to at the close that started it. Sealed until it resolves.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(tag = "recipe", rename_all = "snake_case")]
pub enum Recipe {
    Wander { place: Kind, lit: bool },
    MournDor { n: u8 },
    MournJale,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct Run {
    pub recipe: Recipe,
    /// How many closes the verb runs in all; the niche's taper burns down in these steps.
    pub days: u8,
    /// Closes still to come, this one included, before it resolves.
    pub days_left: u8,
    pub started: u8,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct Clock {
    /// When the day closes, in the renderer's milliseconds.
    pub day_ends_at: u64,
    /// Set while nobody is at the table (the tab is hidden): the time the day still had.
    pub paused_left: Option<u64>,
    /// The pre-cue has sounded for this day.
    pub precued: bool,
    /// The flame was tapped: the day closes when the pre-cue ends.
    pub closing: bool,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Phase {
    Wake,
    Ended,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(tag = "event", rename_all = "snake_case")]
pub enum Event {
    DayBegan,
    Precue,
    DayClosed {
        early: bool,
    },
    Placed {
        cards: Vec<u32>,
        target: Target,
    },
    Unplaced {
        cards: Vec<u32>,
    },
    Started {
        niche: Niche,
        recipe: Recipe,
    },
    /// A niche that could not start gave its cards back to the table.
    Returned {
        niche: Niche,
        cards: Vec<u32>,
    },
    Decayed {
        card: u32,
        grains: u8,
    },
    Rotted {
        card: u32,
        jale: u32,
    },
    Resolved {
        niche: Niche,
    },
    Arrived {
        card: u32,
        kind: Kind,
    },
    Consumed {
        card: u32,
        kind: Kind,
    },
    Pip {
        bocete: u32,
    },
    JaleMourned {
        n: u32,
    },
    Ended,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct Entry {
    pub day: u8,
    #[serde(flatten)]
    pub event: Event,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct State {
    pub config: Config,
    pub phase: Phase,
    pub day: u8,
    pub clock: Clock,
    pub cards: Vec<Card>,
    pub runs: BTreeMap<Niche, Run>,
    /// Wanders taken per place; the pool is a sequence (brief §3.5).
    pub wanders: BTreeMap<Kind, u32>,
    /// Dor sung to Rada, all sittings together.
    pub sung: u32,
    /// Lit pips: one per `dor_per_bocet` Dor sung.
    pub bocete: u32,
    pub next_id: u32,
    /// Bumped on every change, so a renderer can skip frames where nothing happened.
    pub rev: u32,
    pub log: Vec<Entry>,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum TapOn {
    Flame,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum Action {
    Place {
        cards: Vec<u32>,
        target: Target,
    },
    Unplace {
        cards: Vec<u32>,
    },
    /// Moves the clock to `now`: sounds the pre-cue and closes the day when they are due.
    Tick,
    CloseDay,
    Tap {
        on: TapOn,
    },
    Pause,
    Resume,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Refusal {
    /// The wake is not running.
    NotNow,
    NoSuchCard,
    /// The card never leaves its place (Cel Nenuntit on the plank).
    Fixed,
    /// The niche is working; its cards are sealed until it resolves.
    Busy,
    /// Nothing here takes this card.
    DoesNotFit,
    /// No cards given, or none of them in a niche.
    Nothing,
}
