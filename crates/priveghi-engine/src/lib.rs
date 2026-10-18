//! Priveghi demo engine: the dead's wake (SYSTEMS_v3_MORTUL.md). The renderer sends actions and
//! draws the state it gets back; every rule lives here, every rule is tested here (`cargo test`).
//! The watcher's engine (the first fiction) left at step 6 of the turnover; the module keeps the
//! name `v3` the tests and the bridge were written against (RULINGS R139).

pub mod v3;

// the browser's target only (wasm-pack builds wasm32-unknown-unknown): the rules' tests also run on
// wasm32-wasip1 under wasmtime, where wasm-bindgen has no host (RULINGS R163)
#[cfg(all(target_arch = "wasm32", target_os = "unknown"))]
mod wasm;

pub use v3::{Config, Wake};
