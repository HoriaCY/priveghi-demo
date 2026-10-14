//! Every rules number in one place. Defaults follow SYSTEMS_v2_1.md where it and the demo brief
//! overlap, else the brief; each knob names its source. Renderer timings live in src/tuning.ts.

use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct Config {
    /// Length of one day. Chapter §3 `zi_s` 60 s (the brief's §2 says 45 s; see RULINGS.md).
    pub zi_ms: u64,
    /// The flame gutters with a dry tick this long before the close (Telegraph Law). Chapter §3 `precue_s`.
    pub precue_ms: u64,
    /// Days in the wake. Chapter §12 "M0 wake 9"; brief §3.6.
    pub zile: u8,
    /// Full days a loose Fir de dor lasts; it rots to Jale at the close that empties it. Chapter §6.1 `dor_zile`.
    pub dor_zile: u8,
    /// Dor one BOCESTE sitting takes. Chapter §6.1 "3 to 6", `boci_max`.
    pub boci_min: u8,
    pub boci_max: u8,
    /// Days a Dor sitting runs (chapter §6.1) and a Jale sitting runs (chapter §6.2).
    pub boci_dor_zile: u8,
    pub boci_jale_zile: u8,
    /// Days a wander takes. Chapter §5, Codrii Vlasiei.
    pub umbla_zile: u8,
    /// Dor sung for each lit pip and each Bocet card. Chapter §6.3, first threshold.
    pub dor_per_bocet: u32,
    /// The table candle's wax at the start, and its whole height. Chapter §6.4 `kit_wax`; RULINGS R19.
    pub kit_wax: u8,
    /// The candle burns one notch at every close of a day divisible by this. Chapter §6.4 `ceara_zile`.
    pub ceara_zile: u8,
    /// The watcher's Vigoare pips; a dark close costs one. Chapter §6.4 `vigoare`.
    pub vigoare: u8,
    /// Dark closes forgiven before the first pip goes. Chapter §6.4 `wax_grace`.
    pub wax_grace: u8,
    /// Fir de dor the troita's sill can hold tied. Chapter §6.1 `sill`; brief §3.3.
    pub sill: u8,
    /// Jale that break the watcher (Frant). Chapter §6.2; brief §3.6.
    pub jale_frant: u8,
}

impl Default for Config {
    fn default() -> Self {
        Config {
            zi_ms: 60_000,
            precue_ms: 400,
            zile: 9,
            dor_zile: 3,
            boci_min: 3,
            boci_max: 6,
            boci_dor_zile: 2,
            boci_jale_zile: 1,
            umbla_zile: 1,
            dor_per_bocet: 3,
            kit_wax: 5,
            ceara_zile: 3,
            vigoare: 3,
            wax_grace: 0,
            sill: 3,
            jale_frant: 3,
        }
    }
}
