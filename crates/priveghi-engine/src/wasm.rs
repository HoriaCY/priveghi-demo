//! Browser bindings. The state crosses the boundary as JSON (brief §4): the renderer sends an
//! action, reads the state back, and draws it. Nothing on the JavaScript side decides a rule.

use wasm_bindgen::prelude::*;

use crate::{Action, Game};

#[wasm_bindgen]
pub struct Engine {
    game: Game,
}

#[wasm_bindgen]
impl Engine {
    /// A new wake. `seed` comes from `?seed=`; `now_ms` is the renderer's clock.
    #[wasm_bindgen(constructor)]
    pub fn new(seed: f64, now_ms: f64) -> Engine {
        Engine { game: Game::new(seed as u64, now_ms as u64) }
    }

    /// Loads what `save()` wrote.
    pub fn load(save: &str) -> Result<Engine, JsError> {
        let game: Game = serde_json::from_str(save).map_err(|e| JsError::new(&e.to_string()))?;
        Ok(Engine { game })
    }

    pub fn save(&self) -> String {
        serde_json::to_string(&self.game).expect("a game serialises")
    }

    pub fn state(&self) -> String {
        serde_json::to_string(&self.game.state).expect("a state serialises")
    }

    /// What `apply` would answer for this action, without applying it.
    pub fn probe(&self, action: &str, now_ms: f64) -> Result<String, JsError> {
        let action: Action = serde_json::from_str(action).map_err(|e| JsError::new(&e.to_string()))?;
        Ok(answer(self.game.probe(action, now_ms as u64)))
    }

    /// Applies an action given as JSON. Answers `{"ok":true,"changed":…}` or `{"ok":false,"refusal":…}`.
    pub fn apply(&mut self, action: &str, now_ms: f64) -> Result<String, JsError> {
        let action: Action = serde_json::from_str(action).map_err(|e| JsError::new(&e.to_string()))?;
        Ok(answer(self.game.apply(action, now_ms as u64)))
    }
}

fn answer(result: Result<bool, crate::Refusal>) -> String {
    match result {
        Ok(changed) => serde_json::json!({ "ok": true, "changed": changed }),
        Err(refusal) => serde_json::json!({ "ok": false, "refusal": refusal }),
    }
    .to_string()
}
