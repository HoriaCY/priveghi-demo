//! The dead's wake (SYSTEMS_v3_MORTUL.md): the engine the demo turns over to. It lives beside the
//! watcher's engine until the renderer follows it (M0b T1, step by step), so main keeps building.
//! Deterministic: the economy has no dice; `?seed=` has nothing left to seed here.
//! The contract a renderer is written against: docs/ENGINE_API.md.

pub mod config;
pub mod model;
pub mod rules;

pub use config::Config;
pub use model::*;
pub use rules::{
    forecast, forget_pow_m, legal_act_exists, match_points, new_state, sleepers, step, tick_due,
};

use serde::{Deserialize, Serialize};

/// The save's schema. Every bump either writes a migration from the version before it in
/// `Wake::from_save`, or states there that saves of the version before are refused: a save this
/// build cannot read is never silently taken for a new wake.
pub const SAVE_VERSION: u32 = 1;

/// The seat of the solo hand: every move in M0–M2. The rules ignore the seat (RULINGS R142).
pub const SOLO: u8 = 0;

/// One move: who (the seat), when (the injected clock), what. The journal is a list of these.
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct Move {
    pub seat: u8,
    pub at: u64,
    pub action: Action,
}

/// One wake: everything a save holds. Replaying `journal` from `origin` reproduces `state`.
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct Wake {
    pub version: u32,
    /// The state the journal starts from: a new wake's dark, or the state a save was migrated in.
    pub origin: State,
    pub journal: Vec<Move>,
    pub state: State,
}

/// Why a save does not load.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum SaveError {
    /// Written by a newer build (the website ahead of a phone's shell).
    Newer,
    /// Not a save of any version this build knows.
    Unreadable,
}

impl std::fmt::Display for SaveError {
    /// The serde name: the bridge throws it as the error's message.
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str(match self {
            SaveError::Newer => "newer",
            SaveError::Unreadable => "unreadable",
        })
    }
}

impl std::error::Error for SaveError {}

impl Wake {
    pub fn new(now_ms: u64) -> Wake {
        Wake::with_config(Config::default(), now_ms)
    }

    pub fn with_config(config: Config, now_ms: u64) -> Wake {
        let state = new_state(config, now_ms);
        Wake { version: SAVE_VERSION, origin: state.clone(), journal: Vec::new(), state }
    }

    /// The one door that changes a wake. `Ok(true)` when the state changed; an accepted move is
    /// journaled, a refusal records and changes nothing. Again begins the journal anew: a wake's
    /// journal never carries the wake before it.
    pub fn play(&mut self, mv: Move) -> Result<bool, Refusal> {
        let Some(next) = self.next(&mv)? else { return Ok(false) };
        let changed = next.rev != self.state.rev;
        if mv.action == Action::Again {
            self.origin = next.clone();
            self.journal.clear();
        } else {
            self.journal.push(mv);
        }
        self.state = next;
        Ok(changed)
    }

    /// What `play` would answer, recording nothing: the renderer asks before it lights a target.
    pub fn ask(&self, mv: &Move) -> Result<bool, Refusal> {
        Ok(self.next(mv)?.is_some_and(|next| next.rev != self.state.rev))
    }

    /// `play` from the solo seat.
    pub fn apply(&mut self, action: Action, now_ms: u64) -> Result<bool, Refusal> {
        self.play(Move { seat: SOLO, at: now_ms, action })
    }

    /// `ask` from the solo seat.
    pub fn probe(&self, action: Action, now_ms: u64) -> Result<bool, Refusal> {
        self.ask(&Move { seat: SOLO, at: now_ms, action })
    }

    /// The journal folded over `origin`; on a refusal, the index of the move refused.
    pub fn replay(&self) -> Result<State, (usize, Refusal)> {
        let mut s = self.origin.clone();
        for (i, mv) in self.journal.iter().enumerate() {
            s = step(&s, mv.action.clone(), mv.at).map_err(|r| (i, r))?;
        }
        Ok(s)
    }

    pub fn to_save(&self) -> String {
        serde_json::to_string(self).expect("a wake serialises")
    }

    /// Loads what `to_save` wrote, or a save from before the version (`{"state": …}`), which goes on
    /// as this version with its journal beginning here. A newer build's save is refused, never guessed at.
    pub fn from_save(json: &str) -> Result<Wake, SaveError> {
        #[derive(Deserialize)]
        struct V0 {
            state: State,
        }
        let value: serde_json::Value = serde_json::from_str(json).map_err(|_| SaveError::Unreadable)?;
        let version = match value.get("version") {
            None => 0,
            Some(v) => v.as_u64().ok_or(SaveError::Unreadable)?,
        };
        match version {
            0 => {
                let V0 { state } = serde_json::from_value(value).map_err(|_| SaveError::Unreadable)?;
                Ok(Wake { version: SAVE_VERSION, origin: state.clone(), journal: Vec::new(), state })
            }
            v if v == u64::from(SAVE_VERSION) => {
                serde_json::from_value(value).map_err(|_| SaveError::Unreadable)
            }
            v if v > u64::from(SAVE_VERSION) => Err(SaveError::Newer),
            // a version between 0 and this one whose migration was never written
            _ => Err(SaveError::Unreadable),
        }
    }

    /// The renderer ticks ten times a second; a tick with nothing due copies nothing and is `None`.
    fn next(&self, mv: &Move) -> Result<Option<State>, Refusal> {
        if mv.action == Action::Tick && !tick_due(&self.state, mv.at) {
            return Ok(None);
        }
        step(&self.state, mv.action.clone(), mv.at).map(Some)
    }
}
