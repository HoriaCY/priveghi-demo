//! Browser bindings for the dead's wake (the renderer turned over at step 2, RULINGS R60). The state
//! crosses the boundary as JSON (brief §4): the renderer sends an action, reads the state back, and
//! draws it. Nothing on the JavaScript side decides a rule; the projections only the rules can make
//! (the forecast, a match in points) are asked of the engine.

use wasm_bindgen::prelude::*;

use crate::v3::{forecast, match_points, Action, Kind, Wake};

#[wasm_bindgen]
pub struct Engine {
    wake: Wake,
}

#[wasm_bindgen]
impl Engine {
    /// A new wake in the dark; `now_ms` is the renderer's clock. The economy has no dice: nothing to seed.
    #[wasm_bindgen(constructor)]
    pub fn new(now_ms: f64) -> Engine {
        Engine { wake: Wake::new(now_ms as u64) }
    }

    /// Loads what `save()` wrote.
    pub fn load(save: &str) -> Result<Engine, JsError> {
        let wake: Wake = serde_json::from_str(save).map_err(|e| JsError::new(&e.to_string()))?;
        Ok(Engine { wake })
    }

    pub fn save(&self) -> String {
        serde_json::to_string(&self.wake).expect("a wake serialises")
    }

    /// The state, with the forecast beside it: Uitare at the next three dawns if nothing is done.
    pub fn state(&self) -> String {
        let mut v = serde_json::to_value(&self.wake.state).expect("a state serialises");
        v["forecast"] = serde_json::json!(forecast(&self.wake.state));
        v.to_string()
    }

    /// What `apply` would answer for this action, without applying it.
    pub fn probe(&self, action: &str, now_ms: f64) -> Result<String, JsError> {
        let action: Action = serde_json::from_str(action).map_err(|e| JsError::new(&e.to_string()))?;
        Ok(answer(self.wake.probe(action, now_ms as u64)))
    }

    /// Applies an action given as JSON. Answers `{"ok":true,"changed":…}` or `{"ok":false,"refusal":…}`.
    pub fn apply(&mut self, action: &str, now_ms: f64) -> Result<String, JsError> {
        let action: Action = serde_json::from_str(action).map_err(|e| JsError::new(&e.to_string()))?;
        Ok(answer(self.wake.apply(action, now_ms as u64)))
    }

    /// What this Dor would make on this card, in points (chapter §5), or -1 if the drop would be
    /// refused now. The strip names it before the hand commits.
    pub fn matches(&self, dor: u32, on: u32, now_ms: f64) -> i32 {
        if self.wake.probe(Action::Place { dor, on }, now_ms as u64).is_err() {
            return -1;
        }
        let s = &self.wake.state;
        let (fel, from) = match s.cards.iter().find(|c| c.id == dor).map(|c| &c.kind) {
            Some(Kind::Dor { fel, from, .. }) => (*fel, *from),
            _ => return -1,
        };
        match s.cards.iter().find(|c| c.id == on) {
            Some(target) => i32::from(match_points(fel, from, target)),
            None => -1,
        }
    }
}

fn answer(result: Result<bool, crate::v3::Refusal>) -> String {
    match result {
        Ok(changed) => serde_json::json!({ "ok": true, "changed": changed }),
        Err(refusal) => serde_json::json!({ "ok": false, "refusal": refusal }),
    }
    .to_string()
}
