//! The dead's wake (SYSTEMS_v3_MORTUL.md): the engine the demo turns over to. It lives beside the
//! watcher's engine until the renderer follows it (M0b T1, step by step), so main keeps building.
//! Deterministic: the economy has no dice; `?seed=` has nothing left to seed here.

pub mod config;
pub mod model;
pub mod rules;

pub use config::Config;
pub use model::*;
pub use rules::{
    forecast, forget_pow_m, legal_act_exists, match_points, new_state, sleepers, step, tick_due,
};

use serde::{Deserialize, Serialize};

/// One wake: everything a save holds.
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct Wake {
    pub state: State,
}

impl Wake {
    pub fn new(now_ms: u64) -> Wake {
        Wake::with_config(Config::default(), now_ms)
    }

    pub fn with_config(config: Config, now_ms: u64) -> Wake {
        Wake { state: new_state(config, now_ms) }
    }

    /// What `apply` would answer, without applying it: the renderer asks before it lights a target.
    pub fn probe(&self, action: Action, now_ms: u64) -> Result<bool, Refusal> {
        self.clone().apply(action, now_ms)
    }

    /// Applies one action. `Ok(true)` when the state changed; a refusal changes nothing.
    pub fn apply(&mut self, action: Action, now_ms: u64) -> Result<bool, Refusal> {
        // the renderer ticks ten times a second; most ticks have nothing due and copy nothing
        if action == Action::Tick && !tick_due(&self.state, now_ms) {
            return Ok(false);
        }
        let next = step(&self.state, action, now_ms)?;
        let changed = next.rev != self.state.rev;
        self.state = next;
        Ok(changed)
    }
}
