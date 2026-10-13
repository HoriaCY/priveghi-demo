//! Priveghi demo engine. The renderer sends actions and draws the state it gets back;
//! every rule lives here, every rule is tested here (`cargo test`).

pub mod config;
pub mod model;
pub mod rng;
pub mod rules;

#[cfg(target_arch = "wasm32")]
mod wasm;

pub use config::Config;
pub use model::*;
pub use rng::Rng;
pub use rules::{new_state, step};

use serde::{Deserialize, Serialize};

/// A wake and its dice: everything a save holds.
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct Game {
    pub state: State,
    pub rng: Rng,
}

impl Game {
    pub fn new(seed: u64, now_ms: u64) -> Game {
        Game::with_config(Config::default(), seed, now_ms)
    }

    pub fn with_config(config: Config, seed: u64, now_ms: u64) -> Game {
        Game { state: new_state(config, now_ms), rng: Rng::new(seed) }
    }

    /// Applies one action. `Ok(true)` when the state changed; a refusal changes nothing.
    pub fn apply(&mut self, action: Action, now_ms: u64) -> Result<bool, Refusal> {
        let mut rng = self.rng.clone();
        let next = step(&self.state, action, now_ms, &mut rng)?;
        let changed = next.rev != self.state.rev;
        self.state = next;
        self.rng = rng;
        Ok(changed)
    }
}
